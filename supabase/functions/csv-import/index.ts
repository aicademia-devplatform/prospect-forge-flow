import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportRequest {
  targetTable: 'crm_contacts' | 'apollo_contacts' | 'prospects';
  columnMapping: Record<string, string>;
  rows: any[][];
  headers: string[];
  fileName: string;
}

Deno.serve(async (req) => {
  console.log('=== CSV Import Function Called ===');
  console.log('Method:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Creating Supabase client...');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    console.log('Getting authenticated user...');
    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User authenticated:', user.id);
    console.log('Parsing request body...');
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

    // Helper function to parse various date formats
    const parseDate = (value: any): string | null => {
      if (!value || value === '') return null;
      
      const stringValue = String(value).trim();
      
      // Skip invalid text dates
      if (stringValue.match(/[a-zA-Z]{3,}/) && !stringValue.match(/^\d{1,2}\/\d{1,2}$/)) {
        // Contains text that's not a short date -> invalid
        return null;
      }
      
      // Excel date (number of days since 1900-01-01)
      const numValue = Number(stringValue);
      if (!isNaN(numValue) && numValue > 1000 && numValue < 100000) {
        // It's an Excel date
        const excelEpoch = new Date(1899, 11, 30); // Excel epoch (Dec 30, 1899)
        const date = new Date(excelEpoch.getTime() + numValue * 86400000);
        return date.toISOString();
      }
      
      // French date formats: DD/MM/YY or DD/MM/YYYY
      const frenchDate = stringValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
      if (frenchDate) {
        const [_, day, month, year] = frenchDate;
        const fullYear = year.length === 2 ? `20${year}` : year;
        const date = new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
      
      // Partial dates: DD/MM -> convert to current year
      const partialDate = stringValue.match(/^(\d{1,2})\/(\d{1,2})$/);
      if (partialDate) {
        const [_, day, month] = partialDate;
        const currentYear = new Date().getFullYear();
        const date = new Date(`${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
      
      // ISO date
      const isoDate = new Date(stringValue);
      if (!isNaN(isoDate.getTime())) {
        return isoDate.toISOString();
      }
      
      // If all else fails, return null
      return null;
    };

    // Define numeric fields that need special handling
    const numericFields = [
      'primary_intent_score', 'secondary_intent_score', 'annual_revenue',
      'total_funding', 'latest_funding', 'latest_funding_amount',
      'nb_employees', 'num_employees', 'number_of_retail_locations'
    ];
    
    // Define date fields
    const dateFields = ['date_action', 'callback_date'];

    // Process data transformation
    const dataToImport = rows.map((row) => {
      const mappedRow: any = {};
      
      headers.forEach((header, index) => {
        const targetField = columnMapping[header];
        if (targetField && targetField !== 'ignore') {
          let value = row[index];
          
          // Convert empty strings to null
          if (value === '' || value === null || value === undefined) {
            mappedRow[targetField] = null;
            return;
          }

          // Handle date fields
          if (dateFields.includes(targetField)) {
            mappedRow[targetField] = parseDate(value);
            return;
          }

          // Handle numeric fields - convert to number or null if invalid
          if (numericFields.includes(targetField)) {
            // Remove common non-numeric characters (currency symbols, commas, etc.)
            const cleanedValue = String(value).replace(/[$,€£¥]/g, '').trim();
            const numValue = Number(cleanedValue);
            
            // If it's a valid number, use it, otherwise set to null
            mappedRow[targetField] = !isNaN(numValue) && cleanedValue !== '' ? numValue : null;
          } else {
            // Truncate long strings for varchar fields (max 255 chars as safe default)
            const stringValue = String(value);
            mappedRow[targetField] = stringValue.length > 255 ? stringValue.substring(0, 255) : value;
          }
        }
      });

      return mappedRow;
    }).filter((row) => {
      // For prospects table, filter by lead_email; for contacts, filter by email
      return targetTable === 'prospects' ? row.lead_email : row.email;
    });

    console.log(`Prepared ${dataToImport.length} rows for upsert`);
    
    // Si moins de 10 lignes, faire l'import de manière synchrone pour faciliter le debug
    const shouldRunSync = dataToImport.length < 10;
    console.log(`Running import ${shouldRunSync ? 'synchronously' : 'in background'}`);

    // Start background processing
    const backgroundTask = async () => {
      let successCount = 0;
      let failedCount = 0;
      const errors: any[] = [];

      if (targetTable === 'prospects') {
        // Logique spéciale pour l'import de prospects
        // 1. Importer les données du contact dans crm_contacts
        // 2. Créer l'assignation dans sales_assignments ou prospects_traites
        for (const row of dataToImport) {
          try {
            const email = row.lead_email;
            if (!email) {
              throw new Error('Email manquant pour le prospect');
            }

            // Séparer les données du contact (pour crm_contacts) et les données d'assignation
            const contactData: any = {};
            const assignmentData: any = {
              lead_email: email,
              sales_user_id: user.id,
              assigned_by: user.id,
              source_table: 'crm_contacts',
            };

            // Mapper les champs vers crm_contacts
            // Les champs de contact vont dans crm_contacts, le reste dans assignmentData
            const contactFields = [
              'email', 'firstname', 'name', 'address', 'city', 'departement', 'country',
              'tel_pro', 'tel', 'mobile', 'mobile_2', 'company', 'nb_employees',
              'linkedin_function', 'industrie', 'linkedin_url', 'linkedin_company_url',
              'company_website', 'systemeio_list', 'apollo_list', 'brevo_tag', 'zoho_tag',
              'zoho_status', 'apollo_status', 'arlynk_status', 'aicademia_high_status',
              'aicademia_low_status', 'full_name', 'contact_active', 'data_section'
            ];

            // Champs d'assignation/statut
            const assignmentFields = [
              'statut_prospect', 'notes_sales', 'date_action'
            ];

            // S'assurer que l'email est toujours dans contactData
            contactData.email = email;

            // Répartir les données
            Object.keys(row).forEach(key => {
              if (key === 'lead_email') {
                // Déjà géré au-dessus
                return;
              } else if (contactFields.includes(key)) {
                contactData[key] = row[key];
              } else if (assignmentFields.includes(key)) {
                assignmentData[key] = row[key];
              } else {
                // Les autres champs vont dans custom_data
                if (!assignmentData.custom_data) {
                  assignmentData.custom_data = {};
                }
                assignmentData.custom_data[key] = row[key];
              }
            });

            // 1. Upsert dans crm_contacts
            console.log(`Upserting contact: ${email}`);
            const { data: contact, error: contactError } = await supabaseClient
              .from('crm_contacts')
              .upsert(contactData, {
                onConflict: 'email',
                ignoreDuplicates: false,
              })
              .select('id, email')
              .single();

            if (contactError) {
              console.error('Error upserting contact:', contactError);
              throw new Error(`Failed to upsert contact ${email}: ${contactError.message}`);
            }

            if (!contact || !contact.id) {
              throw new Error(`No contact returned after upsert for ${email}`);
            }

            // Ajouter l'ID du contact dans l'assignation
            assignmentData.source_id = contact.id.toString();
            console.log(`Contact upserted with ID: ${contact.id}`);

            // 2. Créer l'assignation selon le statut
            // Si statut_prospect est défini, c'est un prospect déjà traité
            // Sinon, c'est un prospect à traiter
            if (assignmentData.statut_prospect) {
              // Prospect déjà traité → prospects_traites
              // On doit d'abord créer une assignation temporaire pour avoir un original_assignment_id
              console.log(`Creating temporary assignment for ${email}`);
              const { data: tempAssignment, error: tempAssignError } = await supabaseClient
                .from('sales_assignments')
                .insert({
                  lead_email: email,
                  sales_user_id: user.id,
                  assigned_by: user.id,
                  source_table: 'crm_contacts',
                  source_id: assignmentData.source_id,
                })
                .select('id')
                .single();
              
              if (tempAssignError || !tempAssignment) {
                console.error('Error creating temporary assignment:', tempAssignError);
                throw new Error(`Failed to create temporary assignment for ${email}: ${tempAssignError?.message}`);
              }
              
              console.log(`Inserting into prospects_traites for ${email} with original_assignment_id: ${tempAssignment.id}`);
              const { error: traiteError } = await supabaseClient
                .from('prospects_traites')
                .insert({
                  original_assignment_id: tempAssignment.id,
                  sales_user_id: user.id,
                  sdr_id: user.id,
                  source_table: 'crm_contacts',
                  source_id: assignmentData.source_id,
                  lead_email: email,
                  assigned_by: user.id,
                  assigned_at: new Date().toISOString(),
                  completed_at: new Date().toISOString(),
                  statut_prospect: assignmentData.statut_prospect,
                  notes_sales: assignmentData.notes_sales || null,
                  date_action: assignmentData.date_action || null,
                  custom_data: assignmentData.custom_data || null,
                });
              
              if (traiteError) {
                console.error('Error inserting into prospects_traites:', traiteError);
                throw new Error(`Failed to insert into prospects_traites for ${email}: ${traiteError.message}`);
              }
              
              // Supprimer l'assignation temporaire
              await supabaseClient
                .from('sales_assignments')
                .delete()
                .eq('id', tempAssignment.id);
            } else {
              // Prospect à traiter → sales_assignments
              console.log(`Inserting into sales_assignments for ${email}`);
              const { error: assignError } = await supabaseClient
                .from('sales_assignments')
                .insert(assignmentData);
              
              if (assignError) {
                console.error('Error inserting into sales_assignments:', assignError);
                throw new Error(`Failed to insert into sales_assignments for ${email}: ${assignError.message}`);
              }
            }
            
            console.log(`Successfully imported prospect: ${email}`);
            successCount++;
          } catch (error) {
            console.error('Error importing prospect:', error);
            failedCount++;
            errors.push({
              row: row.lead_email,
              error: error.message,
            });
          }
        }
      } else {
        // Upsert data in batches of 100 pour crm_contacts et apollo_contacts
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

    if (shouldRunSync) {
      // Exécution synchrone pour debug
      console.log('Running synchronously...');
      await backgroundTask();
      
      // Récupérer le statut final
      const { data: finalRecord } = await supabaseClient
        .from('import_history')
        .select('status, success_rows, failed_rows')
        .eq('id', importRecord.id)
        .single();
      
      return new Response(
        JSON.stringify({
          success: true,
          importId: importRecord.id,
          successRows: finalRecord?.success_rows || 0,
          failedRows: finalRecord?.failed_rows || 0,
          status: finalRecord?.status || 'completed',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      // Start background task (fire and forget)
      backgroundTask().catch(err => {
        console.error('Background task error:', err);
      });

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
    }
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



    if (shouldRunSync) {
      // Exécution synchrone pour debug
      console.log('Running synchronously...');
      await backgroundTask();
      
      // Récupérer le statut final
      const { data: finalRecord } = await supabaseClient
        .from('import_history')
        .select('status, success_rows, failed_rows')
        .eq('id', importRecord.id)
        .single();
      
      return new Response(
        JSON.stringify({
          success: true,
          importId: importRecord.id,
          successRows: finalRecord?.success_rows || 0,
          failedRows: finalRecord?.failed_rows || 0,
          status: finalRecord?.status || 'completed',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      // Start background task (fire and forget)
      backgroundTask().catch(err => {
        console.error('Background task error:', err);
      });


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

    }
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



    if (shouldRunSync) {
      // Exécution synchrone pour debug
      console.log('Running synchronously...');
      await backgroundTask();
      
      // Récupérer le statut final
      const { data: finalRecord } = await supabaseClient
        .from('import_history')
        .select('status, success_rows, failed_rows')
        .eq('id', importRecord.id)
        .single();
      
      return new Response(
        JSON.stringify({
          success: true,
          importId: importRecord.id,
          successRows: finalRecord?.success_rows || 0,
          failedRows: finalRecord?.failed_rows || 0,
          status: finalRecord?.status || 'completed',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      // Start background task (fire and forget)
      backgroundTask().catch(err => {
        console.error('Background task error:', err);
      });


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

    }
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


