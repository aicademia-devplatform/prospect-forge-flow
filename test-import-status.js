// Script de test pour l'importation avec statuts
const testData = {
  targetTable: "prospects",
  columnMapping: {
    email: "email",
    firstname: "firstname",
    name: "name",
    company: "company",
    statut_prospect: "statut_prospect",
    apollo_status: "apollo_status",
    zoho_status: "zoho_status",
    arlynk_status: "arlynk_status",
    aicademia_high_status: "aicademia_high_status",
    hubspot_lead_status: "hubspot_lead_status",
  },
  sdrAssignments: [],
  rows: [
    {
      email: "test1@example.com",
      firstname: "Jean",
      name: "Dupont",
      company: "Acme Corp",
      statut_prospect: "CLIENT",
      apollo_status: "Hot Lead",
      zoho_status: "Qualified",
      arlynk_status: "Active",
      aicademia_high_status: "High Priority",
      hubspot_lead_status: "Marketing Qualified Lead",
    },
    {
      email: "test2@example.com",
      firstname: "Marie",
      name: "Martin",
      company: "Tech Inc",
      statut_prospect: "PROSPECT",
      apollo_status: "Cold Lead",
      zoho_status: "New",
      arlynk_status: "Inactive",
      aicademia_high_status: "Low Priority",
      hubspot_lead_status: "Sales Qualified Lead",
    },
  ],
  headers: [
    "email",
    "firstname",
    "name",
    "company",
    "statut_prospect",
    "apollo_status",
    "zoho_status",
    "arlynk_status",
    "aicademia_high_status",
    "hubspot_lead_status",
  ],
  fileName: "test-status-import.csv",
};

// Simuler le traitement des données avec mapping des statuts
const crmContactFields = [
  "email",
  "firstname",
  "name",
  "company",
  "apollo_status",
  "zoho_status",
  "arlynk_status",
  "aicademia_high_status",
  "hubspot_lead_status",
  "statut_prospect",
];

const mapStatusField = (columnName, value) => {
  const lowerColumnName = columnName.toLowerCase();

  if (
    lowerColumnName.includes("statut") ||
    lowerColumnName.includes("status")
  ) {
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
      lowerColumnName.includes("prospect") ||
      lowerColumnName.includes("prospect_status")
    ) {
      return { statut_prospect: value };
    }
    return { statut_prospect: value };
  }

  return null;
};

console.log("Test du traitement des données avec mapping des statuts :\n");

testData.rows.forEach((row, index) => {
  console.log(`=== Ligne ${index + 1} ===`);
  console.log(`Email: ${row.email}`);

  const contactData = { email: row.email };

  // Traitement des données avec mapping intelligent des statuts
  Object.keys(row).forEach((key) => {
    if (crmContactFields.includes(key) && key !== "email") {
      contactData[key] = row[key];
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

  console.log("Données de contact enrichies :");
  console.log(JSON.stringify(contactData, null, 2));

  // Vérifier s'il y a des statuts
  const hasStatus =
    contactData.statut_prospect ||
    contactData.apollo_status ||
    contactData.zoho_status ||
    contactData.arlynk_status ||
    contactData.aicademia_high_status ||
    contactData.hubspot_lead_status;

  console.log(`A des statuts: ${hasStatus ? "OUI" : "NON"}`);
  console.log("");
});

