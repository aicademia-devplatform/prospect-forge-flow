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
import { Sheet, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import CSVPreview from "./CSVPreview";
import ColumnMapper from "./ColumnMapper";
import { supabase } from "@/integrations/supabase/client";

interface ParsedData {
  headers: string[];
  rows: any[];
  fileName: string;
}

const GoogleSheetsImporter = () => {
  const { toast } = useToast();
  const { userRole } = useAuth();
  const [sheetUrl, setSheetUrl] = useState("");
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [targetTable, setTargetTable] = useState<
    "crm_contacts" | "apollo_contacts" | "prospects"
  >("prospects");
  const [step, setStep] = useState<"input" | "preview" | "mapping" | "confirm">(
    "input"
  );
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>(
    {}
  );
  const [isImporting, setIsImporting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  const extractSheetId = (url: string): string | null => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  const handleLoadSheet = async () => {
    if (!sheetUrl) {
      toast({
        title: "URL manquante",
        description: "Veuillez saisir l'URL de votre Google Sheet",
        variant: "destructive",
      });
      return;
    }

    const sheetId = extractSheetId(sheetUrl);
    if (!sheetId) {
      toast({
        title: "URL invalide",
        description: "Veuillez saisir une URL Google Sheets valide",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "google-sheets-import",
        {
          body: { sheetId, action: "load" },
        }
      );

      if (error) throw error;

      if (data.headers && data.rows) {
        setParsedData({
          headers: data.headers,
          rows: data.rows,
          fileName: `Google Sheet: ${sheetId}`,
        });
        setStep("preview");
        toast({
          title: "Feuille chargée",
          description: `${data.rows.length} lignes détectées`,
        });
      }
    } catch (error: any) {
      console.error("Error loading Google Sheet:", error);
      toast({
        title: "Erreur de chargement",
        description:
          error.message || "Impossible de charger la feuille Google Sheets",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSheetUrl("");
    setParsedData(null);
    setStep("input");
    setColumnMapping({});
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

      const { data, error } = await supabase.functions.invoke("csv-import", {
        body: {
          targetTable,
          columnMapping,
          rows: parsedData.rows,
          headers: parsedData.headers,
          fileName: parsedData.fileName,
        },
      });

      if (error) {
        console.error("Edge function error:", error);
        throw error;
      }

      toast({
        title: "Import réussi",
        description: `${data.successRows} lignes importées avec succès${
          data.failedRows > 0 ? `, ${data.failedRows} échecs` : ""
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
      {step === "input" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sheet className="h-5 w-5" />
                Importer depuis Google Sheets
              </CardTitle>
              <CardDescription>
                Connectez votre Google Sheet pour importer les données
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
                  <Label htmlFor="sheet-url">URL Google Sheets</Label>
                  <Input
                    id="sheet-url"
                    type="url"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleLoadSheet}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Chargement...
                    </>
                  ) : (
                    <>
                      <Sheet className="h-4 w-4 mr-2" />
                      Charger la feuille
                    </>
                  )}
                </Button>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Accès requis :</strong> Assurez-vous que votre Google
                  Sheet est accessible en lecture publique ou partagé avec votre
                  compte.
                </AlertDescription>
              </Alert>
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
          onNext={(mapping) => {
            setColumnMapping(mapping);
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
                  <span className="font-medium">Source :</span>
                  <span className="truncate ml-2">Google Sheets</span>
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

export default GoogleSheetsImporter;
