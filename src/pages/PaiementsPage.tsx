import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { CreditCard, CheckCircle, Clock } from "lucide-react";

const PaiementsPage = () => {
  const [paiements, setPaiements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("paiements")
        .select("*, beneficiaires(nom, prenoms, matricule)")
        .order("created_at", { ascending: false });
      setPaiements(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const totalPaye = paiements.filter(p => p.status === "paye").reduce((s, p) => s + p.montant, 0);
  const totalAttente = paiements.filter(p => p.status === "en_attente").reduce((s, p) => s + p.montant, 0);
  const totalComplets = paiements.filter(p => p.status === "paye").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Paiements</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalPaye.toLocaleString("fr-FR")} FCFA</p>
              <p className="text-xs text-muted-foreground">Total reçu</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-warning flex items-center justify-center">
              <Clock className="h-6 w-6 text-warning-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalAttente.toLocaleString("fr-FR")} FCFA</p>
              <p className="text-xs text-muted-foreground">En attente</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-success flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-success-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalComplets}</p>
              <p className="text-xs text-muted-foreground">Paiements confirmés</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-4">
          {loading ? (
            <div className="text-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : paiements.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucun paiement enregistré</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matricule</TableHead>
                  <TableHead>Bénéficiaire</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paiements.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs font-semibold text-primary">{p.beneficiaires?.matricule}</TableCell>
                    <TableCell className="font-medium text-sm">{p.beneficiaires?.nom} {p.beneficiaires?.prenoms}</TableCell>
                    <TableCell className="text-sm">{p.type_paiement === "paiement_1" ? "1er paiement" : "2e paiement"}</TableCell>
                    <TableCell className="font-semibold">{p.montant?.toLocaleString("fr-FR")} F</TableCell>
                    <TableCell>
                      <Badge className={`border-0 text-[10px] ${p.status === "paye" ? "bg-success text-success-foreground" : p.status === "en_attente" ? "bg-warning text-warning-foreground" : "bg-destructive text-destructive-foreground"}`}>
                        {p.status === "paye" ? "Payé" : p.status === "en_attente" ? "En attente" : p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.paid_at ? new Date(p.paid_at).toLocaleDateString("fr-FR") : "-"}</TableCell>
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

export default PaiementsPage;
