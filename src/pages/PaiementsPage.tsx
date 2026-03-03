import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, isAdmin } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, CheckCircle, Clock, Plus, Upload, Camera, Loader2 } from "lucide-react";

const PaiementsPage = () => {
  const [paiements, setPaiements] = useState<any[]>([]);
  const [beneficiaires, setBeneficiaires] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const preuveRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    beneficiaire_id: "",
    type_paiement: "paiement_1",
    montant: "1000",
    methode: "especes",
    id_transaction: "",
    preuve_file: null as File | null,
    preuve_preview: null as string | null,
  });

  const fetchData = async () => {
    const [pRes, bRes] = await Promise.all([
      supabase.from("paiements").select("*, beneficiaires(nom, prenoms, matricule)").order("created_at", { ascending: false }),
      supabase.from("beneficiaires").select("id, nom, prenoms, matricule").order("nom"),
    ]);
    setPaiements(pRes.data || []);
    setBeneficiaires(bRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handlePreuveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm(prev => ({ ...prev, preuve_file: file }));
      const reader = new FileReader();
      reader.onloadend = () => setForm(prev => ({ ...prev, preuve_preview: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePayment = async () => {
    if (!form.beneficiaire_id || !form.methode) {
      toast({ title: "Erreur", description: "Sélectionnez un bénéficiaire et un moyen de paiement", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      let preuveUrl: string | null = null;
      
      // Upload proof if provided
      if (form.preuve_file) {
        const ext = form.preuve_file.name.split(".").pop();
        const path = `${user!.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("payment-proofs").upload(path, form.preuve_file);
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from("payment-proofs").getPublicUrl(path);
          preuveUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase.from("paiements").insert({
        beneficiaire_id: form.beneficiaire_id,
        type_paiement: form.type_paiement,
        montant: parseInt(form.montant),
        methode: form.methode,
        status: "paye" as any,
        paid_at: new Date().toISOString(),
        collected_by: user!.id,
        telephone_payeur: "",
        id_transaction: form.id_transaction || null,
        preuve_url: preuveUrl,
      });

      if (error) throw error;

      // Log activity
      await supabase.from("activity_logs").insert({
        user_id: user!.id,
        action: "payment",
        target_type: "paiement",
        target_id: form.beneficiaire_id,
        details: { montant: form.montant, methode: form.methode, type: form.type_paiement },
      });

      toast({ title: "Paiement enregistré" });
      setShowCreate(false);
      setForm({ beneficiaire_id: "", type_paiement: "paiement_1", montant: "1000", methode: "especes", id_transaction: "", preuve_file: null, preuve_preview: null });
      fetchData();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const isMobileMoney = ["wave", "mtn", "orange", "moov"].includes(form.methode);

  const totalPaye = paiements.filter(p => p.status === "paye").reduce((s, p) => s + p.montant, 0);
  const totalAttente = paiements.filter(p => p.status === "en_attente").reduce((s, p) => s + p.montant, 0);
  const totalComplets = paiements.filter(p => p.status === "paye").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Paiements</h1>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gradient-primary font-semibold"><Plus className="h-4 w-4 mr-2" /> Enregistrer un paiement</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Enregistrer un paiement</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Bénéficiaire *</Label>
                <Select value={form.beneficiaire_id} onValueChange={v => setForm(p => ({ ...p, beneficiaire_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {beneficiaires.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.matricule} — {b.nom} {b.prenoms}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Type de paiement</Label>
                  <Select value={form.type_paiement} onValueChange={v => setForm(p => ({ ...p, type_paiement: v, montant: v === "paiement_1" ? "1000" : "3000" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paiement_1">Inscription (1 000 F)</SelectItem>
                      <SelectItem value="paiement_2">Livraison (3 000 F)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Montant (FCFA)</Label>
                  <Input type="number" value={form.montant} onChange={e => setForm(p => ({ ...p, montant: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Moyen de paiement *</Label>
                <Select value={form.methode} onValueChange={v => setForm(p => ({ ...p, methode: v, id_transaction: "", preuve_file: null, preuve_preview: null }))}>
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
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <Label>Preuve de paiement</Label>
                    <div className="flex gap-2">
                      <Button type="button" variant={form.id_transaction ? "default" : "outline"} size="sm" 
                        onClick={() => setForm(p => ({ ...p, preuve_file: null, preuve_preview: null }))}>
                        ID Transaction
                      </Button>
                      <Button type="button" variant={form.preuve_preview ? "default" : "outline"} size="sm"
                        onClick={() => { setForm(p => ({ ...p, id_transaction: "" })); preuveRef.current?.click(); }}>
                        <Camera className="h-3 w-3 mr-1" /> Photo du reçu
                      </Button>
                    </div>
                  </div>

                  {!form.preuve_preview && (
                    <div className="space-y-2">
                      <Label>ID de transaction</Label>
                      <Input placeholder="Ex: TXN-123456789" value={form.id_transaction} onChange={e => setForm(p => ({ ...p, id_transaction: e.target.value }))} />
                    </div>
                  )}

                  {form.preuve_preview && (
                    <div className="space-y-2">
                      <Label>Photo du reçu</Label>
                      <img src={form.preuve_preview} alt="Preuve" className="w-full h-40 object-cover rounded-lg border" />
                    </div>
                  )}

                  <input ref={preuveRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePreuveChange} />
                </div>
              )}

              <Button className="w-full gradient-primary font-semibold" onClick={handleCreatePayment} disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                {creating ? "Enregistrement..." : "Confirmer le paiement"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matricule</TableHead>
                    <TableHead>Bénéficiaire</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Méthode</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paiements.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs font-semibold text-primary">{p.beneficiaires?.matricule}</TableCell>
                      <TableCell className="font-medium text-sm">{p.beneficiaires?.nom} {p.beneficiaires?.prenoms}</TableCell>
                      <TableCell className="text-sm">{p.type_paiement === "paiement_1" ? "Inscription" : "Livraison"}</TableCell>
                      <TableCell className="font-semibold">{p.montant?.toLocaleString("fr-FR")} F</TableCell>
                      <TableCell className="text-sm capitalize">{p.methode || "-"}</TableCell>
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaiementsPage;
