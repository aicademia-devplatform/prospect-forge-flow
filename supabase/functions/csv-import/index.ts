import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

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
          onConflict: 'email', // Use email as unique identifier
          ignoreDuplicates: false, // Update existing records
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
    const { error: updateError } = await supabaseClient
      .from('import_history')
      .update({
        status: failedCount === dataToImport.length ? 'failed' : 'completed',
        success_rows: successCount,
        failed_rows: failedCount,
        completed_at: new Date().toISOString(),
        error_details: errors.length > 0 ? errors : null,
      })
      .eq('id', importRecord.id);

    if (updateError) {
      console.error('Error updating import history:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        importId: importRecord.id,
        totalRows: dataToImport.length,
        successRows: successCount,
        failedRows: failedCount,
        errors: errors.length > 0 ? errors : undefined,
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
