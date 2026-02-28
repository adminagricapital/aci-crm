import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Download, FileSpreadsheet, Filter, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

type ExportType = "beneficiaires" | "paiements" | "cartes";

const ExportCSVPage = () => {
  const { toast } = useToast();
  const [exportType, setExportType] = useState<ExportType>("beneficiaires");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [districtId, setDistrictId] = useState("all");
  const [regionId, setRegionId] = useState("all");
  const [status, setStatus] = useState("all");
  const [exporting, setExporting] = useState(false);
  const [districts, setDistricts] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("districts").select("id, nom").order("nom"),
      supabase.from("regions").select("id, nom, district_id").order("nom"),
    ]).then(([d, r]) => {
      setDistricts(d.data || []);
      setRegions(r.data || []);
    });
  }, []);

  const filteredRegions = districtId === "all" ? regions : regions.filter(r => r.district_id === districtId);

  const downloadCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast({ title: "Aucune donnée", description: "Aucun enregistrement trouvé avec ces filtres", variant: "destructive" });
      return;
    }
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(";"),
      ...data.map(row => headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return "";
        const str = String(val).replace(/"/g, '""');
        return str.includes(";") || str.includes('"') || str.includes("\n") ? `"${str}"` : str;
      }).join(";"))
    ].join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export réussi", description: `${data.length} ligne(s) exportée(s)` });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      if (exportType === "beneficiaires") {
        let q = supabase.from("beneficiaires").select("matricule, nom, prenoms, sexe, date_naissance, lieu_naissance, nationalite, profession, domicile, telephone, taille, categorie_metier, status, created_at");
        if (dateFrom) q = q.gte("created_at", dateFrom);
        if (dateTo) q = q.lte("created_at", dateTo + "T23:59:59");
        if (districtId !== "all") q = q.eq("district_id", districtId);
        if (regionId !== "all") q = q.eq("region_id", regionId);
        if (status !== "all") q = q.eq("status", status as any);
        const { data } = await q.order("created_at", { ascending: false });
        downloadCSV(data || [], "ACI_Beneficiaires");
      } else if (exportType === "paiements") {
        let q = supabase.from("paiements").select("id, beneficiaire_id, type_paiement, montant, status, methode, telephone_payeur, reference_wave, paid_at, created_at");
        if (dateFrom) q = q.gte("created_at", dateFrom);
        if (dateTo) q = q.lte("created_at", dateTo + "T23:59:59");
        if (status !== "all") q = q.eq("status", status as any);
        const { data } = await q.order("created_at", { ascending: false });
        downloadCSV(data || [], "ACI_Paiements");
      } else {
        let q = supabase.from("cartes").select("id, beneficiaire_id, numero_carte, status, date_production, date_expedition, date_livraison, date_confirmation, created_at");
        if (dateFrom) q = q.gte("created_at", dateFrom);
        if (dateTo) q = q.lte("created_at", dateTo + "T23:59:59");
        if (status !== "all") q = q.eq("status", status as any);
        const { data } = await q.order("created_at", { ascending: false });
        downloadCSV(data || [], "ACI_Cartes");
      }
    } catch (err: any) {
      toast({ title: "Erreur d'export", description: err.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const statusOptions: Record<ExportType, { value: string; label: string }[]> = {
    beneficiaires: [
      { value: "all", label: "Tous" },
      { value: "enregistre", label: "Enregistré" },
      { value: "en_production", label: "En production" },
      { value: "livre", label: "Livré" },
    ],
    paiements: [
      { value: "all", label: "Tous" },
      { value: "en_attente", label: "En attente" },
      { value: "paye", label: "Payé" },
      { value: "echoue", label: "Échoué" },
    ],
    cartes: [
      { value: "all", label: "Tous" },
      { value: "en_production", label: "En production" },
      { value: "pret", label: "Prêt" },
      { value: "en_livraison", label: "En livraison" },
      { value: "livre", label: "Livré" },
      { value: "confirme", label: "Confirmé" },
    ],
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Export CSV / Excel</h1>
        <p className="text-muted-foreground">Exportez vos données avec des filtres par période, zone et statut</p>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-6 space-y-6">
          {/* Type d'export */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><FileSpreadsheet className="h-4 w-4 text-primary" /> Type de données</Label>
            <div className="flex gap-2 flex-wrap">
              {([
                { value: "beneficiaires", label: "Bénéficiaires" },
                { value: "paiements", label: "Paiements" },
                { value: "cartes", label: "Cartes" },
              ] as const).map(t => (
                <Button
                  key={t.value}
                  variant={exportType === t.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setExportType(t.value); setStatus("all"); }}
                  className={exportType === t.value ? "gradient-primary" : ""}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Filtres */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Date début</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Date fin</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>

            {exportType === "beneficiaires" && (
              <>
                <div className="space-y-2">
                  <Label>District</Label>
                  <Select value={districtId} onValueChange={v => { setDistrictId(v); setRegionId("all"); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les districts</SelectItem>
                      {districts.map(d => <SelectItem key={d.id} value={d.id}>{d.nom}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Région</Label>
                  <Select value={regionId} onValueChange={setRegionId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les régions</SelectItem>
                      {filteredRegions.map(r => <SelectItem key={r.id} value={r.id}>{r.nom}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Filter className="h-3 w-3" /> Statut</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions[exportType].map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button className="gradient-primary font-semibold" onClick={handleExport} disabled={exporting}>
            <Download className="h-4 w-4 mr-2" />
            {exporting ? "Export en cours..." : "Télécharger CSV"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportCSVPage;
