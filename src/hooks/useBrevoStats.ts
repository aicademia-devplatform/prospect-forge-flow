import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BrevoEmailStats {
  total_sent: number;
  total_delivered: number;
  total_views: number;
  total_opens: number;
  total_clicks: number;
  total_clickers: number;
  total_complaints: number;
  total_unsubscribes: number;
  total_hard_bounces: number;
  total_soft_bounces: number;
  total_deferred: number;
  total_replies: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  unsubscribe_rate: number;
  bounce_rate: number;
}

export interface BrevoStatsHook {
  stats: BrevoEmailStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useBrevoStats = (): BrevoStatsHook => {
  const [stats, setStats] = useState<BrevoEmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("v_brevo_email_stats")
        .select("*")
        .single();

      if (fetchError) {
        // Si la vue n'existe pas encore, retourner des données par défaut
        if (fetchError.code === "PGRST116") {
          console.warn(
            "Vue v_brevo_email_stats non trouvée, utilisation de données par défaut"
          );
          setStats({
            total_sent: 0,
            total_delivered: 0,
            total_views: 0,
            total_opens: 0,
            total_clicks: 0,
            total_clickers: 0,
            total_complaints: 0,
            total_unsubscribes: 0,
            total_hard_bounces: 0,
            total_soft_bounces: 0,
            total_deferred: 0,
            total_replies: 0,
            delivery_rate: 0,
            open_rate: 0,
            click_rate: 0,
            unsubscribe_rate: 0,
            bounce_rate: 0,
          });
          return;
        }
        throw fetchError;
      }

      setStats(data);
    } catch (err) {
      console.error("Erreur lors du chargement des statistiques Brevo:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
};
