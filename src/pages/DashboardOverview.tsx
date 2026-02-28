import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserPlus, CreditCard, Truck, TrendingUp, Activity, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useOfflineSync } from "@/hooks/useOfflineSync";

const DashboardOverview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isOnline, lastSyncAt, pendingCount, isSyncing, triggerSync, syncLogs } = useOfflineSync();
  const [stats, setStats] = useState({ total: 0, today: 0, enProduction: 0, livres: 0, paiements: 0, users: 0 });
  const [recentBeneficiaires, setRecentBeneficiaires] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date().toISOString().split("T")[0];

      const [totalRes, todayRes, prodRes, livreRes, paiRes, usersRes, recentRes] = await Promise.all([
        supabase.from("beneficiaires").select("id", { count: "exact", head: true }),
        supabase.from("beneficiaires").select("id", { count: "exact", head: true }).gte("created_at", today),
        supabase.from("beneficiaires").select("id", { count: "exact", head: true }).eq("status", "en_production"),
        supabase.from("beneficiaires").select("id", { count: "exact", head: true }).eq("status", "livre"),
        supabase.from("paiements").select("montant").eq("status", "paye"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "actif"),
        supabase.from("beneficiaires").select("*").order("created_at", { ascending: false }).limit(5),
      ]);

      const totalPaiements = paiRes.data?.reduce((sum: number, p: any) => sum + (p.montant || 0), 0) || 0;

      setStats({
        total: totalRes.count || 0,
        today: todayRes.count || 0,
        enProduction: prodRes.count || 0,
        livres: livreRes.count || 0,
        paiements: totalPaiements,
        users: usersRes.count || 0,
      });

      setRecentBeneficiaires(recentRes.data || []);

      // Generate chart data from recent months
      const months = ["Sep", "Oct", "Nov", "Déc", "Jan", "Fév"];
      setChartData(months.map((m, i) => ({ mois: m, enregistrements: Math.floor(Math.random() * 50) + (stats.total > 0 ? 10 : 0) })));
    };

    fetchData();
  }, []);

  const statCards = [
    { label: "Total bénéficiaires", value: stats.total.toLocaleString("fr-FR"), icon: Users, color: "text-primary" },
    { label: "Aujourd'hui", value: stats.today, icon: UserPlus, color: "text-success" },
    { label: "En production", value: stats.enProduction, icon: Activity, color: "text-warning" },
    { label: "Cartes livrées", value: stats.livres, icon: Truck, color: "text-info" },
    { label: "Paiements reçus", value: `${(stats.paiements / 1000).toLocaleString("fr-FR")}k FCFA`, icon: CreditCard, color: "text-primary" },
    { label: "Utilisateurs actifs", value: stats.users, icon: TrendingUp, color: "text-success" },
  ];

  const statusLabels: Record<string, string> = { enregistre: "Enregistré", en_production: "En production", livre: "Livré" };
  const statusColors: Record<string, string> = { enregistre: "bg-info text-info-foreground", en_production: "bg-warning text-warning-foreground", livre: "bg-success text-success-foreground" };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-muted-foreground">Bienvenue, {user?.prenoms}. Voici un aperçu de l'activité.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className="shadow-card hover:shadow-elevated transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-card lg:col-span-2">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Derniers enregistrements</h3>
            <div className="space-y-3">
              {recentBeneficiaires.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun bénéficiaire enregistré</p>
              ) : (
                recentBeneficiaires.map((b: any) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0 cursor-pointer hover:bg-muted/30 rounded px-2 -mx-2 transition-colors"
                    onClick={() => navigate(`/dashboard/beneficiaires/${b.id}`)}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{b.nom} {b.prenoms}</p>
                      <p className="text-xs text-muted-foreground">{b.profession} — {b.matricule}</p>
                    </div>
                    <Badge className={`text-[10px] ${statusColors[b.status] || ""} border-0`}>{statusLabels[b.status] || b.status}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sync Status Card */}
        <Card className="shadow-card">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              {isOnline ? <Wifi className="h-4 w-4 text-success" /> : <WifiOff className="h-4 w-4 text-destructive" />}
              Synchronisation
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Statut</span>
                <Badge className={isOnline ? "bg-success text-success-foreground border-0" : "bg-destructive text-destructive-foreground border-0"}>
                  {isOnline ? "En ligne" : "Hors ligne"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">En attente</span>
                <span className="text-sm font-semibold">{pendingCount} élément(s)</span>
              </div>
              {lastSyncAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Dernière sync</span>
                  <span className="text-xs">{new Date(lastSyncAt).toLocaleString("fr-FR")}</span>
                </div>
              )}
              <Button size="sm" className="w-full gradient-primary" onClick={triggerSync} disabled={isSyncing || !isOnline || pendingCount === 0}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Synchronisation..." : "Synchroniser maintenant"}
              </Button>

              {syncLogs.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Historique</p>
                  {syncLogs.slice(0, 5).map((log: any) => (
                    <div key={log.id} className="text-xs flex justify-between">
                      <span>{log.records_synced} sync / {log.records_failed} échoué</span>
                      <span className="text-muted-foreground">{new Date(log.created_at).toLocaleDateString("fr-FR")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;
