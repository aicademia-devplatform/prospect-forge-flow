// Script de test pour l'importation avec statuts

// Simuler les données d'importation
const testData = {
  targetTable: "prospects",
  columnMapping: {
    email: "email",
    firstname: "firstname",
    name: "name",
    company: "company",
    statut: "statut",
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
      statut: "CLIENT",
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
      statut: "PROSPECT",
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
    "statut",
    "apollo_status",
    "zoho_status",
    "arlynk_status",
    "aicademia_high_status",
    "hubspot_lead_status",
  ],
  fileName: "test-status-import.csv",
};

console.log("Données de test pour l'importation avec statuts :");
console.log(JSON.stringify(testData, null, 2));

// Tester la fonction de mapping des statuts
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
    return { statut: value };
  }

  return null;
};

console.log("\nTest de la fonction de mapping des statuts :");
testData.rows.forEach((row, index) => {
  console.log(`\nLigne ${index + 1}:`);
  Object.keys(row).forEach((key) => {
    if (key.includes("status") || key.includes("statut")) {
      const mapping = mapStatusField(key, row[key]);
      console.log(`  ${key}: "${row[key]}" -> ${JSON.stringify(mapping)}`);
    }
  });
});
