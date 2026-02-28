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
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend,
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
  const { isOnline, lastSyncAt, pendingCount, isSyncing, triggerSync, syncLogs } = useOfflineSync();
  const [stats, setStats] = useState({
    total: 0, today: 0, enProduction: 0, livres: 0,
    paiements: 0, paiementsEnAttente: 0, users: 0, usersEnAttente: 0,
    districts: 0, regions: 0, cartesPret: 0, cartesLivrees: 0,
  });
  const [recentBeneficiaires, setRecentBeneficiaires] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);
  const [paymentMethodData, setPaymentMethodData] = useState<any[]>([]);
  const [dailyTrend, setDailyTrend] = useState<any[]>([]);
  const [topDistricts, setTopDistricts] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  const showAdmin = user && isAdmin(user.role);
  const showFinance = user && ["super_admin", "dg", "assistante_dg", "comptable"].includes(user.role);

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date().toISOString().split("T")[0];

      const queries = [
        supabase.from("beneficiaires").select("id", { count: "exact", head: true }).then(r => r),
        supabase.from("beneficiaires").select("id", { count: "exact", head: true }).gte("created_at", today).then(r => r),
        supabase.from("beneficiaires").select("id", { count: "exact", head: true }).eq("status", "en_production").then(r => r),
        supabase.from("beneficiaires").select("id", { count: "exact", head: true }).eq("status", "livre").then(r => r),
        supabase.from("paiements").select("montant").eq("status", "paye").then(r => r),
        supabase.from("paiements").select("id", { count: "exact", head: true }).eq("status", "en_attente").then(r => r),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "actif").then(r => r),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "en_attente").then(r => r),
        supabase.from("beneficiaires").select("*").order("created_at", { ascending: false }).limit(5).then(r => r),
        supabase.from("districts").select("id", { count: "exact", head: true }).then(r => r),
        supabase.from("regions").select("id", { count: "exact", head: true }).then(r => r),
        supabase.from("cartes").select("id", { count: "exact", head: true }).eq("status", "pret").then(r => r),
        supabase.from("cartes").select("id", { count: "exact", head: true }).eq("status", "livre").then(r => r),
        supabase.from("beneficiaires").select("status").then(r => r),
        supabase.from("beneficiaires").select("created_at, status").then(r => r),
        supabase.from("paiements").select("methode, montant, status").then(r => r),
        supabase.from("paiements").select("*, beneficiaires(nom, prenoms, matricule)").order("created_at", { ascending: false }).limit(5).then(r => r),
        supabase.from("beneficiaires").select("district_id, districts(nom)").then(r => r),
      ];

      const results = await Promise.all(queries);

      const totalPaiements = results[4].data?.reduce((s: number, p: any) => s + (p.montant || 0), 0) || 0;

      setStats({
        total: results[0].count || 0,
        today: results[1].count || 0,
        enProduction: results[2].count || 0,
        livres: results[3].count || 0,
        paiements: totalPaiements,
        paiementsEnAttente: results[5].count || 0,
        users: results[6].count || 0,
        usersEnAttente: results[7].count || 0,
        districts: results[9].count || 0,
        regions: results[10].count || 0,
        cartesPret: results[11].count || 0,
        cartesLivrees: results[12].count || 0,
      });

      setRecentBeneficiaires(results[8].data || []);

      // Status distribution (pie chart)
      const statusCounts: Record<string, number> = {};
      (results[13].data || []).forEach((b: any) => {
        statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
      });
      const statusLabelsMap: Record<string, string> = { enregistre: "Enregistré", en_production: "En production", livre: "Livré" };
      setStatusDistribution(
        Object.entries(statusCounts).map(([k, v]) => ({ name: statusLabelsMap[k] || k, value: v }))
      );

      // Monthly data (bar chart)
      const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
      const monthCounts: Record<string, number> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthCounts[key] = 0;
      }
      (results[14].data || []).forEach((b: any) => {
        const key = b.created_at.substring(0, 7);
        if (key in monthCounts) monthCounts[key]++;
      });
      setMonthlyData(
        Object.entries(monthCounts).map(([k, v]) => {
          const [y, m] = k.split("-");
          return { mois: monthNames[parseInt(m) - 1] + " " + y.slice(2), enregistrements: v };
        })
      );

      // Payment method distribution
      const methodCounts: Record<string, { count: number; total: number }> = {};
      (results[15].data || []).forEach((p: any) => {
        const m = p.methode || "Inconnu";
        if (!methodCounts[m]) methodCounts[m] = { count: 0, total: 0 };
        methodCounts[m].count++;
        if (p.status === "paye") methodCounts[m].total += p.montant || 0;
      });
      setPaymentMethodData(
        Object.entries(methodCounts).map(([k, v]) => ({ name: k === "wave" ? "Wave" : k === "especes" ? "Espèces" : k, value: v.count, montant: v.total }))
      );

      // Recent payments
      setRecentPayments(results[16].data || []);

      // Top districts
      const distCounts: Record<string, { name: string; count: number }> = {};
      (results[17].data || []).forEach((b: any) => {
        const dName = b.districts?.nom || "Non assigné";
        if (!distCounts[dName]) distCounts[dName] = { name: dName, count: 0 };
        distCounts[dName].count++;
      });
      setTopDistricts(
        Object.values(distCounts).sort((a, b) => b.count - a.count).slice(0, 8)
      );

      // Daily trend (last 14 days)
      const dailyCounts: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dailyCounts[d.toISOString().split("T")[0]] = 0;
      }
      (results[14].data || []).forEach((b: any) => {
        const day = b.created_at.split("T")[0];
        if (day in dailyCounts) dailyCounts[day]++;
      });
      setDailyTrend(
        Object.entries(dailyCounts).map(([k, v]) => ({
          jour: new Date(k).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
          inscriptions: v,
        }))
      );
    };

    fetchData();
  }, []);

  const kpiCards = [
    { label: "Total bénéficiaires", value: stats.total.toLocaleString("fr-FR"), icon: Users, color: "text-primary", show: true },
    { label: "Aujourd'hui", value: stats.today, icon: UserPlus, color: "text-emerald-600", show: true },
    { label: "En production", value: stats.enProduction, icon: Activity, color: "text-amber-500", show: true },
    { label: "Cartes livrées", value: stats.cartesLivrees, icon: Truck, color: "text-sky-500", show: true },
    { label: "Paiements reçus", value: `${(stats.paiements / 1000).toLocaleString("fr-FR")}k`, icon: CreditCard, color: "text-primary", show: showFinance },
    { label: "Paiements en attente", value: stats.paiementsEnAttente, icon: AlertCircle, color: "text-amber-500", show: showFinance },
    { label: "Utilisateurs actifs", value: stats.users, icon: TrendingUp, color: "text-emerald-600", show: showAdmin },
    { label: "Inscriptions en attente", value: stats.usersEnAttente, icon: UserPlus, color: "text-amber-500", show: showAdmin },
    { label: "Districts", value: stats.districts, icon: MapPin, color: "text-sky-500", show: showAdmin },
    { label: "Régions", value: stats.regions, icon: BarChart3, color: "text-primary", show: showAdmin },
  ].filter(c => c.show);

  const statusLabels: Record<string, string> = { enregistre: "Enregistré", en_production: "En production", livre: "Livré" };
  const statusColors: Record<string, string> = {
    enregistre: "bg-sky-100 text-sky-700",
    en_production: "bg-amber-100 text-amber-700",
    livre: "bg-emerald-100 text-emerald-700",
  };
  const paymentStatusColors: Record<string, string> = {
    paye: "bg-emerald-100 text-emerald-700",
    en_attente: "bg-amber-100 text-amber-700",
    echoue: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-muted-foreground">Bienvenue, {user?.prenoms}. Voici un aperçu de l'activité.</p>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? <Wifi className="h-4 w-4 text-emerald-500" /> : <WifiOff className="h-4 w-4 text-destructive" />}
          <span className="text-xs text-muted-foreground">{isOnline ? "En ligne" : "Hors ligne"}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
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

      {/* Charts Row 1: Bar + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Registrations Bar Chart */}
        <Card className="shadow-card lg:col-span-2">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Enregistrements mensuels</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mois" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Bar dataKey="enregistrements" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Pie Chart */}
        <Card className="shadow-card">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Répartition par statut</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Area trend + Histogram districts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trend Area Chart */}
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

        {/* Top Districts Horizontal Bar */}
        <Card className="shadow-card">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Top districts (bénéficiaires)</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topDistricts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={120} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method Pie + Recent Lists */}
      {showFinance && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Methods Pie */}
          <Card className="shadow-card">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Méthodes de paiement</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentMethodData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                      {paymentMethodData.map((_, i) => (
                        <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card className="shadow-card lg:col-span-2">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Derniers paiements</h3>
              <div className="space-y-3">
                {recentPayments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucun paiement</p>
                ) : (
                  recentPayments.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {p.beneficiaires?.nom} {p.beneficiaires?.prenoms}
                        </p>
                        <p className="text-xs text-muted-foreground">{p.beneficiaires?.matricule} — {p.methode || "N/A"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">{p.montant?.toLocaleString("fr-FR")} FCFA</p>
                        <Badge className={`text-[10px] border-0 ${paymentStatusColors[p.status] || ""}`}>
                          {p.status === "paye" ? "Payé" : p.status === "en_attente" ? "En attente" : p.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Beneficiaires + Sync */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-card lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Derniers enregistrements</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/beneficiaires")}>
                Voir tout
              </Button>
            </div>
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
                    <div className="flex items-center gap-3">
                      {b.photo_url ? (
                        <img src={b.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">{b.nom} {b.prenoms}</p>
                        <p className="text-xs text-muted-foreground">{b.profession} — {b.matricule}</p>
                      </div>
                    </div>
                    <Badge className={`text-[10px] border-0 ${statusColors[b.status] || ""}`}>
                      {statusLabels[b.status] || b.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sync Status */}
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
              {lastSyncAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Dernière sync</span>
                  <span className="text-xs">{new Date(lastSyncAt).toLocaleString("fr-FR")}</span>
                </div>
              )}
              <Button size="sm" className="w-full gradient-primary" onClick={triggerSync} disabled={isSyncing || !isOnline || pendingCount === 0}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Synchronisation..." : "Synchroniser"}
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
