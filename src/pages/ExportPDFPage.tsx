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
    const cardW = 85.6, cardH = 54; // ISO credit card size
    const marginX = 12, marginY = 12, gapX = 6, gapY = 6;

    selectedCards.forEach((b, i) => {
      const pageIdx = Math.floor(i / 4); // 4 cards per page (2 recto + 2 verso)
      const cardIdx = i % 2;

      // --- RECTO PAGE (front of card) ---
      if (cardIdx === 0) {
        if (pageIdx > 0 || i > 0) doc.addPage();
        // Draw 2 recto cards on this page
        for (let c = 0; c < 2 && (i + c) < selectedCards.length; c++) {
          const ben = selectedCards[i + c];
          const x = marginX;
          const y = marginY + c * (cardH + gapY);
          drawCardRecto(doc, ben, x, y, cardW, cardH);
        }

        // --- VERSO PAGE ---
        doc.addPage();
        for (let c = 0; c < 2 && (i + c) < selectedCards.length; c++) {
          const ben = selectedCards[i + c];
          const x = marginX;
          const y = marginY + c * (cardH + gapY);
          drawCardVerso(doc, ben, x, y, cardW, cardH);
        }
      }
    });

    // Simpler approach: one recto + one verso per pair of pages
    // Reset and redo with simpler layout: 6 rectos then 6 versos
    const doc2 = new jsPDF("p", "mm", "a4");
    const cols = 2, rows = 3;

    // Generate recto pages
    for (let page = 0; page < Math.ceil(selectedCards.length / 6); page++) {
      if (page > 0) doc2.addPage();
      for (let slot = 0; slot < 6; slot++) {
        const idx = page * 6 + slot;
        if (idx >= selectedCards.length) break;
        const col = slot % cols, row = Math.floor(slot / cols);
        const x = marginX + col * (cardW + gapX);
        const y = marginY + row * (cardH + gapY);
        drawCardRecto(doc2, selectedCards[idx], x, y, cardW, cardH);
      }
      // Verso page
      doc2.addPage();
      for (let slot = 0; slot < 6; slot++) {
        const idx = page * 6 + slot;
        if (idx >= selectedCards.length) break;
        const col = slot % cols, row = Math.floor(slot / cols);
        const x = marginX + col * (cardW + gapX);
        const y = marginY + row * (cardH + gapY);
        drawCardVerso(doc2, selectedCards[idx], x, y, cardW, cardH);
      }
    }

    doc2.save(`ACI_Cartes_${new Date().toISOString().split("T")[0]}.pdf`);
    toast({ title: "PDF généré", description: `${selectedCards.length} carte(s) recto-verso exportée(s)` });
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Export PDF — Cartes de Travail</h1>
          <p className="text-muted-foreground">Génération recto-verso (6 blocs par page A4)</p>
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

                    {/* Mini card preview */}
                    <div className="mt-3 border border-border rounded-md overflow-hidden">
                      <div className="bg-gradient-to-r from-[hsl(var(--sidebar-background))] to-[hsl(var(--secondary))] px-2 py-1 flex items-center justify-between">
                        <span className="text-[7px] font-bold text-primary-foreground">CARTE DE TRAVAIL — RCI</span>
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

// ============ PDF DRAWING FUNCTIONS ============

function drawCardRecto(doc: any, b: any, x: number, y: number, w: number, h: number) {
  // Card border
  doc.setDrawColor(0, 100, 60);
  doc.setLineWidth(0.4);
  doc.roundedRect(x, y, w, h, 2, 2);

  // Top band - dark blue header
  doc.setFillColor(20, 40, 70);
  doc.roundedRect(x, y, w, 9, 2, 2, "F");
  doc.rect(x, y + 7, w, 2, "F");

  // "REPUBLIQUE DE CÔTE D'IVOIRE" small text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(4);
  doc.setFont("helvetica", "normal");
  doc.text("RÉPUBLIQUE DE CÔTE D'IVOIRE", x + 3, y + 3.5);

  // "CARTE DE TRAVAIL" title
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("CARTE DE TRAVAIL", x + w / 2, y + 7.5, { align: "center" });

  // Flag stripes (orange, white, green) on right
  const flagX = x + w - 12;
  doc.setFillColor(255, 153, 0); // orange
  doc.rect(flagX, y + 1, 3, 7, "F");
  doc.setFillColor(255, 255, 255); // white
  doc.rect(flagX + 3, y + 1, 3, 7, "F");
  doc.setFillColor(0, 158, 73); // green
  doc.rect(flagX + 6, y + 1, 3, 7, "F");

  // RCCM
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(4.5);
  doc.setFont("helvetica", "bold");
  doc.text(`RCCM: ${b.rccm || "N/A"}`, x + w / 2, y + 12, { align: "center" });

  // Photo placeholder
  doc.setFillColor(230, 230, 230);
  doc.roundedRect(x + 3, y + 14, 16, 20, 1, 1, "F");
  doc.setTextColor(170, 170, 170);
  doc.setFontSize(4);
  doc.text("PHOTO", x + 7.5, y + 25);

  // Fields
  const fx = x + 22, fy = y + 15;
  const fields = [
    ["Nom", b.nom],
    ["Prénoms", b.prenoms],
    ["Date de naiss", b.date_naissance],
    ["Lieu de naiss", b.lieu_naissance],
    ["Sexe", b.sexe === "M" ? "M" : "F"],
    ["Taille", b.taille ? `${b.taille} m` : "-"],
    ["Nationalité", b.nationalite],
    ["Profession", b.profession],
    ["Domicile", b.domicile],
    ["Matricule", b.matricule],
    ["Numéro", b.telephone],
  ];

  doc.setFontSize(4);
  fields.forEach(([label, value], i) => {
    const ly = fy + i * 3.2;
    doc.setTextColor(80, 80, 80);
    doc.setFont("helvetica", "bold");
    doc.text(`${label}`, fx, ly);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    doc.text(`: ${value || "-"}`, fx + 18, ly);
  });

  // "SECURISE" watermark
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(5);
  doc.setFont("helvetica", "bold");
  doc.text("SECURISE", x + w - 5, y + 18, { align: "right" });

  // Bottom date line
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(3.5);
  doc.setFont("helvetica", "normal");
  const now = new Date();
  const expiry = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate());
  doc.text(
    `Etablie le ${now.toLocaleDateString("fr-FR")} jusqu'au ${expiry.toLocaleDateString("fr-FR")}`,
    x + w / 2, y + h - 2, { align: "center" }
  );
}

function drawCardVerso(doc: any, b: any, x: number, y: number, w: number, h: number) {
  // Card border
  doc.setDrawColor(0, 100, 60);
  doc.setLineWidth(0.4);
  doc.roundedRect(x, y, w, h, 2, 2);

  // Header text
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.text("AGREBOOK CI", x + 5, y + 6);

  doc.setFontSize(4.5);
  doc.text(`AGBCI-${b.matricule}`, x + 5, y + 10);

  // "SECURISE" labels
  doc.setTextColor(180, 180, 180);
  doc.setFontSize(4);
  doc.text("SECURISE", x + w - 5, y + 6, { align: "right" });
  doc.text("SECURISE", x + 5, y + 18);
  doc.text("SECURISE", x + w - 5, y + 18, { align: "right" });

  // Diagonal flag stripes (simplified as colored lines)
  doc.setDrawColor(255, 153, 0);
  doc.setLineWidth(1.5);
  doc.line(x + 25, y + 3, x + w - 5, y + h - 5);
  doc.setDrawColor(255, 255, 255);
  doc.line(x + 27, y + 3, x + w - 3, y + h - 5);
  doc.setDrawColor(0, 158, 73);
  doc.line(x + 29, y + 3, x + w - 1, y + h - 5);

  // Center coat of arms placeholder
  doc.setFillColor(245, 245, 245);
  doc.circle(x + w / 2, y + h / 2, 10, "F");
  doc.setTextColor(180, 180, 180);
  doc.setFontSize(4);
  doc.setFont("helvetica", "bold");
  doc.text("RÉPUBLIQUE", x + w / 2, y + h / 2 - 2, { align: "center" });
  doc.text("DE CÔTE", x + w / 2, y + h / 2 + 1, { align: "center" });
  doc.text("D'IVOIRE", x + w / 2, y + h / 2 + 4, { align: "center" });

  // Bottom text
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(3.5);
  doc.setFont("helvetica", "normal");
  doc.text("de cette carte", x + w / 2, y + h - 10, { align: "center" });
  doc.text("Cette carte est strictement personnelle", x + w / 2, y + h - 7, { align: "center" });
  doc.text("en cas de perte veuillez contacter les numéros au recto", x + w / 2, y + h - 4, { align: "center" });
}

export default ExportPDFPage;
