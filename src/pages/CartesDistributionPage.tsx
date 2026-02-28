import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Truck, Package, CheckCircle, Clock } from "lucide-react";

const cardStatusLabels: Record<string, string> = {
  en_production: "En production",
  pret: "Prêt",
  en_livraison: "En livraison",
  livre: "Livré",
  confirme: "Confirmé",
};

const cardStatusColors: Record<string, string> = {
  en_production: "bg-warning text-warning-foreground",
  pret: "bg-info text-info-foreground",
  en_livraison: "bg-accent text-accent-foreground",
  livre: "bg-success text-success-foreground",
  confirme: "bg-primary text-primary-foreground",
};

const CartesDistributionPage = () => {
  const [cartes, setCartes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCartes = async () => {
    const { data } = await supabase
      .from("cartes")
      .select("*, beneficiaires(nom, prenoms, matricule, domicile)")
      .order("created_at", { ascending: false });
    setCartes(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCartes(); }, []);

  const updateStatus = async (carteId: string, newStatus: string) => {
    const updateData: any = { status: newStatus };
    if (newStatus === "en_livraison") updateData.date_expedition = new Date().toISOString();
    if (newStatus === "livre") { updateData.date_livraison = new Date().toISOString(); updateData.livre_par = user?.id; }
    if (newStatus === "confirme") { updateData.date_confirmation = new Date().toISOString(); updateData.confirme_par = user?.id; }

    await supabase.from("cartes").update(updateData).eq("id", carteId);

    // Update beneficiaire status too
    if (newStatus === "livre" || newStatus === "confirme") {
      const carte = cartes.find(c => c.id === carteId);
      if (carte) {
        await supabase.from("beneficiaires").update({ status: "livre" }).eq("id", carte.beneficiaire_id);
      }
    }

    toast({ title: "Statut mis à jour", description: `Carte passée en "${cardStatusLabels[newStatus]}"` });
    fetchCartes();
  };

  const stats = {
    production: cartes.filter(c => c.status === "en_production").length,
    pret: cartes.filter(c => c.status === "pret").length,
    livraison: cartes.filter(c => c.status === "en_livraison").length,
    livre: cartes.filter(c => ["livre", "confirme"].includes(c.status)).length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Distribution des Cartes</h1>
      <p className="text-muted-foreground">Suivi de production, livraison et confirmation de réception</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-card"><CardContent className="p-4 text-center">
          <Clock className="h-6 w-6 text-warning mx-auto mb-2" />
          <p className="text-2xl font-bold">{stats.production}</p>
          <p className="text-xs text-muted-foreground">En production</p>
        </CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-4 text-center">
          <Package className="h-6 w-6 text-info mx-auto mb-2" />
          <p className="text-2xl font-bold">{stats.pret}</p>
          <p className="text-xs text-muted-foreground">Prêtes</p>
        </CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-4 text-center">
          <Truck className="h-6 w-6 text-accent mx-auto mb-2" />
          <p className="text-2xl font-bold">{stats.livraison}</p>
          <p className="text-xs text-muted-foreground">En livraison</p>
        </CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-4 text-center">
          <CheckCircle className="h-6 w-6 text-success mx-auto mb-2" />
          <p className="text-2xl font-bold">{stats.livre}</p>
          <p className="text-xs text-muted-foreground">Livrées</p>
        </CardContent></Card>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-4">
          {loading ? (
            <div className="text-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : cartes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucune carte en cours de traitement</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matricule</TableHead>
                  <TableHead>Bénéficiaire</TableHead>
                  <TableHead>Adresse</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cartes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs text-primary font-semibold">{c.beneficiaires?.matricule}</TableCell>
                    <TableCell className="font-medium text-sm">{c.beneficiaires?.nom} {c.beneficiaires?.prenoms}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.beneficiaires?.domicile}</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] border-0 ${cardStatusColors[c.status] || ""}`}>
                        {cardStatusLabels[c.status] || c.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {c.status === "en_production" && (
                          <Button size="sm" className="h-7 text-xs" variant="outline" onClick={() => updateStatus(c.id, "pret")}>Marquer prêt</Button>
                        )}
                        {c.status === "pret" && (
                          <Button size="sm" className="h-7 text-xs gradient-primary" onClick={() => updateStatus(c.id, "en_livraison")}>Expédier</Button>
                        )}
                        {c.status === "en_livraison" && (
                          <Button size="sm" className="h-7 text-xs gradient-primary" onClick={() => updateStatus(c.id, "livre")}>Confirmer livraison</Button>
                        )}
                        {c.status === "livre" && (
                          <Button size="sm" className="h-7 text-xs gradient-primary" onClick={() => updateStatus(c.id, "confirme")}>Confirmer réception</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CartesDistributionPage;
