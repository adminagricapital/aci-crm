import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download, Printer, User } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import aciLogo from "@/assets/aci-logo.jpeg";
import { useToast } from "@/hooks/use-toast";

const ExportPDFPage = () => {
  const [selected, setSelected] = useState<string[]>([]);
  const [eligibles, setEligibles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetch = async () => {
      // Get beneficiaires with both payments completed
      const { data: bens } = await supabase.from("beneficiaires").select("*");
      if (!bens) { setLoading(false); return; }

      const { data: paiements } = await supabase.from("paiements").select("beneficiaire_id, type_paiement, status").eq("status", "paye");
      
      const eligibleBens = bens.filter(b => {
        const benPays = paiements?.filter(p => p.beneficiaire_id === b.id) || [];
        return benPays.some(p => p.type_paiement === "paiement_1") && benPays.some(p => p.type_paiement === "paiement_2");
      });

      setEligibles(eligibleBens);
      setLoading(false);
    };
    fetch();
  }, []);

  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const selectAll = () => {
    setSelected(selected.length === eligibles.length ? [] : eligibles.map((b) => b.id));
  };

  const handleExportPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF("p", "mm", "a4");
    const selectedCards = eligibles.filter((b) => selected.includes(b.id));

    if (selectedCards.length === 0) {
      toast({ title: "Aucune carte sélectionnée", variant: "destructive" });
      return;
    }

    const cardW = 85, cardH = 55, marginX = 15, marginY = 15, gapX = 5, gapY = 5;

    selectedCards.forEach((b, i) => {
      if (i > 0 && i % 6 === 0) doc.addPage();
      const pos = i % 6;
      const col = pos % 2, row = Math.floor(pos / 2);
      const x = marginX + col * (cardW + gapX), y = marginY + row * (cardH + gapY);

      doc.setDrawColor(0, 120, 80);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, y, cardW, cardH, 3, 3);
      doc.setFillColor(30, 45, 65);
      doc.roundedRect(x, y, cardW, 10, 3, 3, "F");
      doc.rect(x, y + 7, cardW, 3, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6);
      doc.setFont("helvetica", "bold");
      doc.text("ASSOCIATION DES COMMERCIAUX IVOIRIENS", x + 3, y + 4.5);
      doc.setFontSize(5);
      doc.setFont("helvetica", "normal");
      doc.text("CARTE DE TRAVAIL — RCI", x + 3, y + 8);
      doc.text(b.matricule, x + cardW - 3, y + 6, { align: "right" });

      doc.setTextColor(50, 50, 50);
      const cx = x + 22, cy = y + 15;
      doc.setFillColor(230, 230, 230);
      doc.roundedRect(x + 3, y + 12, 16, 20, 1, 1, "F");
      doc.setFontSize(4);
      doc.setTextColor(150, 150, 150);
      doc.text("PHOTO", x + 7, y + 23);

      doc.setTextColor(50, 50, 50);
      doc.setFontSize(5.5);
      doc.text(`Nom: ${b.nom}`, cx, cy);
      doc.text(`Prénom(s): ${b.prenoms}`, cx, cy + 4);
      doc.text(`Né(e) le: ${b.date_naissance} à ${b.lieu_naissance}`, cx, cy + 8);
      doc.text(`Profession: ${b.profession}`, cx, cy + 12);
      doc.text(`Domicile: ${b.domicile}`, cx, cy + 16);
      doc.text(`Taille: ${b.taille || "-"} m`, cx, cy + 20);
      doc.setFontSize(4);
      doc.setTextColor(130, 130, 130);
      doc.text("ACI — Association des Commerciaux Ivoiriens", x + cardW / 2, y + cardH - 2, { align: "center" });
    });

    doc.save(`ACI_Cartes_${new Date().toISOString().split("T")[0]}.pdf`);
    toast({ title: "PDF généré", description: `${selectedCards.length} carte(s) exportée(s)` });
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Export PDF — Cartes de Travail</h1>
          <p className="text-muted-foreground">Génération des fiches d'impression (6 blocs par page A4)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={selectAll}>
            {selected.length === eligibles.length && eligibles.length > 0 ? "Tout désélectionner" : "Tout sélectionner"}
          </Button>
          <Button className="gradient-primary font-semibold" onClick={handleExportPDF} disabled={selected.length === 0}>
            <Download className="h-4 w-4 mr-2" /> Exporter PDF ({selected.length})
          </Button>
        </div>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground mb-4">
            <FileText className="inline h-4 w-4 mr-1" />
            Seuls les bénéficiaires avec les 2 paiements complets sont éligibles.
            <Badge variant="secondary" className="ml-2 text-xs">{eligibles.length} éligible(s)</Badge>
          </p>

          {eligibles.length === 0 ? (
            <div className="text-center py-12">
              <Printer className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Aucun bénéficiaire éligible à l'impression.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {eligibles.map((b) => (
                <Card
                  key={b.id}
                  className={`cursor-pointer transition-all border-2 ${selected.includes(b.id) ? "border-primary shadow-elevated" : "border-transparent shadow-card hover:shadow-elevated"}`}
                  onClick={() => toggleSelect(b.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox checked={selected.includes(b.id)} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm">{b.nom} {b.prenoms}</p>
                          <span className="text-xs font-mono text-primary">{b.matricule}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{b.profession} — {b.domicile}</p>
                      </div>
                    </div>

                    <div className="mt-3 border border-border rounded-md overflow-hidden">
                      <div className="bg-gradient-to-r from-[hsl(var(--sidebar-background))] to-[hsl(var(--secondary))] px-2 py-1 flex items-center justify-between">
                        <span className="text-[7px] font-bold text-primary-foreground">ACI — CARTE DE TRAVAIL</span>
                        <span className="text-[7px] font-mono text-primary-foreground">{b.matricule}</span>
                      </div>
                      <div className="p-2 flex items-center gap-2">
                        <div className="w-8 h-10 bg-muted rounded flex items-center justify-center">
                          <User className="h-4 w-4 text-muted-foreground/40" />
                        </div>
                        <div className="text-[8px] space-y-0.5">
                          <p className="font-bold">{b.nom} {b.prenoms}</p>
                          <p>{b.profession}</p>
                          <p className="text-muted-foreground">{b.domicile}</p>
                        </div>
                        <div className="ml-auto">
                          <QRCodeSVG value={b.matricule || b.id} size={28} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportPDFPage;
