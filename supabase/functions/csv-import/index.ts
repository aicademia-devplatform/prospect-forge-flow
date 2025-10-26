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
    const errors: any[] = [];

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
        "zoho_status_2",
        "apollo_status",
        "arlynk_status",
        "arlynk_cold_status",
        "aicademia_high_status",
        "aicademia_low_status",
        "aicademia_cold_status",
        "hubspot_lead_status",
        "statut_prospect",
        "full_name",
        "contact_active",
        "data_section",
      ];

      // Fonction de mapping intelligent des statuts
      const mapStatusField = (columnName: string, value: string) => {
        const lowerColumnName = columnName.toLowerCase();
        const lowerValue = value.toLowerCase();

        // Mapping des colonnes de statut communes
        if (
          lowerColumnName.includes("statut") ||
          lowerColumnName.includes("status")
        ) {
          // Mapping intelligent basé sur le nom de la colonne
          if (
            lowerColumnName.includes("apollo") ||
            lowerColumnName.includes("apollo_status")
          ) {
            return { apollo_status: value };
          }
          if (
            lowerColumnName.includes("zoho") ||
            lowerColumnName.includes("zoho_status")
          ) {
            return { zoho_status: value };
          }
          if (
            lowerColumnName.includes("arlynk") ||
            lowerColumnName.includes("arlynk_status")
          ) {
            return { arlynk_status: value };
          }
          if (
            lowerColumnName.includes("aicademia") ||
            lowerColumnName.includes("aicademia_status")
          ) {
            return { aicademia_high_status: value };
          }
          if (
            lowerColumnName.includes("hubspot") ||
            lowerColumnName.includes("hubspot_status")
          ) {
            return { hubspot_lead_status: value };
          }
          if (
            lowerColumnName.includes("cold") ||
            lowerColumnName.includes("froid")
          ) {
            if (lowerColumnName.includes("arlynk")) {
              return { arlynk_cold_status: value };
            }
            if (lowerColumnName.includes("aicademia")) {
              return { aicademia_cold_status: value };
            }
          }
          if (
            lowerColumnName.includes("prospect") ||
            lowerColumnName.includes("prospect_status")
          ) {
            return { statut_prospect: value };
          }
          // Par défaut, utiliser le statut prospect
          return { statut_prospect: value };
        }

        return null;
      };

      for (let index = 0; index < dataToImport.length; index++) {
        const row = dataToImport[index];
        try {
          const email = row.email || row.lead_email;
          if (!email) throw new Error("Email manquant");

          const assignedSDRId =
            sdrAssignments && sdrAssignments[index]
              ? sdrAssignments[index]
              : user.id;

          const contactData: any = { email: email };

          // Traitement des données avec mapping intelligent des statuts
          Object.keys(row).forEach((key) => {
            if (crmContactFields.includes(key) && key !== "email") {
              let value = row[key];
              // Tronquer les valeurs trop longues pour VARCHAR(20)
              if (
                ["tel_pro", "tel", "mobile", "mobile_2"].includes(key) &&
                value &&
                value.length > 20
              ) {
                value = value.substring(0, 20);
              }
              contactData[key] = value;
            } else if (
              row[key] &&
              (key.toLowerCase().includes("status") ||
                key.toLowerCase().includes("statut"))
            ) {
              // Mapping intelligent des colonnes de statut
              const statusMapping = mapStatusField(key, row[key]);
              if (statusMapping) {
                Object.assign(contactData, statusMapping);
              }
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

          // Vérifier s'il y a des statuts dans les données enrichies
          const hasStatus =
            contactData.statut_prospect ||
            contactData.apollo_status ||
            contactData.zoho_status ||
            contactData.arlynk_status ||
            contactData.aicademia_high_status ||
            contactData.hubspot_lead_status;

          if (hasStatus) {
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
                  statut_prospect:
                    contactData.statut_prospect || "Importé avec statut",
                  notes_sales: row.notes_sales || null,
                  date_action: row.date_action || null,
                  custom_data: {
                    status_history: {
                      statut_prospect: contactData.statut_prospect,
                      apollo_status: contactData.apollo_status,
                      zoho_status: contactData.zoho_status,
                      arlynk_status: contactData.arlynk_status,
                      aicademia_high_status: contactData.aicademia_high_status,
                      hubspot_lead_status: contactData.hubspot_lead_status,
                    },
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
                  statut_prospect:
                    contactData.statut_prospect || "Importé avec statut",
                  notes_sales: row.notes_sales || null,
                  date_action: row.date_action || null,
                  custom_data: {
                    status_history: {
                      statut_prospect: contactData.statut_prospect,
                      apollo_status: contactData.apollo_status,
                      zoho_status: contactData.zoho_status,
                      arlynk_status: contactData.arlynk_status,
                      aicademia_high_status: contactData.aicademia_high_status,
                      hubspot_lead_status: contactData.hubspot_lead_status,
                    },
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
        } catch (error: any) {
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

    // Créer une notification pour l'utilisateur
    const notificationTitle =
      finalStatus === "completed"
        ? "Importation réussie"
        : "Importation échouée";

    const notificationMessage =
      finalStatus === "completed"
        ? `Votre fichier "${fileName}" a été importé avec succès. ${successCount} lignes importées${
            failedCount > 0 ? `, ${failedCount} échecs` : ""
          }.`
        : `L'importation de "${fileName}" a échoué. ${failedCount} lignes en échec.`;

    await supabaseClient.from("notifications").insert({
      user_id: user.id,
      type: "import_result",
      title: notificationTitle,
      message: notificationMessage,
      data: {
        import_id: importRecord.id,
        file_name: fileName,
        target_table: targetTable,
        success_rows: successCount,
        failed_rows: failedCount,
        status: finalStatus,
        errors: errors.length > 0 ? errors : null,
      },
    });

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
  } catch (error: any) {
    // Créer une notification d'erreur si possible
    try {
      const {
        data: { user: errorUser },
      } = await supabaseClient.auth.getUser();

      if (errorUser) {
        await supabaseClient.from("notifications").insert({
          user_id: errorUser.id,
          type: "import_error",
          title: "Erreur d'importation",
          message: `L'importation a échoué : ${
            error.message || "Erreur inconnue"
          }`,
          data: {
            error: error.message,
          },
        });
      }
    } catch (notificationError) {
      console.error("Failed to create error notification:", notificationError);
    }

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
