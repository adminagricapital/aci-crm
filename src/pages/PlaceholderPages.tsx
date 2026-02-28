import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Settings, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLORS = ["hsl(var(--primary))", "hsl(var(--warning))", "hsl(var(--success))", "hsl(var(--info))"];

export const RapportsPage = () => {
  const [stats, setStats] = useState<any>({ byStatus: [], byMonth: [] });

  useEffect(() => {
    const fetch = async () => {
      const { data: bens } = await supabase.from("beneficiaires").select("status, created_at");
      if (!bens) return;

      const byStatus = [
        { name: "Enregistré", value: bens.filter(b => b.status === "enregistre").length },
        { name: "En production", value: bens.filter(b => b.status === "en_production").length },
        { name: "Livré", value: bens.filter(b => b.status === "livre").length },
      ];

      setStats({ byStatus });
    };
    fetch();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rapports</h1>
          <p className="text-muted-foreground">Rapports détaillés par zone, commercial, période</p>
        </div>
        <Button variant="outline"><Download className="h-4 w-4 mr-2" /> Exporter CSV</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-4">Répartition par statut</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={stats.byStatus} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {stats.byStatus.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-4">Évolution des enregistrements</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.byStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const ParametresPage = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Settings className="h-4 w-4" /> Configuration générale</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Nom de l'organisation</p>
                <p className="text-sm text-muted-foreground">Association des Commerciaux Ivoiriens (ACI)</p>
              </div>
              <div>
                <p className="text-sm font-medium">Montant 1er paiement</p>
                <p className="text-sm text-muted-foreground">1 000 FCFA</p>
              </div>
              <div>
                <p className="text-sm font-medium">Montant 2e paiement</p>
                <p className="text-sm text-muted-foreground">3 000 FCFA</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-4">Mode de paiement</h3>
            <div className="space-y-2">
              <p className="text-sm"><span className="font-medium">Wave CI :</span> <span className="text-success">Mode simulation activé</span></p>
              <p className="text-xs text-muted-foreground">En production, connectez votre compte marchand Wave pour recevoir les paiements réels.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
