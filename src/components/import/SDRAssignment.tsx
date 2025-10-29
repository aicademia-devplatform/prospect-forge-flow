import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowRight,
  ArrowLeft,
  X,
  User,
  Users,
  CheckCircle,
  Info,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SDRAssignmentProps {
  data: {
    headers: string[];
    rows: unknown[][];
  };
  mapping: Record<string, string>;
  onBack: () => void;
  onNext: (assignments: Record<string, string>) => void;
  onCancel: () => void;
}

interface SDR {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
}

export const SDRAssignment: React.FC<SDRAssignmentProps> = ({
  data,
  mapping,
  onBack,
  onNext,
  onCancel,
}) => {
  const [selectedSDR, setSelectedSDR] = useState<string>("");
  const [sdrList, setSdrList] = useState<SDR[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  
  const isSDR = userRole === "sdr";
  const canChangeSDR = !isSDR;

  const fetchSDRs = useCallback(async () => {
    try {
      setLoading(true);

      // D'abord, récupérer les IDs des SDRs
      const { data: sdrRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "sdr");

      if (rolesError) throw rolesError;

      console.log("SDR roles:", sdrRoles);

      if (!sdrRoles || sdrRoles.length === 0) {
        setSdrList([]);
        return;
      }

      // Ensuite, récupérer les profils des SDRs
      const sdrIds = sdrRoles.map((role) => role.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name")
        .in("id", sdrIds);

      if (profilesError) throw profilesError;

      console.log("SDR profiles:", profiles);

      const formattedSDRs =
        profiles?.map((profile: any) => ({
          // eslint-disable-line @typescript-eslint/no-explicit-any
          id: profile.id,
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          full_name:
            profile.first_name && profile.last_name
              ? `${profile.first_name} ${profile.last_name}`
              : profile.email,
        })) || [];

      console.log("Formatted SDRs:", formattedSDRs);
      setSdrList(formattedSDRs);
    } catch (error) {
      console.error("Error fetching SDRs:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger la liste des SDR.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSDRs();
  }, [fetchSDRs]);

  // Auto-sélectionner le SDR si l'utilisateur est un SDR
  useEffect(() => {
    if (isSDR && user && sdrList.length > 0 && !selectedSDR) {
      setSelectedSDR(user.id);
    }
  }, [isSDR, user, sdrList, selectedSDR]);

  const getSDRName = (sdrId: string) => {
    const sdr = sdrList.find((s) => s.id === sdrId);
    return sdr ? sdr.full_name : "SDR inconnu";
  };

  const handleNext = () => {
    if (!selectedSDR) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          "Veuillez sélectionner un SDR pour assigner tous les prospects.",
      });
      return;
    }

    // Créer un objet d'assignation avec le même SDR pour tous les prospects
    const assignments: Record<string, string> = {};
    data.rows.forEach((_, index) => {
      assignments[index] = selectedSDR;
    });

    onNext(assignments);
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-center h-64"
      >
        <div className="text-center">
          <Users className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Chargement des SDR...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Assignation des prospects aux SDR
              </CardTitle>
              <CardDescription>
                Sélectionnez le SDR responsable pour tous les prospects importés
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {data.rows.length} prospects à assigner
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-6">
            {/* Aperçu des prospects */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Aperçu des prospects</h3>
                <Badge variant="outline">{data.rows.length} prospects</Badge>
              </div>
              <ScrollArea className="h-[200px] rounded-md border p-4">
                <div className="space-y-2">
                  {data.rows.slice(0, 10).map((row, index) => {
                    const email = String(
                      row[
                        data.headers.findIndex((h) => mapping[h] === "email")
                      ] || ""
                    );
                    const name =
                      String(
                        row[
                          data.headers.findIndex(
                            (h) => mapping[h] === "firstname"
                          )
                        ] || ""
                      ) ||
                      String(
                        row[
                          data.headers.findIndex((h) => mapping[h] === "name")
                        ] || ""
                      ) ||
                      "Prospect";

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded border bg-muted/50"
                      >
                        <div>
                          <span className="font-medium">{name}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {email}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          #{index + 1}
                        </Badge>
                      </div>
                    );
                  })}
                  {data.rows.length > 10 && (
                    <div className="text-center text-sm text-muted-foreground py-2">
                      ... et {data.rows.length - 10} autres prospects
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Sélection du SDR */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <h3 className="text-lg font-medium">Assignation SDR</h3>
              </div>
            <div className="p-6 border rounded-lg bg-muted/30">
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">
                      Sélectionner le SDR responsable
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Tous les {data.rows.length} prospects seront assignés à ce
                      SDR
                    </p>
                  </div>
                  
                  {isSDR && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        En tant que SDR, les prospects seront automatiquement assignés à vous-même.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <Select 
                    value={selectedSDR} 
                    onValueChange={setSelectedSDR}
                    disabled={!canChangeSDR}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Choisir un SDR..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sdrList.map((sdr) => (
                        <SelectItem key={sdr.id} value={sdr.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{sdr.full_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {sdr.email}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedSDR && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">
                          Tous les prospects seront assignés à{" "}
                          {getSDRName(selectedSDR)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button onClick={handleNext} disabled={!selectedSDR}>
                <ArrowRight className="h-4 w-4 mr-2" />
                Continuer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
