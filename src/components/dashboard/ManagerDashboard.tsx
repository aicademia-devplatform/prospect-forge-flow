import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  Target,
  TrendingUp,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import DashboardLoader from "./DashboardLoader";
import { TeamStatsCard } from "./TeamStatsCard";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailStatsChart } from "../EmailStatsChart";
import { useBrevoStats } from "@/hooks/useBrevoStats";

interface ManagerStats {
  totalSDRTeam: number;
  totalAssignedProspects: number;
  completedToday: number;
  pendingCallbacks: number;
  validatedProspects: number;
  conversionRate: number;
  teamActivity: number;
}

interface EmailStats {
  emailsSent: number;
  emailsOpened: number;
  emailsReplied: number;
  emailsBounced: number;
}

interface BrevoStats {
  total_sent: number;
  total_opens: number;
  total_clicks: number;
  total_hard_bounces: number;
  total_soft_bounces: number;
  total_unsubscribes: number;
  total_replies: number;
}

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<ManagerStats>({
    totalSDRTeam: 0,
    totalAssignedProspects: 0,
    completedToday: 0,
    pendingCallbacks: 0,
    validatedProspects: 0,
    conversionRate: 0,
    teamActivity: 0,
  });
  const [emailStats, setEmailStats] = useState<EmailStats>({
    emailsSent: 0,
    emailsOpened: 0,
    emailsReplied: 0,
    emailsBounced: 0,
  });
  const [brevoStats, setBrevoStats] = useState<BrevoStats>({
    total_sent: 0,
    total_opens: 0,
    total_clicks: 0,
    total_hard_bounces: 0,
    total_soft_bounces: 0,
    total_unsubscribes: 0,
    total_replies: 0,
  });
  const [activeEmailTab, setActiveEmailTab] = useState<string>("apollo");
  const [loading, setLoading] = useState(true);

  // Utiliser le hook pour récupérer les vraies statistiques Brevo
  const { stats: realBrevoStats, loading: brevoStatsLoading } = useBrevoStats();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Récupérer le nombre de SDR dans l'équipe
      const { count: sdrCount } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "sdr");

      // Récupérer le total des prospects assignés actifs
      const { count: assignedCount } = await supabase
        .from("sales_assignments")
        .select("*", { count: "exact", head: true });

      // Récupérer les prospects traités aujourd'hui
      const { count: completedTodayCount } = await supabase
        .from("prospects_traites")
        .select("*", { count: "exact", head: true })
        .gte("completed_at", todayISO);

      // Récupérer les rappels planifiés
      const { count: callbacksCount } = await supabase
        .from("prospects_a_rappeler")
        .select("*", { count: "exact", head: true });

      // Récupérer les prospects validés par les sales
      const { count: validatedCount } = await supabase
        .from("prospects_valides")
        .select("*", { count: "exact", head: true });

      // Récupérer l'activité totale (traitements + rappels)
      const { data: traitesData } = await supabase
        .from("prospects_traites")
        .select("id");

      const { data: rappelData } = await supabase
        .from("prospects_a_rappeler")
        .select("id");

      const totalActivity =
        (traitesData?.length || 0) + (rappelData?.length || 0);

      // Calculer le taux de conversion (validés / assignés)
      const conversionRate =
        assignedCount && assignedCount > 0
          ? Math.round(((validatedCount || 0) / assignedCount) * 100)
          : 0;

      // Récupérer les statistiques d'email depuis apollo_contacts
      const { count: emailSentCount } = await supabase
        .from("apollo_contacts")
        .select("*", { count: "exact", head: true })
        .eq("email_sent", true);

      const { count: emailOpenCount } = await supabase
        .from("apollo_contacts")
        .select("*", { count: "exact", head: true })
        .eq("email_open", true);

      const { count: emailRepliedCount } = await supabase
        .from("apollo_contacts")
        .select("*", { count: "exact", head: true })
        .eq("replied", true);

      const { count: emailBouncedCount } = await supabase
        .from("apollo_contacts")
        .select("*", { count: "exact", head: true })
        .eq("email_bounced", true);

      // Récupérer les statistiques Brevo depuis crm_contacts
      // Test: Vérifier d'abord s'il y a des données dans crm_contacts
      const { count: totalCrmContacts } = await supabase
        .from("crm_contacts")
        .select("*", { count: "exact", head: true });

      console.log("Total CRM contacts:", totalCrmContacts);

      // Test: Récupérer quelques exemples de données Brevo pour debug
      const { data: sampleBrevoData, error: sampleError } = await supabase
        .from("crm_contacts")
        .select(
          "id, email, brevo_click_number, brevo_open_number, brevo_reply_number, brevo_unsuscribe"
        )
        .limit(5);

      console.log("Sample Brevo data:", sampleBrevoData);
      if (sampleError) {
        console.error("Error fetching sample Brevo data:", sampleError);
      }

      // Test: Vérifier les types de données
      if (sampleBrevoData && sampleBrevoData.length > 0) {
        const sample = sampleBrevoData[0];
        console.log("Data types check:", {
          brevo_click_number: {
            type: typeof sample.brevo_click_number,
            value: sample.brevo_click_number,
          },
          brevo_open_number: {
            type: typeof sample.brevo_open_number,
            value: sample.brevo_open_number,
          },
          brevo_reply_number: {
            type: typeof sample.brevo_reply_number,
            value: sample.brevo_reply_number,
          },
          brevo_unsuscribe: {
            type: typeof sample.brevo_unsuscribe,
            value: sample.brevo_unsuscribe,
          },
        });
      }

      // Vérifier les contacts avec des données Brevo non nulles et non vides
      const { count: brevoClicksCount } = await supabase
        .from("crm_contacts")
        .select("*", { count: "exact", head: true })
        .not("brevo_click_number", "is", null)
        .neq("brevo_click_number", "");

      const { count: brevoOpensCount } = await supabase
        .from("crm_contacts")
        .select("*", { count: "exact", head: true })
        .not("brevo_open_number", "is", null)
        .neq("brevo_open_number", "");

      const { count: brevoRepliesCount } = await supabase
        .from("crm_contacts")
        .select("*", { count: "exact", head: true })
        .not("brevo_reply_number", "is", null)
        .neq("brevo_reply_number", "");

      const { count: brevoUnsubscribesCount } = await supabase
        .from("crm_contacts")
        .select("*", { count: "exact", head: true })
        .not("brevo_unsuscribe", "is", null)
        .neq("brevo_unsuscribe", "");

      setStats({
        totalSDRTeam: sdrCount || 0,
        totalAssignedProspects: assignedCount || 0,
        completedToday: completedTodayCount || 0,
        pendingCallbacks: callbacksCount || 0,
        validatedProspects: validatedCount || 0,
        conversionRate: conversionRate,
        teamActivity: totalActivity,
      });

      setEmailStats({
        emailsSent: emailSentCount || 0,
        emailsOpened: emailOpenCount || 0,
        emailsReplied: emailRepliedCount || 0,
        emailsBounced: emailBouncedCount || 0,
      });

      // Debug: Log des statistiques Brevo pour diagnostiquer
      console.log("Brevo Stats Debug:", {
        clicks: brevoClicksCount,
        opens: brevoOpensCount,
        replies: brevoRepliesCount,
        unsubscribes: brevoUnsubscribesCount,
      });

      setBrevoStats({
        total_sent: 0, // Will be updated with real campaign data
        total_opens: brevoOpensCount || 0,
        total_clicks: brevoClicksCount || 0,
        total_hard_bounces: 0,
        total_soft_bounces: 0,
        total_unsubscribes: brevoUnsubscribesCount || 0,
        total_replies: brevoRepliesCount || 0,
      });
    } catch (error) {
      console.error("Error fetching manager stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardLoader />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-6 space-y-6"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold">Tableau de bord Manager</h1>
        <p className="text-muted-foreground">Suivi de l'équipe commerciale</p>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <Card
            className="border-l-4 border-l-[hsl(var(--accent-blue))] transition-all duration-300 hover:shadow-lg cursor-pointer"
            onClick={() => navigate("/team-stats?type=team")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Équipe SDR</CardTitle>
              <div className="bg-[hsl(var(--accent-blue-light))] p-2 rounded-lg">
                <Users className="h-5 w-5 text-[hsl(var(--accent-blue))]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSDRTeam}</div>
              <p className="text-xs text-muted-foreground">Membres actifs</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <Card
            className="border-l-4 border-l-[hsl(var(--accent-green))] transition-all duration-300 hover:shadow-lg cursor-pointer"
            onClick={() => navigate("/team-stats?type=assigned")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Prospects assignés
              </CardTitle>
              <div className="bg-[hsl(var(--accent-green-light))] p-2 rounded-lg">
                <Target className="h-5 w-5 text-[hsl(var(--accent-green))]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalAssignedProspects}
              </div>
              <p className="text-xs text-muted-foreground">
                En cours de traitement
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <Card
            className="border-l-4 border-l-[hsl(var(--accent-purple))] transition-all duration-300 hover:shadow-lg cursor-pointer"
            onClick={() => navigate("/team-stats?type=completed")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Traités aujourd'hui
              </CardTitle>
              <div className="bg-[hsl(var(--accent-purple-light))] p-2 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-[hsl(var(--accent-purple))]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedToday}</div>
              <p className="text-xs text-muted-foreground">
                Prospects contactés
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <Card
            className="border-l-4 border-l-[hsl(var(--accent-orange))] transition-all duration-300 hover:shadow-lg cursor-pointer"
            onClick={() => navigate("/team-stats?type=callbacks")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Rappels planifiés
              </CardTitle>
              <div className="bg-[hsl(var(--accent-orange-light))] p-2 rounded-lg">
                <Phone className="h-5 w-5 text-[hsl(var(--accent-orange))]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingCallbacks}</div>
              <p className="text-xs text-muted-foreground">À effectuer</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <Card
            className="border-l-4 border-l-[hsl(var(--accent-pink))] transition-all duration-300 hover:shadow-lg cursor-pointer"
            onClick={() => navigate("/team-stats?type=validated")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Prospects validés
              </CardTitle>
              <div className="bg-[hsl(var(--accent-pink-light))] p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-[hsl(var(--accent-pink))]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.validatedProspects}
              </div>
              <p className="text-xs text-muted-foreground">RDV planifiés</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <Card
            className="border-l-4 border-l-[hsl(var(--accent-cyan))] transition-all duration-300 hover:shadow-lg cursor-pointer"
            onClick={() => navigate("/team-stats?type=conversion")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Taux de conversion
              </CardTitle>
              <div className="bg-[hsl(var(--accent-cyan-light))] p-2 rounded-lg">
                <Clock className="h-5 w-5 text-[hsl(var(--accent-cyan))]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversionRate}%</div>
              <p className="text-xs text-muted-foreground">
                Assignés → Validés
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Statistiques de l'équipe SDR */}
      <motion.div variants={itemVariants}>
        <TeamStatsCard />
      </motion.div>

      {/* Statistiques des emails */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Statistiques des emails
            </CardTitle>
            <CardDescription>
              État des campagnes d'emailing par plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeEmailTab} onValueChange={setActiveEmailTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="apollo">Apollo</TabsTrigger>
                <TabsTrigger value="brevo">Brevo</TabsTrigger>
              </TabsList>

              <TabsContent value="apollo" className="mt-4">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "Envoyés",
                            value: emailStats.emailsSent,
                            color: "hsl(var(--accent-blue))",
                          },
                          {
                            name: "Ouverts",
                            value: emailStats.emailsOpened,
                            color: "hsl(var(--accent-green))",
                          },
                          {
                            name: "Répondus",
                            value: emailStats.emailsReplied,
                            color: "hsl(var(--accent-purple))",
                          },
                          {
                            name: "Rebondis",
                            value: emailStats.emailsBounced,
                            color: "hsl(var(--accent-orange))",
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          {
                            name: "Envoyés",
                            value: emailStats.emailsSent,
                            color: "hsl(var(--accent-blue))",
                          },
                          {
                            name: "Ouverts",
                            value: emailStats.emailsOpened,
                            color: "hsl(var(--accent-green))",
                          },
                          {
                            name: "Répondus",
                            value: emailStats.emailsReplied,
                            color: "hsl(var(--accent-purple))",
                          },
                          {
                            name: "Rebondis",
                            value: emailStats.emailsBounced,
                            color: "hsl(var(--accent-orange))",
                          },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div
                    className="flex items-center justify-between p-3 bg-[hsl(var(--accent-blue-light))] rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => navigate("/email-leads?status=sent")}
                  >
                    <span className="text-sm font-medium">Envoyés</span>
                    <span className="text-lg font-bold text-[hsl(var(--accent-blue))]">
                      {emailStats.emailsSent}
                    </span>
                  </div>
                  <div
                    className="flex items-center justify-between p-3 bg-[hsl(var(--accent-green-light))] rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => navigate("/email-leads?status=opened")}
                  >
                    <span className="text-sm font-medium">Ouverts</span>
                    <span className="text-lg font-bold text-[hsl(var(--accent-green))]">
                      {emailStats.emailsOpened}
                    </span>
                  </div>
                  <div
                    className="flex items-center justify-between p-3 bg-[hsl(var(--accent-purple-light))] rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => navigate("/email-leads?status=replied")}
                  >
                    <span className="text-sm font-medium">Répondus</span>
                    <span className="text-lg font-bold text-[hsl(var(--accent-purple))]">
                      {emailStats.emailsReplied}
                    </span>
                  </div>
                  <div
                    className="flex items-center justify-between p-3 bg-[hsl(var(--accent-orange-light))] rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => navigate("/email-leads?status=bounced")}
                  >
                    <span className="text-sm font-medium">Rebondis</span>
                    <span className="text-lg font-bold text-[hsl(var(--accent-orange))]">
                      {emailStats.emailsBounced}
                    </span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="brevo" className="mt-4">
                {realBrevoStats && !brevoStatsLoading ? (
                  <EmailStatsChart
                    stats={realBrevoStats}
                    onViewAllContacts={() => navigate("/brevo/all-contacts")}
                  />
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    Chargement des statistiques Brevo...
                  </div>
                )}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div
                    className="flex items-center justify-between p-3 bg-[hsl(var(--accent-blue-light))] rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => navigate("/brevo-leads?status=clicks")}
                  >
                    <span className="text-sm font-medium">Cliqués</span>
                    <span className="text-lg font-bold text-[hsl(var(--accent-blue))]">
                      {realBrevoStats?.total_clicks || 0}
                    </span>
                  </div>
                  <div
                    className="flex items-center justify-between p-3 bg-[hsl(var(--accent-green-light))] rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => navigate("/brevo-leads?status=opens")}
                  >
                    <span className="text-sm font-medium">Ouverts</span>
                    <span className="text-lg font-bold text-[hsl(var(--accent-green))]">
                      {realBrevoStats?.total_opens || 0}
                    </span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>
              Gestion de l'équipe et des prospects
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/prospects")}
            >
              <Target className="h-4 w-4 mr-2" />
              Assigner des prospects
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/reports")}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Voir les rapports
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/prospects/assigned")}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Suivre les prospects assignés
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance de l'équipe</CardTitle>
            <CardDescription>Indicateurs clés</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Activité par SDR</span>
              <span className="text-sm font-medium">
                {stats.totalSDRTeam > 0
                  ? Math.round((stats.teamActivity / stats.totalSDRTeam) * 10) /
                    10
                  : 0}{" "}
                actions/membre
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Prospects par SDR</span>
              <span className="text-sm font-medium">
                {stats.totalSDRTeam > 0
                  ? Math.round(
                      stats.totalAssignedProspects / stats.totalSDRTeam
                    )
                  : 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Prospects validés</span>
              <span className="text-sm font-medium text-green-600">
                {stats.validatedProspects} RDV
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Performance</span>
              <span className="text-sm font-medium">
                {stats.conversionRate >= 30
                  ? "🔥 Excellent"
                  : stats.conversionRate >= 15
                  ? "✅ Bon"
                  : "⚠️ À améliorer"}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default ManagerDashboard;
