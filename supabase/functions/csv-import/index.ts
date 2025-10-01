import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportRequest {
  targetTable: 'crm_contacts' | 'apollo_contacts';
  columnMapping: Record<string, string>;
  rows: any[][];
  headers: string[];
  fileName: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { targetTable, columnMapping, rows, headers, fileName }: ImportRequest = await req.json();

    console.log(`Starting import for user ${user.id} into ${targetTable}`);
    console.log(`File: ${fileName}, Rows: ${rows.length}`);

    // Get user profile for email
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('email, first_name, last_name')
      .eq('id', user.id)
      .single();

    // Create import history record
    const { data: importRecord, error: historyError } = await supabaseClient
      .from('import_history')
      .insert({
        user_id: user.id,
        target_table: targetTable,
        file_name: fileName,
        total_rows: rows.length,
        column_mapping: columnMapping,
        status: 'pending',
      })
      .select()
      .single();

    if (historyError || !importRecord) {
      console.error('Error creating import history:', historyError);
      throw new Error('Failed to create import history');
    }

    // Process data transformation
    const dataToImport = rows.map((row) => {
      const mappedRow: any = {};
      
      headers.forEach((header, index) => {
        const targetField = columnMapping[header];
        if (targetField && targetField !== 'ignore') {
          const value = row[index];
          // Convert empty strings to null
          mappedRow[targetField] = value === '' ? null : value;
        }
      });

      return mappedRow;
    }).filter((row) => row.email); // Only import rows with email

    console.log(`Prepared ${dataToImport.length} rows for upsert`);

    // Start background processing
    const backgroundTask = async () => {
      let successCount = 0;
      let failedCount = 0;
      const errors: any[] = [];

      // Upsert data in batches of 100
      const batchSize = 100;
      for (let i = 0; i < dataToImport.length; i += batchSize) {
        const batch = dataToImport.slice(i, i + batchSize);
        
        const { data, error } = await supabaseClient
          .from(targetTable)
          .upsert(batch, {
            onConflict: 'email',
            ignoreDuplicates: false,
          });

        if (error) {
          console.error(`Batch ${i / batchSize + 1} error:`, error);
          failedCount += batch.length;
          errors.push({
            batch: i / batchSize + 1,
            error: error.message,
            rows: batch.length,
          });
        } else {
          successCount += batch.length;
          console.log(`Batch ${i / batchSize + 1} imported successfully`);
        }
      }

      // Update import history with results
      const finalStatus = failedCount === dataToImport.length ? 'failed' : 'completed';
      await supabaseClient
        .from('import_history')
        .update({
          status: finalStatus,
          success_rows: successCount,
          failed_rows: failedCount,
          completed_at: new Date().toISOString(),
          error_details: errors.length > 0 ? errors : null,
        })
        .eq('id', importRecord.id);

      // Create in-app notification
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: user.id,
          type: finalStatus === 'completed' ? 'import_success' : 'import_failed',
          title: finalStatus === 'completed' ? 'Import terminé' : 'Échec de l\'import',
          message: `Import de ${fileName}: ${successCount} lignes importées${failedCount > 0 ? `, ${failedCount} échecs` : ''}`,
          data: {
            import_id: importRecord.id,
            file_name: fileName,
            success_rows: successCount,
            failed_rows: failedCount,
          },
        });

      // Send email notification
      if (profile?.email) {
        try {
          const client = new SMTPClient({
            connection: {
              hostname: 'smtp.gmail.com',
              port: 465,
              tls: true,
              auth: {
                username: Deno.env.get('GMAIL_USER')!,
                password: Deno.env.get('GMAIL_APP_PASSWORD')!,
              },
            },
          });

          const emailSubject = finalStatus === 'completed' 
            ? `✅ Import terminé - ${fileName}` 
            : `❌ Échec de l'import - ${fileName}`;

          const emailBody = `
            <h2>${emailSubject}</h2>
            <p>Bonjour ${profile.first_name || ''},</p>
            <p>Votre importation est terminée.</p>
            <ul>
              <li><strong>Fichier:</strong> ${fileName}</li>
              <li><strong>Table cible:</strong> ${targetTable}</li>
              <li><strong>Lignes importées:</strong> ${successCount}</li>
              ${failedCount > 0 ? `<li><strong>Lignes échouées:</strong> ${failedCount}</li>` : ''}
            </ul>
            <p>Consultez votre tableau de bord pour plus de détails.</p>
          `;

          await client.send({
            from: Deno.env.get('GMAIL_USER')!,
            to: profile.email,
            subject: emailSubject,
            content: emailBody,
            html: emailBody,
          });

          await client.close();
          console.log('Email notification sent to:', profile.email);
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
        }
      }
    };

    // Start background task
    EdgeRuntime.waitUntil(backgroundTask());

    // Return immediately
    return new Response(
      JSON.stringify({
        success: true,
        importId: importRecord.id,
        message: 'Import started in background',
        status: 'pending',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred during import',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
