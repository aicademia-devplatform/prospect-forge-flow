/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import * as XLSX from "xlsx";
import CSVPreview from "./CSVPreview";
import ColumnMapper from "./ColumnMapper";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ParsedData {
  headers: string[];
  rows: any[];
  fileName: string;
}

const CSVUploader = () => {
  const { toast } = useToast();
  const { userRole } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [targetTable, setTargetTable] = useState<
    "crm_contacts" | "apollo_contacts" | "prospects"
  >("prospects");
  const [step, setStep] = useState<
    "upload" | "preview" | "mapping" | "confirm"
  >("upload");
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>(
    {}
  );
  const [sdrAssignments, setSDRAssignments] = useState<Record<string, string>>(
    {}
  );
  const [isImporting, setIsImporting] = useState(false);

  // Déterminer les tables disponibles selon le rôle
  const getAvailableTables = () => {
    if (userRole === "sdr") {
      // SDR ne peut importer que dans prospects
      return [{ value: "prospects", label: "Prospects SDR" }];
    } else if (userRole === "sales" || userRole === "marketing") {
      // Sales et Marketing ont accès à prospects et CRM
      return [
        { value: "prospects", label: "Prospects SDR" },
        { value: "crm_contacts", label: "CRM Contacts" },
      ];
    } else if (userRole === "admin") {
      // Admin a accès à toutes les tables
      return [
        { value: "prospects", label: "Prospects SDR" },
        { value: "crm_contacts", label: "CRM Contacts" },
        { value: "apollo_contacts", label: "Apollo Contacts" },
      ];
    }
    // Par défaut (au cas où le rôle n'est pas défini), limiter à prospects
    return [{ value: "prospects", label: "Prospects SDR" }];
  };

  const availableTables = getAvailableTables();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (
      !validTypes.includes(selectedFile.type) &&
      !selectedFile.name.endsWith(".csv")
    ) {
      toast({
        title: "Format invalide",
        description: "Veuillez sélectionner un fichier CSV ou Excel",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const parseFile = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
        }) as any[][];

        if (jsonData.length === 0) {
          toast({
            title: "Fichier vide",
            description: "Le fichier ne contient aucune donnée",
            variant: "destructive",
          });
          return;
        }

        const headers = jsonData[0] as string[];
        const rows = jsonData
          .slice(1)
          .filter((row) => row.some((cell) => cell !== null && cell !== ""));

        setParsedData({
          headers,
          rows,
          fileName: file.name,
        });

        setStep("preview");

        toast({
          title: "Fichier chargé",
          description: `${rows.length} lignes détectées`,
        });
      } catch (error) {
        console.error("Error parsing file:", error);
        toast({
          title: "Erreur de lecture",
          description: "Impossible de lire le fichier",
          variant: "destructive",
        });
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleReset = () => {
    setFile(null);
    setParsedData(null);
    setStep("upload");
    setColumnMapping({});
    setSDRAssignments({});
    setIsImporting(false);
  };

  const handleConfirmImport = async () => {
    if (!parsedData) return;

    setIsImporting(true);

    try {
      // Vérifier que l'utilisateur est bien authentifié
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error("Vous devez être connecté pour importer des données");
      }

      console.log("Calling csv-import with session:", session.user.id);
      console.log("Request payload:", {
        targetTable,
        columnMapping,
        sdrAssignments:
          Object.keys(sdrAssignments).length > 0 ? sdrAssignments : undefined,
        rowsCount: parsedData.rows.length,
        headers: parsedData.headers,
        fileName: parsedData.fileName,
      });

      const { data, error } = await supabase.functions.invoke("csv-import", {
        body: {
          targetTable,
          columnMapping,
          sdrAssignments:
            Object.keys(sdrAssignments).length > 0 ? sdrAssignments : undefined,
          rows: parsedData.rows,
          headers: parsedData.headers,
          fileName: parsedData.fileName,
        },
      });

      if (error) {
        console.error("Edge function error:", error);
        throw error;
      }

      console.log("Import response data:", data);

      // Vérifier que l'import a réussi
      if (
        !data ||
        data.successRows === undefined ||
        data.successRows === null
      ) {
        throw new Error(
          data?.error || "Aucune donnée retournée par le serveur"
        );
      }

      const successCount = data.successRows || 0;
      const failedCount = data.failedRows || 0;

      if (successCount === 0 && failedCount > 0) {
        throw new Error(
          `Échec de l'importation : ${failedCount} lignes en échec. ${
            data.errors?.[0]?.error || ""
          }`
        );
      }

      toast({
        title: "Import réussi",
        description: `${successCount} lignes importées avec succès${
          failedCount > 0 ? `, ${failedCount} échecs` : ""
        }`,
      });

      handleReset();
    } catch (error: any) {
      console.error("Import error:", error);
      toast({
        title: "Erreur d'importation",
        description:
          error.message || "Une erreur est survenue lors de l'importation",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {step === "upload" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Importer un fichier CSV
              </CardTitle>
              <CardDescription>
                Sélectionnez un fichier CSV ou Excel à importer dans le data
                warehouse
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="target-table">Table de destination</Label>
                  <Select
                    value={targetTable}
                    onValueChange={(value: any) => setTargetTable(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTables.map((table) => (
                        <SelectItem key={table.value} value={table.value}>
                          {table.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {userRole === "sdr" && (
                    <p className="text-xs text-muted-foreground">
                      En tant que SDR, vous pouvez uniquement importer dans la
                      table Prospects SDR
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file-upload">Fichier CSV / Excel</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileSelect}
                      className="cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Format attendu :</strong> Fichier CSV ou Excel avec
                  une ligne d'en-tête. Les colonnes seront mappées
                  automatiquement si elles correspondent aux champs de la base
                  de données.
                </AlertDescription>
              </Alert>

              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Glissez-déposez votre fichier ici ou utilisez le bouton
                  ci-dessus
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {step === "preview" && parsedData && (
        <CSVPreview
          data={parsedData}
          targetTable={targetTable}
          onNext={() => setStep("mapping")}
          onCancel={handleReset}
        />
      )}

      {step === "mapping" && parsedData && (
        <ColumnMapper
          data={parsedData}
          targetTable={targetTable}
          onBack={() => setStep("preview")}
          onNext={(mapping, assignments) => {
            setColumnMapping(mapping);
            if (assignments) {
              setSDRAssignments(assignments);
            }
            setStep("confirm");
          }}
          onCancel={handleReset}
        />
      )}

      {step === "confirm" && parsedData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Confirmation d'import
              </CardTitle>
              <CardDescription>
                Vérifiez les paramètres avant l'importation finale
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between p-4 bg-muted rounded-lg">
                  <span className="font-medium">Fichier :</span>
                  <span>{parsedData.fileName}</span>
                </div>
                <div className="flex justify-between p-4 bg-muted rounded-lg">
                  <span className="font-medium">Table cible :</span>
                  <span>{targetTable}</span>
                </div>
                <div className="flex justify-between p-4 bg-muted rounded-lg">
                  <span className="font-medium">Nombre de lignes :</span>
                  <span>{parsedData.rows.length}</span>
                </div>
                <div className="flex justify-between p-4 bg-muted rounded-lg">
                  <span className="font-medium">Colonnes mappées :</span>
                  <span>
                    {
                      Object.values(columnMapping).filter((v) => v !== "ignore")
                        .length
                    }
                  </span>
                </div>
                {Object.keys(sdrAssignments).length > 0 && (
                  <div className="flex justify-between p-4 bg-muted rounded-lg">
                    <span className="font-medium">
                      Prospects assignés aux SDR :
                    </span>
                    <span>{Object.keys(sdrAssignments).length}</span>
                  </div>
                )}
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  L'import utilisera l'<strong>email</strong> comme identifiant
                  unique. Les contacts existants seront mis à jour avec les
                  nouvelles données.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={isImporting}
                >
                  Annuler
                </Button>
                <Button onClick={handleConfirmImport} disabled={isImporting}>
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importation en cours...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Confirmer l'import
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default CSVUploader;
