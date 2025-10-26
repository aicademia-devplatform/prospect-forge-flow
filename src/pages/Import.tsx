import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Database, Sheet } from "lucide-react";
import CSVUploader from "@/components/import/CSVUploader";
import GoogleSheetsImporter from "@/components/import/GoogleSheetsImporter";
import ImportHistory from "@/components/import/ImportHistory";

const Import = () => {
  const [activeTab, setActiveTab] = useState("upload");

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Import de données</h1>
            <p className="text-muted-foreground">
              Importez vos données CSV dans le data warehouse
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Importer un fichier
            </TabsTrigger>
            <TabsTrigger value="google-sheets" className="gap-2">
              <Sheet className="h-4 w-4" />
              Google Sheets
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Database className="h-4 w-4" />
              Historique
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6 mt-6">
            <CSVUploader />
          </TabsContent>

          <TabsContent value="google-sheets" className="space-y-6 mt-6">
            <GoogleSheetsImporter />
          </TabsContent>

          <TabsContent value="history" className="space-y-6 mt-6">
            <ImportHistory />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default Import;
