import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth, isAdmin } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, UserPlus, CreditCard, Truck, TrendingUp, Activity,
  Wifi, WifiOff, RefreshCw, MapPin, BarChart3, AlertCircle
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useOfflineSync } from "@/hooks/useOfflineSync";

const COLORS = [
  "hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--accent))",
];

const DashboardOverview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isOnline, pendingCount, isSyncing, triggerSync } = useOfflineSync();
  const [stats, setStats] = useState({
    total: 0, today: 0, enProduction: 0, livres: 0,
    paiements: 0, paiementsEnAttente: 0, users: 0, usersEnAttente: 0,
    districts: 0, regions: 0, cartesPret: 0, cartesLivrees: 0,
  });
  const [recentBeneficiaires, setRecentBeneficiaires] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);
  const [dailyTrend, setDailyTrend] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  const showAdmin = user && isAdmin(user.role);
  const showFinance = user && ["super_admin", "dg", "assistante_dg", "comptable"].includes(user.role);
  const isCommercial = user?.role === "commercial";
  const isChefEquipe = user?.role === "chef_equipe";

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const today = new Date().toISOString().split("T")[0];

      // Build base query filters based on role
      let benQuery = supabase.from("beneficiaires").select("*");
      let benCountQuery = supabase.from("beneficiaires").select("id", { count: "exact", head: true });
      let benTodayQuery = supabase.from("beneficiaires").select("id", { count: "exact", head: true }).gte("created_at", today);
      let benProdQuery = supabase.from("beneficiaires").select("id", { count: "exact", head: true }).eq("status", "en_production");
      let benLivreQuery = supabase.from("beneficiaires").select("id", { count: "exact", head: true }).eq("status", "livre");
      let recentBenQuery = supabase.from("beneficiaires").select("*").order("created_at", { ascending: false }).limit(5);

      // RLS already filters, but for commercial we ensure only their data shows
      // RLS policies handle this at DB level

      const queries = [
        benCountQuery,
        benTodayQuery,
        benProdQuery,
        benLivreQuery,
        supabase.from("paiements").select("montant").eq("status", "paye"),
        supabase.from("paiements").select("id", { count: "exact", head: true }).eq("status", "en_attente"),
        ...(showAdmin ? [
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "actif"),
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "en_attente"),
        ] : []),
        recentBenQuery,
        supabase.from("districts").select("id", { count: "exact", head: true }),
        supabase.from("regions").select("id", { count: "exact", head: true }),
        supabase.from("cartes").select("id", { count: "exact", head: true }).eq("status", "pret"),
        supabase.from("cartes").select("id", { count: "exact", head: true }).eq("status", "livre"),
        benQuery,
        supabase.from("paiements").select("*, beneficiaires(nom, prenoms, matricule)").order("created_at", { ascending: false }).limit(5),
      ];

      const results = await Promise.all(queries);
      
      let idx = 0;
      const totalPaiements = results[4].data?.reduce((s: number, p: any) => s + (p.montant || 0), 0) || 0;

      setStats({
        total: results[0].count || 0,
        today: results[1].count || 0,
        enProduction: results[2].count || 0,
        livres: results[3].count || 0,
        paiements: totalPaiements,
        paiementsEnAttente: results[5].count || 0,
        users: showAdmin ? (results[6].count || 0) : 0,
        usersEnAttente: showAdmin ? (results[7].count || 0) : 0,
        districts: results[showAdmin ? 9 : 7].count || 0,
        regions: results[showAdmin ? 10 : 8].count || 0,
        cartesPret: results[showAdmin ? 11 : 9].count || 0,
        cartesLivrees: results[showAdmin ? 12 : 10].count || 0,
      });

      const recentIdx = showAdmin ? 8 : 6;
      setRecentBeneficiaires(results[recentIdx].data || []);

      const allBenIdx = showAdmin ? 13 : 11;
      const allBen = results[allBenIdx].data || [];

      // Status distribution
      const statusCounts: Record<string, number> = {};
      allBen.forEach((b: any) => { statusCounts[b.status] = (statusCounts[b.status] || 0) + 1; });
      const statusLabelsMap: Record<string, string> = { enregistre: "Enregistré", en_production: "En production", livre: "Livré" };
      setStatusDistribution(Object.entries(statusCounts).map(([k, v]) => ({ name: statusLabelsMap[k] || k, value: v })));

      // Monthly data
      const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
      const monthCounts: Record<string, number> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthCounts[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`] = 0;
      }
      allBen.forEach((b: any) => { const key = b.created_at.substring(0, 7); if (key in monthCounts) monthCounts[key]++; });
      setMonthlyData(Object.entries(monthCounts).map(([k, v]) => {
        const [y, m] = k.split("-");
        return { mois: monthNames[parseInt(m) - 1] + " " + y.slice(2), enregistrements: v };
      }));

      // Daily trend
      const dailyCounts: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        dailyCounts[d.toISOString().split("T")[0]] = 0;
      }
      allBen.forEach((b: any) => { const day = b.created_at.split("T")[0]; if (day in dailyCounts) dailyCounts[day]++; });
      setDailyTrend(Object.entries(dailyCounts).map(([k, v]) => ({
        jour: new Date(k).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }), inscriptions: v,
      })));

      const paymentsIdx = showAdmin ? 14 : 12;
      setRecentPayments(results[paymentsIdx].data || []);
    };

    fetchData();
  }, [user]);

  const kpiCards = [
    { label: "Total bénéficiaires", value: stats.total.toLocaleString("fr-FR"), icon: Users, color: "text-primary", show: true },
    { label: "Aujourd'hui", value: stats.today, icon: UserPlus, color: "text-emerald-600", show: true },
    { label: "En production", value: stats.enProduction, icon: Activity, color: "text-amber-500", show: true },
    { label: "Cartes livrées", value: stats.cartesLivrees, icon: Truck, color: "text-sky-500", show: true },
    { label: "Paiements reçus", value: `${(stats.paiements / 1000).toLocaleString("fr-FR")}k`, icon: CreditCard, color: "text-primary", show: showFinance },
    { label: "Paiements en attente", value: stats.paiementsEnAttente, icon: AlertCircle, color: "text-amber-500", show: showFinance },
    { label: "Utilisateurs actifs", value: stats.users, icon: TrendingUp, color: "text-emerald-600", show: showAdmin },
    { label: "Inscriptions en attente", value: stats.usersEnAttente, icon: UserPlus, color: "text-amber-500", show: showAdmin },
  ].filter(c => c.show);

  const statusLabels: Record<string, string> = { enregistre: "Enregistré", en_production: "En production", livre: "Livré" };
  const statusColors: Record<string, string> = {
    enregistre: "bg-sky-100 text-sky-700", en_production: "bg-amber-100 text-amber-700", livre: "bg-emerald-100 text-emerald-700",
  };
  const paymentStatusColors: Record<string, string> = {
    paye: "bg-emerald-100 text-emerald-700", en_attente: "bg-amber-100 text-amber-700", echoue: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-muted-foreground">Bienvenue, {user?.prenoms}. {isCommercial ? "Vos enrôlements." : isChefEquipe ? "Votre équipe." : "Aperçu global."}</p>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? <Wifi className="h-4 w-4 text-emerald-500" /> : <WifiOff className="h-4 w-4 text-destructive" />}
          <span className="text-xs text-muted-foreground">{isOnline ? "En ligne" : "Hors ligne"}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {kpiCards.map((s) => (
          <Card key={s.label} className="shadow-card hover:shadow-elevated transition-all hover:-translate-y-0.5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-card lg:col-span-2">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Enrôlements mensuels</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mois" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="enregistrements" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Répartition par statut</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}>
                    {statusDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Trend */}
      <Card className="shadow-card">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Tendance des 14 derniers jours</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrend}>
                <defs>
                  <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="jour" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="inscriptions" stroke="hsl(var(--primary))" fill="url(#gradientArea)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent + Sync */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-card lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Derniers enrôlements</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/beneficiaires")}>Voir tout</Button>
            </div>
            <div className="space-y-3">
              {recentBeneficiaires.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun bénéficiaire enregistré</p>
              ) : (
                recentBeneficiaires.map((b: any) => (
                  <div key={b.id} className="flex items-center justify-between py-2 border-b border-border last:border-0 cursor-pointer hover:bg-muted/30 rounded px-2 -mx-2 transition-colors"
                    onClick={() => navigate(`/dashboard/beneficiaires/${b.id}`)}>
                    <div className="flex items-center gap-3">
                      {b.photo_url ? <img src={b.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" /> : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"><Users className="h-4 w-4 text-muted-foreground" /></div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">{b.nom} {b.prenoms}</p>
                        <p className="text-xs text-muted-foreground">{b.profession} — {b.matricule}</p>
                      </div>
                    </div>
                    <Badge className={`text-[10px] border-0 ${statusColors[b.status] || ""}`}>{statusLabels[b.status] || b.status}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              {isOnline ? <Wifi className="h-4 w-4 text-emerald-500" /> : <WifiOff className="h-4 w-4 text-destructive" />}
              Synchronisation
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Statut</span>
                <Badge className={`border-0 ${isOnline ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                  {isOnline ? "En ligne" : "Hors ligne"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">En attente</span>
                <span className="text-sm font-semibold">{pendingCount} élément(s)</span>
              </div>
              <Button size="sm" className="w-full gradient-primary" onClick={triggerSync} disabled={isSyncing || !isOnline || pendingCount === 0}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Synchronisation..." : "Synchroniser"}
              </Button>

              {/* Recent payments for finance */}
              {showFinance && recentPayments.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Derniers paiements</p>
                  {recentPayments.slice(0, 3).map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between py-1">
                      <span className="text-xs">{p.beneficiaires?.nom} {p.beneficiaires?.prenoms}</span>
                      <span className="text-xs font-bold">{p.montant?.toLocaleString("fr-FR")} F</span>
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
