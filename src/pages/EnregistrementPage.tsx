import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Camera, Save, Smartphone } from "lucide-react";
import { mockMetiers } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useOfflineSync } from "@/hooks/useOfflineSync";

const EnregistrementPage = () => {
  const [categorie, setCategorie] = useState("");
  const [metier, setMetier] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({
    sexe: "M", nationalite: "Ivoirienne",
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const { isOnline, addToQueue } = useOfflineSync();

  const metiersList = categorie ? mockMetiers[categorie as keyof typeof mockMetiers] || [] : [];

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const beneficiaireData = {
      nom: form.nom?.toUpperCase(),
      prenoms: form.prenoms,
      date_naissance: form.date_naissance,
      lieu_naissance: form.lieu_naissance,
      sexe: form.sexe,
      nationalite: form.nationalite,
      taille: form.taille ? parseFloat(form.taille) : null,
      profession: metier === "autre" ? form.metier_autre : metier,
      categorie_metier: categorie,
      domicile: form.domicile,
      telephone: form.telephone,
      numero_mobile_money: form.mobile_money,
      operateur_mobile_money: form.operateur,
      rccm: form.rccm || null,
      commercial_id: user?.id,
    };

    try {
      if (isOnline) {
        // Generate matricule
        const { data: matricule } = await supabase.rpc("generate_matricule");
        
        const { error } = await supabase.from("beneficiaires").insert({
          ...beneficiaireData,
          matricule: matricule || `ACI-${Date.now()}`,
        });

        if (error) throw error;
        toast({ title: "Enregistrement réussi", description: `Bénéficiaire enregistré: ${matricule}` });
      } else {
        addToQueue("insert", "beneficiaires", {
          ...beneficiaireData,
          matricule: `ACI-LOCAL-${Date.now()}`,
          local_id: `local-${Date.now()}`,
        });
        toast({ title: "Sauvegardé hors ligne", description: "L'enregistrement sera synchronisé automatiquement." });
      }

      // Reset form
      setForm({ sexe: "M", nationalite: "Ivoirienne" });
      setCategorie("");
      setMetier("");
      setPhotoPreview(null);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Enregistrer un bénéficiaire</h1>
        <p className="text-muted-foreground">Formulaire d'enregistrement terrain — Carte de Travail ACI</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">1</span>
              Identité du bénéficiaire
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 flex justify-center">
                <label className="cursor-pointer group">
                  <div className="w-32 h-40 rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center overflow-hidden bg-muted">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Photo" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="text-xs text-muted-foreground mt-2">Photo ID</span>
                      </>
                    )}
                  </div>
                  <input type="file" accept="image/*" capture="user" className="hidden" onChange={handlePhotoChange} />
                </label>
              </div>
              <div className="space-y-2"><Label>Nom *</Label><Input placeholder="KONAN" required className="h-10 uppercase" value={form.nom || ""} onChange={e => update("nom", e.target.value)} /></div>
              <div className="space-y-2"><Label>Prénom(s) *</Label><Input placeholder="Yao Jean" required className="h-10" value={form.prenoms || ""} onChange={e => update("prenoms", e.target.value)} /></div>
              <div className="space-y-2"><Label>Date de naissance *</Label><Input type="date" required className="h-10" value={form.date_naissance || ""} onChange={e => update("date_naissance", e.target.value)} /></div>
              <div className="space-y-2"><Label>Lieu de naissance *</Label><Input placeholder="Bouaké, Côte d'Ivoire" required className="h-10" value={form.lieu_naissance || ""} onChange={e => update("lieu_naissance", e.target.value)} /></div>
              <div className="space-y-2">
                <Label>Sexe *</Label>
                <RadioGroup value={form.sexe} onValueChange={v => update("sexe", v)} className="flex gap-6 mt-2">
                  <div className="flex items-center space-x-2"><RadioGroupItem value="M" id="m" /><Label htmlFor="m" className="font-normal">Masculin</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="F" id="f" /><Label htmlFor="f" className="font-normal">Féminin</Label></div>
                </RadioGroup>
              </div>
              <div className="space-y-2"><Label>Taille (m)</Label><Input type="number" step="0.01" placeholder="1.70" className="h-10" value={form.taille || ""} onChange={e => update("taille", e.target.value)} /></div>
              <div className="space-y-2">
                <Label>Nationalité *</Label>
                <Select value={form.nationalite} onValueChange={v => update("nationalite", v)}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ivoirienne">Ivoirienne</SelectItem>
                    <SelectItem value="Burkinabè">Burkinabè</SelectItem>
                    <SelectItem value="Malienne">Malienne</SelectItem>
                    <SelectItem value="Guinéenne">Guinéenne</SelectItem>
                    <SelectItem value="Sénégalaise">Sénégalaise</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">2</span>
              Métier & Localisation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Catégorie de métier *</Label>
                <Select onValueChange={(v) => { setCategorie(v); setMetier(""); }}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>{Object.keys(mockMetiers).map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Profession / Métier *</Label>
                <Select value={metier} onValueChange={setMetier} disabled={!categorie}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {metiersList.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
                    <SelectItem value="autre">Autre (précisez)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {metier === "autre" && (
                <div className="md:col-span-2 space-y-2 animate-fade-in">
                  <Label>Précisez le métier *</Label>
                  <Input placeholder="Saisissez le métier" required className="h-10" value={form.metier_autre || ""} onChange={e => update("metier_autre", e.target.value)} />
                </div>
              )}
              <div className="md:col-span-2 space-y-2">
                <Label>Domicile / Adresse *</Label>
                <Textarea placeholder="Quartier, commune, ville..." required className="min-h-[80px]" value={form.domicile || ""} onChange={e => update("domicile", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>N° RCCM (si applicable)</Label>
                <Input placeholder="CI-ABJ-03-B13-XXXXX" className="h-10" value={form.rccm || ""} onChange={e => update("rccm", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">3</span>
              Contact & Paiement
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Numéro d'urgence *</Label><Input type="tel" placeholder="07 XX XX XX XX" required className="h-10" value={form.telephone || ""} onChange={e => update("telephone", e.target.value)} /></div>
              <div className="space-y-2"><Label>Numéro Mobile Money *</Label><Input type="tel" placeholder="07 XX XX XX XX" required className="h-10" value={form.mobile_money || ""} onChange={e => update("mobile_money", e.target.value)} /></div>
              <div className="space-y-2">
                <Label>Opérateur *</Label>
                <Select onValueChange={v => update("operateur", v)}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="orange">Orange Money</SelectItem>
                    <SelectItem value="mtn">MTN MoMo</SelectItem>
                    <SelectItem value="wave">Wave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline">Annuler</Button>
          <Button type="submit" className="gradient-primary font-semibold px-8" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Enregistrement..." : "Enregistrer le bénéficiaire"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EnregistrementPage;
