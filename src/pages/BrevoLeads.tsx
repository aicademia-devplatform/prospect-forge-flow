/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import DashboardLoader from "@/components/dashboard/DashboardLoader";
import ExportDialog, { ExportOptions } from "@/components/ExportDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { encryptEmail } from "@/lib/emailCrypto";

type BrevoStatus = "clicks" | "opens" | "replies" | "unsubscribes";

interface CRMContact {
  id: number;
  email: string;
  firstname: string | null;
  name: string | null;
  company: string | null;
  mobile: string | null;
  tel: string | null;
  brevo_click_number: string | null;
  brevo_open_number: string | null;
  brevo_reply_number: string | null;
  brevo_unsuscribe: string | null;
}

const BrevoLeads = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const status = searchParams.get("status") as BrevoStatus;
  const [contacts, setContacts] = useState<CRMContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [filterWithPhone, setFilterWithPhone] = useState(false);

  const statusLabels = {
    clicks: "Cliqués",
    opens: "Ouverts",
    replies: "Répondus",
    unsubscribes: "Désabonnés",
  };

  const statusColors = {
    clicks: "bg-[hsl(var(--accent-blue-light))] text-[hsl(var(--accent-blue))]",
    opens:
      "bg-[hsl(var(--accent-green-light))] text-[hsl(var(--accent-green))]",
    replies:
      "bg-[hsl(var(--accent-purple-light))] text-[hsl(var(--accent-purple))]",
    unsubscribes:
      "bg-[hsl(var(--accent-orange-light))] text-[hsl(var(--accent-orange))]",
  };

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase.from("crm_contacts").select("*");

      switch (status) {
        case "clicks":
          query = query
            .not("brevo_click_number", "is", null)
            .neq("brevo_click_number", "");
          break;
        case "opens":
          query = query
            .not("brevo_open_number", "is", null)
            .neq("brevo_open_number", "");
          break;
        case "replies":
          query = query
            .not("brevo_reply_number", "is", null)
            .neq("brevo_reply_number", "");
          break;
        case "unsubscribes":
          query = query
            .not("brevo_unsuscribe", "is", null)
            .neq("brevo_unsuscribe", "");
          break;
      }

      const { data, error } = await query;

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les contacts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [status, toast]);

  useEffect(() => {
    if (
      !status ||
      !["clicks", "opens", "replies", "unsubscribes"].includes(status)
    ) {
      navigate("/dashboard");
      return;
    }
    fetchContacts();
  }, [status, navigate, fetchContacts]);

  const hasValidPhone = (contact: CRMContact) => {
    return !!(contact.mobile || contact.tel);
  };

  const getPhoneNumber = (contact: CRMContact) => {
    return contact.mobile || contact.tel || "-";
  };

  const getBrevoMetric = (contact: CRMContact) => {
    switch (status) {
      case "clicks":
        return contact.brevo_click_number || "0";
      case "opens":
        return contact.brevo_open_number || "0";
      case "replies":
        return contact.brevo_reply_number || "0";
      case "unsubscribes":
        return contact.brevo_unsuscribe || "Non";
      default:
        return "-";
    }
  };

  const filteredContacts = filterWithPhone
    ? contacts.filter(hasValidPhone)
    : contacts;

  const handleRowClick = (contact: CRMContact) => {
    const encryptedEmail = encryptEmail(contact.email);
    navigate(`/contact/crm_contacts/${encryptedEmail}`);
  };

  const handleExport = async (options: ExportOptions) => {
    try {
      const dataToExport = filteredContacts.map((contact) => {
        const filtered: any = {};
        options.columns.forEach((col) => {
          filtered[col] = contact[col as keyof CRMContact];
        });
        return filtered;
      });

      if (options.format === "csv") {
        const headers = options.columns.join(
          options.csvOptions?.delimiter || ","
        );
        const rows = dataToExport.map((row) =>
          options.columns
            .map((col) => {
              const value = row[col] || "";
              if (options.csvOptions?.quoteStrings) {
                return `"${value}"`;
              }
              return value;
            })
            .join(options.csvOptions?.delimiter || ",")
        );

        const csv = options.csvOptions?.includeHeaders
          ? [headers, ...rows].join("\n")
          : rows.join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${options.filename}.csv`;
        link.click();
      } else if (options.format === "json") {
        const json = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${options.filename}.json`;
        link.click();
      } else {
        // Excel export
        const XLSX = await import("xlsx");
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Contacts");
        XLSX.writeFile(wb, `${options.filename}.xlsx`);
      }

      toast({
        title: "Export réussi",
        description: `${dataToExport.length} contacts exportés`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'export",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <DashboardLoader />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              Emails Brevo {statusLabels[status]}
            </h1>
            <p className="text-muted-foreground">
              {filteredContacts.length} contacts
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="phone-filter"
              checked={filterWithPhone}
              onCheckedChange={setFilterWithPhone}
            />
            <Label htmlFor="phone-filter" className="cursor-pointer">
              Avec numéro de téléphone
            </Label>
          </div>
          <Button onClick={() => setExportDialogOpen(true)} className="gap-2">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm ${statusColors[status]}`}
            >
              {statusLabels[status]}
            </span>
          </CardTitle>
          <CardDescription>
            Liste des contacts avec le statut "{statusLabels[status]}" sur Brevo
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border rounded-md">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Prénom</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Entreprise</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Métrique Brevo</TableHead>
                </TableRow>
              </TableHeader>
            </Table>
            <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
              <Table>
                <TableBody>
                  {filteredContacts.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground"
                      >
                        Aucun contact trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredContacts.map((contact) => (
                      <TableRow
                        key={contact.id}
                        onClick={() => handleRowClick(contact)}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <TableCell>{contact.email}</TableCell>
                        <TableCell>{contact.firstname || "-"}</TableCell>
                        <TableCell>{contact.name || "-"}</TableCell>
                        <TableCell>{contact.company || "-"}</TableCell>
                        <TableCell>{getPhoneNumber(contact)}</TableCell>
                        <TableCell>{getBrevoMetric(contact)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        tableName="crm_contacts"
        totalCount={filteredContacts.length}
        currentPageCount={filteredContacts.length}
        appliedFilters={{}}
        onExport={handleExport}
      />
    </div>
  );
};

export default BrevoLeads;
