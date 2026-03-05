import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download, Printer, User } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "@/hooks/use-toast";

const ExportPDFPage = () => {
  const [selected, setSelected] = useState<string[]>([]);
  const [eligibles, setEligibles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
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
    fetchData();
  }, []);

  const toggleSelect = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  const selectAll = () => setSelected(selected.length === eligibles.length ? [] : eligibles.map(b => b.id));

  const handleExportPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const selectedCards = eligibles.filter(b => selected.includes(b.id));
    if (selectedCards.length === 0) {
      toast({ title: "Aucune carte sélectionnée", variant: "destructive" });
      return;
    }

    const doc = new jsPDF("p", "mm", "a4");
    const cardW = 85.6, cardH = 54;
    const cols = 2, rows = 4;
    const totalW = cols * cardW + (cols - 1) * 6;
    const totalH = rows * cardH + (rows - 1) * 4;
    const marginX = (210 - totalW) / 2;
    const marginY = (297 - totalH) / 2;
    const gapX = 6, gapY = 4;
    const cardsPerPage = cols * rows;

    for (let page = 0; page < Math.ceil(selectedCards.length / cardsPerPage); page++) {
      if (page > 0) doc.addPage();
      for (let slot = 0; slot < cardsPerPage; slot++) {
        const idx = page * cardsPerPage + slot;
        if (idx >= selectedCards.length) break;
        const col = slot % cols, row = Math.floor(slot / cols);
        const x = marginX + col * (cardW + gapX);
        const y = marginY + row * (cardH + gapY);
        drawCardRecto(doc, selectedCards[idx], x, y, cardW, cardH);
      }
    }

    doc.save(`ACI_Cartes_${new Date().toISOString().split("T")[0]}.pdf`);
    toast({ title: "PDF généré", description: `${selectedCards.length} carte(s) exportée(s)` });
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Export PDF — Cartes de Travail</h1>
          <p className="text-muted-foreground">Recto — 8 cartes par page A4</p>
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
              <p className="text-muted-foreground">Aucun bénéficiaire éligible.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {eligibles.map((b) => (
                <Card key={b.id} className={`cursor-pointer transition-all border-2 ${selected.includes(b.id) ? "border-primary shadow-elevated" : "border-transparent shadow-card"}`}
                  onClick={() => toggleSelect(b.id)}>
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

function drawCardRecto(doc: any, b: any, x: number, y: number, w: number, h: number) {
  doc.setDrawColor(0, 100, 60);
  doc.setLineWidth(0.4);
  doc.roundedRect(x, y, w, h, 2, 2);

  // Top band
  doc.setFillColor(20, 40, 70);
  doc.roundedRect(x, y, w, 11, 2, 2, "F");
  doc.rect(x, y + 9, w, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("RÉPUBLIQUE DE CÔTE D'IVOIRE", x + 3, y + 4.5);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("CARTE DE TRAVAIL", x + w / 2, y + 9.5, { align: "center" });

  // Flag
  const flagX = x + w - 12;
  doc.setFillColor(255, 153, 0);
  doc.rect(flagX, y + 1.5, 3, 8, "F");
  doc.setFillColor(255, 255, 255);
  doc.rect(flagX + 3, y + 1.5, 3, 8, "F");
  doc.setFillColor(0, 158, 73);
  doc.rect(flagX + 6, y + 1.5, 3, 8, "F");

  // RCCM
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.text(`RCCM: ${b.rccm || "N/A"}`, x + w / 2, y + 14.5, { align: "center" });

  // Photo placeholder
  doc.setFillColor(230, 230, 230);
  doc.roundedRect(x + 3, y + 16, 18, 22, 1, 1, "F");
  doc.setTextColor(170, 170, 170);
  doc.setFontSize(5);
  doc.text("PHOTO", x + 7, y + 28);

  // Fields - LARGER FONT for readability
  const fx = x + 24, fy = y + 17.5;
  const fields = [
    ["Nom", b.nom],
    ["Prénoms", b.prenoms],
    ["Né(e) le", b.date_naissance],
    ["Lieu", b.lieu_naissance],
    ["Sexe", b.sexe === "M" ? "M" : "F"],
    ["Taille", b.taille ? `${b.taille} m` : "-"],
    ["Nationalité", b.nationalite],
    ["Profession", b.profession],
    ["Domicile", b.domicile],
    ["Matricule", b.matricule],
    ["Tél", b.telephone],
  ];

  doc.setFontSize(6);
  fields.forEach(([label, value], i) => {
    const ly = fy + i * 3.2;
    doc.setTextColor(80, 80, 80);
    doc.setFont("helvetica", "bold");
    doc.text(`${label}`, fx, ly);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    const val = String(value || "-").substring(0, 26);
    doc.text(`: ${val}`, fx + 18, ly);
  });

  // Bottom
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(5);
  doc.setFont("helvetica", "normal");
  const now = new Date();
  const expiry = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate());
  doc.text(
    `Etablie le ${now.toLocaleDateString("fr-FR")} — Expire le ${expiry.toLocaleDateString("fr-FR")}`,
    x + w / 2, y + h - 2, { align: "center" }
  );
}

export default ExportPDFPage;
