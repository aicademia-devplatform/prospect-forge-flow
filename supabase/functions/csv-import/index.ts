import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization") },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      targetTable,
      columnMapping,
      sdrAssignments,
      rows,
      headers,
      fileName,
    } = await req.json();

    const { data: importRecord, error: historyError } = await supabaseClient
      .from("import_history")
      .insert({
        user_id: user.id,
        target_table: targetTable,
        file_name: fileName,
        total_rows: rows.length,
        column_mapping: columnMapping,
        status: "pending",
      })
      .select()
      .single();

    if (historyError || !importRecord) {
      throw new Error("Failed to create import history");
    }

    const dataToImport = rows.map((row) => {
      const mappedRow = {};
      headers.forEach((header, index) => {
        const targetField = columnMapping[header];
        if (targetField && targetField !== "ignore") {
          let value = row[index];
          mappedRow[targetField] =
            value === "" || value === null || value === undefined
              ? null
              : String(value);
        }
      });
      return mappedRow;
    });

    let successCount = 0;
    let failedCount = 0;
    const errors = [];

    if (targetTable === "prospects") {
      const crmContactFields = [
        "email",
        "firstname",
        "name",
        "address",
        "city",
        "departement",
        "country",
        "tel_pro",
        "tel",
        "mobile",
        "mobile_2",
        "company",
        "nb_employees",
        "linkedin_function",
        "industrie",
        "linkedin_url",
        "linkedin_company_url",
        "company_website",
        "systemeio_list",
        "apollo_list",
        "brevo_tag",
        "zoho_tag",
        "zoho_status",
        "apollo_status",
        "arlynk_status",
        "aicademia_high_status",
        "aicademia_low_status",
        "full_name",
        "contact_active",
        "data_section",
      ];

      for (let index = 0; index < dataToImport.length; index++) {
        const row = dataToImport[index];
        try {
          const email = row.email || row.lead_email;
          if (!email) throw new Error("Email manquant");

          const statusColumns = {};
          Object.keys(row).forEach((key) => {
            if (
              (key.toLowerCase().includes("status") ||
                key.toLowerCase().includes("statut")) &&
              row[key]
            ) {
              statusColumns[key] = row[key];
            }
          });

          const assignedSDRId =
            sdrAssignments && sdrAssignments[index]
              ? sdrAssignments[index]
              : user.id;

          const contactData = { email: email };
          Object.keys(row).forEach((key) => {
            if (crmContactFields.includes(key) && key !== "email") {
              let value = row[key];
              // Tronquer les valeurs trop longues pour VARCHAR(20)
              if (["tel_pro", "tel", "mobile", "mobile_2"].includes(key) && value && value.length > 20) {
                value = value.substring(0, 20);
              }
              contactData[key] = value;
            }
          });

          const { data: contact, error: contactError } = await supabaseClient
            .from("crm_contacts")
            .upsert(contactData, {
              onConflict: "email",
              ignoreDuplicates: false,
            })
            .select("id")
            .single();

          if (contactError || !contact)
            throw new Error("Échec enregistrement contact");

          if (row.statut_prospect || Object.keys(statusColumns).length > 0) {
            // Prospect avec statut -> prospects_traites
            const { data: existingTraite } = await supabaseClient
              .from("prospects_traites")
              .select("id")
              .eq("lead_email", email)
              .eq("sales_user_id", assignedSDRId)
              .maybeSingle();

            if (existingTraite) {
              // Update existing
              await supabaseClient
                .from("prospects_traites")
                .update({
                  statut_prospect: row.statut_prospect || "Importé avec statut",
                  notes_sales: row.notes_sales || null,
                  date_action: row.date_action || null,
                  custom_data: {
                    status_history: statusColumns,
                    import_source: fileName,
                    imported_at: new Date().toISOString(),
                  },
                })
                .eq("id", existingTraite.id);
            } else {
              // Create new
              const { data: existingAssignment } = await supabaseClient
                .from("sales_assignments")
                .select("id")
                .eq("lead_email", email)
                .eq("sales_user_id", assignedSDRId)
                .maybeSingle();

              let assignmentId;
              if (existingAssignment) {
                assignmentId = existingAssignment.id;
              } else {
                const { data: tempAssignment } = await supabaseClient
                  .from("sales_assignments")
                  .insert({
                    lead_email: email,
                    sales_user_id: assignedSDRId,
                    assigned_by: user.id,
                    source_table: "crm_contacts",
                    source_id: contact.id.toString(),
                  })
                  .select("id")
                  .single();
                assignmentId = tempAssignment.id;
              }

              const { error: traiteError } = await supabaseClient
                .from("prospects_traites")
                .insert({
                  original_assignment_id: assignmentId,
                  sales_user_id: assignedSDRId,
                  sdr_id: assignedSDRId,
                  source_table: "crm_contacts",
                  source_id: contact.id.toString(),
                  lead_email: email,
                  assigned_by: user.id,
                  assigned_at: new Date().toISOString(),
                  completed_at: new Date().toISOString(),
                  statut_prospect: row.statut_prospect || "Importé avec statut",
                  notes_sales: row.notes_sales || null,
                  date_action: row.date_action || null,
                  custom_data: {
                    status_history: statusColumns,
                    import_source: fileName,
                    imported_at: new Date().toISOString(),
                  },
                });

              if (traiteError) {
                console.error("Error inserting prospect traite:", traiteError);
                // Si c'est une erreur de contrainte unique, on ignore (prospect déjà traité)
                if (traiteError.code === "23505") {
                  console.log(
                    `Prospect ${email} already exists in prospects_traites, skipping...`
                  );
                } else {
                  throw new Error(
                    "Échec enregistrement prospect traité: " +
                      traiteError.message
                  );
                }
              }

              if (!existingAssignment) {
                await supabaseClient
                  .from("sales_assignments")
                  .delete()
                  .eq("id", assignmentId);
              }
            }
          } else {
            // Prospect sans statut -> sales_assignments
            const { data: existingAssignment } = await supabaseClient
              .from("sales_assignments")
              .select("id")
              .eq("lead_email", email)
              .eq("sales_user_id", assignedSDRId)
              .maybeSingle();

            if (existingAssignment) {
              // Mise à jour de l'assignation existante
              await supabaseClient
                .from("sales_assignments")
                .update({
                  custom_data: {
                    import_source: fileName,
                    imported_at: new Date().toISOString(),
                  },
                })
                .eq("id", existingAssignment.id);
            } else {
              // Création d'une nouvelle assignation
              await supabaseClient.from("sales_assignments").insert({
                lead_email: email,
                sales_user_id: assignedSDRId,
                assigned_by: user.id,
                source_table: "crm_contacts",
                source_id: contact.id.toString(),
                custom_data: {
                  import_source: fileName,
                  imported_at: new Date().toISOString(),
                },
              });
            }
          }

          successCount++;
        } catch (error) {
          failedCount++;
          errors.push({
            row: row.email || `ligne ${index + 1}`,
            error: error.message,
          });
        }
      }
    } else {
      const batchSize = 100;
      for (let i = 0; i < dataToImport.length; i += batchSize) {
        const batch = dataToImport.slice(i, i + batchSize);
        const { error } = await supabaseClient
          .from(targetTable)
          .upsert(batch, { onConflict: "email" });
        if (error) {
          failedCount += batch.length;
        } else {
          successCount += batch.length;
        }
      }
    }

    const finalStatus = successCount > 0 ? "completed" : "failed";
    await supabaseClient
      .from("import_history")
      .update({
        status: finalStatus,
        success_rows: successCount,
        failed_rows: failedCount,
        completed_at: new Date().toISOString(),
        error_details: errors.length > 0 ? errors : null,
      })
      .eq("id", importRecord.id);

    return new Response(
      JSON.stringify({
        success: true,
        importId: importRecord.id,
        successRows: successCount,
        failedRows: failedCount,
        status: finalStatus,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message || "Erreur lors de l'importation",
        success: false,
        successRows: 0,
        failedRows: 0,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
