import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Printer, CreditCard, User, PenTool, CheckCircle, Camera, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import aciLogo from "@/assets/aci-logo.jpeg";
import SignaturePad from "@/components/SignaturePad";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const statusColors: Record<string, string> = {
  enregistre: "bg-info text-info-foreground",
  en_production: "bg-warning text-warning-foreground",
  livre: "bg-success text-success-foreground",
};
const statusLabels: Record<string, string> = {
  enregistre: "Enregistré", en_production: "En production", livre: "Livré",
};

const BeneficiaireDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [b, setB] = useState<any>(null);
  const [paiements, setPaiements] = useState<any[]>([]);
  const [carte, setCarte] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSignatures, setShowSignatures] = useState(false);
  const [sigCommercial, setSigCommercial] = useState<string | null>(null);
  const [sigBeneficiaire, setSigBeneficiaire] = useState<string | null>(null);
  const [validatingDelivery, setValidatingDelivery] = useState(false);

  // Offline payment form
  const [showPayment, setShowPayment] = useState(false);
  const [payForm, setPayForm] = useState({ type_paiement: "paiement_1", montant: "1000", methode: "especes", id_transaction: "", preuve_file: null as File | null, preuve_preview: null as string | null });
  const [paying, setPaying] = useState(false);
  const preuveRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    const { data: ben } = await supabase.from("beneficiaires").select("*").eq("id", id).single();
    setB(ben);
    if (ben) {
      const [pRes, cRes] = await Promise.all([
        supabase.from("paiements").select("*").eq("beneficiaire_id", ben.id),
        supabase.from("cartes").select("*").eq("beneficiaire_id", ben.id).maybeSingle(),
      ]);
      setPaiements(pRes.data || []);
      setCarte(cRes.data);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  const handlePayment = async () => {
    if (!b) return;
    setPaying(true);
    try {
      let preuveUrl: string | null = null;
      if (payForm.preuve_file) {
        const ext = payForm.preuve_file.name.split(".").pop();
        const path = `${user!.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("payment-proofs").upload(path, payForm.preuve_file);
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from("payment-proofs").getPublicUrl(path);
          preuveUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase.from("paiements").insert({
        beneficiaire_id: b.id,
        type_paiement: payForm.type_paiement,
        montant: parseInt(payForm.montant),
        methode: payForm.methode,
        status: "paye" as any,
        paid_at: new Date().toISOString(),
        collected_by: user!.id,
        id_transaction: payForm.id_transaction || null,
        preuve_url: preuveUrl,
      });
      if (error) throw error;

      await supabase.from("activity_logs").insert({
        user_id: user!.id, action: "payment", target_type: "paiement", target_id: b.id,
        details: { montant: payForm.montant, methode: payForm.methode, type: payForm.type_paiement },
      });

      toast({ title: "Paiement enregistré", description: `${parseInt(payForm.montant).toLocaleString("fr-FR")} FCFA confirmé` });
      setShowPayment(false);
      setPayForm({ type_paiement: "paiement_1", montant: "1000", methode: "especes", id_transaction: "", preuve_file: null, preuve_preview: null });
      await fetchData();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setPaying(false);
    }
  };

  const handlePreuveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPayForm(prev => ({ ...prev, preuve_file: file }));
      const reader = new FileReader();
      reader.onloadend = () => setPayForm(prev => ({ ...prev, preuve_preview: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleValidateDelivery = async () => {
    if (!sigCommercial || !sigBeneficiaire) {
      toast({ title: "Signatures requises", description: "Les deux signatures sont obligatoires", variant: "destructive" });
      return;
    }
    setValidatingDelivery(true);
    try {
      if (carte) {
        await supabase.from("cartes").update({
          status: "confirme" as any, date_livraison: new Date().toISOString(), date_confirmation: new Date().toISOString(),
          livre_par: user?.id, confirme_par: user?.id, signature_commercial: sigCommercial, signature_beneficiaire: sigBeneficiaire,
        }).eq("id", carte.id);
      } else {
        await supabase.from("cartes").insert({
          beneficiaire_id: b.id, status: "confirme" as any, date_livraison: new Date().toISOString(), date_confirmation: new Date().toISOString(),
          livre_par: user?.id, confirme_par: user?.id, signature_commercial: sigCommercial, signature_beneficiaire: sigBeneficiaire,
        });
      }
      await supabase.from("beneficiaires").update({ status: "livre" as any }).eq("id", b.id);
      await supabase.from("activity_logs").insert({
        user_id: user!.id, action: "delivery", target_type: "beneficiaire", target_id: b.id,
        details: { matricule: b.matricule, action: "livraison_confirmee" },
      });
      toast({ title: "Livraison confirmée", description: "Carte livrée avec les deux signatures" });
      setShowSignatures(false);
      await fetchData();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setValidatingDelivery(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!b) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <p className="text-xl font-bold text-foreground">Bénéficiaire introuvable</p>
        <Button variant="link" onClick={() => navigate("/dashboard/beneficiaires")}>Retour à la liste</Button>
      </div>
    </div>
  );

  const hasPaiement1 = paiements.some(p => p.type_paiement === "paiement_1" && p.status === "paye");
  const hasPaiement2 = paiements.some(p => p.type_paiement === "paiement_2" && p.status === "paye");
  const isDelivered = b.status === "livre" || carte?.status === "confirme";
  const canDeliver = hasPaiement2 && !isDelivered;
  const qrData = JSON.stringify({ id: b.matricule, nom: b.nom, prenoms: b.prenoms, profession: b.profession });
  const isMobileMoney = ["wave", "mtn", "orange", "moov"].includes(payForm.methode);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/beneficiaires")}><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{b.nom} {b.prenoms}</h1>
          <p className="text-muted-foreground">{b.matricule} — {b.profession}</p>
        </div>
        <Badge className={`ml-auto ${statusColors[b.status] || ""} border-0`}>{statusLabels[b.status] || b.status}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2"><User className="h-4 w-4" /> Informations personnelles</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Nom :</span><p className="font-medium">{b.nom}</p></div>
              <div><span className="text-muted-foreground">Prénom(s) :</span><p className="font-medium">{b.prenoms}</p></div>
              <div><span className="text-muted-foreground">Date naissance :</span><p className="font-medium">{b.date_naissance}</p></div>
              <div><span className="text-muted-foreground">Lieu naissance :</span><p className="font-medium">{b.lieu_naissance}</p></div>
              <div><span className="text-muted-foreground">Sexe :</span><p className="font-medium">{b.sexe === "M" ? "Masculin" : "Féminin"}</p></div>
              <div><span className="text-muted-foreground">Nationalité :</span><p className="font-medium">{b.nationalite}</p></div>
              <div><span className="text-muted-foreground">Taille :</span><p className="font-medium">{b.taille} m</p></div>
              <div><span className="text-muted-foreground">Profession :</span><p className="font-medium">{b.profession}</p></div>
              <div className="col-span-2"><span className="text-muted-foreground">Domicile :</span><p className="font-medium">{b.domicile}</p></div>
              <div><span className="text-muted-foreground">Contact :</span><p className="font-medium">{b.telephone}</p></div>
            </div>

            {/* Payments */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-foreground flex items-center gap-2"><CreditCard className="h-4 w-4" /> Paiements</h4>
                {(!hasPaiement1 || !hasPaiement2) && (
                  <Button size="sm" variant="outline" onClick={() => {
                    setPayForm(p => ({ ...p, type_paiement: hasPaiement1 ? "paiement_2" : "paiement_1", montant: hasPaiement1 ? "3000" : "1000" }));
                    setShowPayment(true);
                  }}>Enregistrer un paiement</Button>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${hasPaiement1 ? "bg-success" : "bg-muted"}`} />
                  <span className="text-sm">Inscription (1 000 F) : {hasPaiement1 ? "Payé ✓" : "En attente"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${hasPaiement2 ? "bg-success" : "bg-muted"}`} />
                  <span className="text-sm">Livraison (3 000 F) : {hasPaiement2 ? "Payé ✓" : "En attente"}</span>
                </div>
              </div>
            </div>

            {/* Delivery */}
            <div className="pt-4 border-t border-border">
              <h4 className="font-semibold text-foreground flex items-center gap-2 mb-3"><PenTool className="h-4 w-4" /> Livraison</h4>
              {isDelivered ? (
                <div className="flex items-center gap-2 text-success"><CheckCircle className="h-5 w-5" /><span className="font-medium">Carte livrée et confirmée</span></div>
              ) : canDeliver ? (
                <Button className="gradient-primary font-semibold w-full" onClick={() => setShowSignatures(true)}>
                  <PenTool className="h-4 w-4 mr-2" /> Valider la livraison (avec signatures)
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">{!hasPaiement2 ? "Le paiement livraison (3 000 F) est requis." : ""}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Aperçu Carte de Travail</h3>
            <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" /> Imprimer</Button>
          </div>
          <Card className="shadow-elevated border-2 border-primary/20 overflow-hidden">
            <div className="bg-gradient-to-r from-[hsl(var(--sidebar-background))] to-[hsl(var(--secondary))] p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={aciLogo} alt="ACI" className="w-8 h-8 rounded object-contain bg-white p-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-primary-foreground">ASSOCIATION DES COMMERCIAUX IVOIRIENS</p>
                  <p className="text-[8px] text-primary-foreground/70">CARTE DE TRAVAIL — RÉPUBLIQUE DE CÔTE D'IVOIRE</p>
                </div>
              </div>
              <p className="text-[9px] font-mono font-bold text-primary-foreground bg-primary/30 px-2 py-0.5 rounded">{b.matricule}</p>
            </div>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="w-24 h-30 bg-muted rounded-lg border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {b.photo_url ? <img src={b.photo_url} alt="" className="w-full h-full object-cover" /> : <User className="h-10 w-10 text-muted-foreground/40" />}
                </div>
                <div className="flex-1 text-xs space-y-1">
                  <p><span className="text-muted-foreground">Nom :</span> <span className="font-bold">{b.nom}</span></p>
                  <p><span className="text-muted-foreground">Prénom(s) :</span> <span className="font-bold">{b.prenoms}</span></p>
                  <p><span className="text-muted-foreground">Né(e) le :</span> <span className="font-semibold">{b.date_naissance}</span> à <span className="font-semibold">{b.lieu_naissance}</span></p>
                  <p><span className="text-muted-foreground">Profession :</span> <span className="font-semibold">{b.profession}</span></p>
                  <p><span className="text-muted-foreground">Domicile :</span> <span className="font-semibold">{b.domicile}</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-elevated border-2 border-primary/20 overflow-hidden">
            <div className="bg-gradient-to-r from-[hsl(var(--sidebar-background))] to-[hsl(var(--secondary))] p-2 text-center">
              <p className="text-[10px] font-bold text-primary-foreground">VERSO</p>
            </div>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 text-xs space-y-1.5">
                  <p><span className="text-muted-foreground">Nationalité :</span> <span className="font-semibold">{b.nationalite}</span></p>
                  <p><span className="text-muted-foreground">Sexe :</span> <span className="font-semibold">{b.sexe === "M" ? "Masculin" : "Féminin"}</span></p>
                  <p><span className="text-muted-foreground">Téléphone :</span> <span className="font-semibold">{b.telephone}</span></p>
                  <p><span className="text-muted-foreground">Enregistré le :</span> <span className="font-semibold">{new Date(b.created_at).toLocaleDateString("fr-FR")}</span></p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <QRCodeSVG value={qrData} size={80} level="M" />
                  <p className="text-[8px] text-muted-foreground">Scanner pour vérifier</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Enregistrer un paiement</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={payForm.type_paiement} onValueChange={v => setPayForm(p => ({ ...p, type_paiement: v, montant: v === "paiement_1" ? "1000" : "3000" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {!hasPaiement1 && <SelectItem value="paiement_1">Inscription</SelectItem>}
                    {!hasPaiement2 && <SelectItem value="paiement_2">Livraison</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Montant</Label>
                <Input type="number" value={payForm.montant} onChange={e => setPayForm(p => ({ ...p, montant: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Moyen de paiement *</Label>
              <Select value={payForm.methode} onValueChange={v => setPayForm(p => ({ ...p, methode: v, id_transaction: "", preuve_file: null, preuve_preview: null }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="especes">Espèces</SelectItem>
                  <SelectItem value="wave">Wave</SelectItem>
                  <SelectItem value="mtn">MTN Mobile Money</SelectItem>
                  <SelectItem value="orange">Orange Money</SelectItem>
                  <SelectItem value="moov">Moov Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isMobileMoney && (
              <div className="space-y-3 animate-fade-in">
                {!payForm.preuve_preview && (
                  <div className="space-y-2">
                    <Label>ID de transaction</Label>
                    <Input placeholder="TXN-123456789" value={payForm.id_transaction} onChange={e => setPayForm(p => ({ ...p, id_transaction: e.target.value }))} />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Ou photo du reçu</Label>
                  <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => preuveRef.current?.click()}>
                    <Camera className="h-4 w-4 mr-2" /> {payForm.preuve_preview ? "Changer la photo" : "Prendre une photo"}
                  </Button>
                  {payForm.preuve_preview && <img src={payForm.preuve_preview} alt="Reçu" className="w-full h-32 object-cover rounded border" />}
                </div>
                <input ref={preuveRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePreuveChange} />
              </div>
            )}
            <Button className="w-full gradient-primary" onClick={handlePayment} disabled={paying}>
              {paying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              {paying ? "En cours..." : "Confirmer le paiement"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Signature Dialog */}
      <Dialog open={showSignatures} onOpenChange={setShowSignatures}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><PenTool className="h-5 w-5" /> Validation de la livraison</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            Les deux signatures sont obligatoires pour confirmer la livraison à {b.nom} {b.prenoms} ({b.matricule}).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SignaturePad label="Signature du commercial" onSignatureChange={setSigCommercial} />
            <SignaturePad label="Signature du bénéficiaire" onSignatureChange={setSigBeneficiaire} />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowSignatures(false)}>Annuler</Button>
            <Button className="gradient-primary font-semibold" onClick={handleValidateDelivery} disabled={!sigCommercial || !sigBeneficiaire || validatingDelivery}>
              {validatingDelivery ? "Validation..." : "Confirmer la livraison"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BeneficiaireDetailPage;
