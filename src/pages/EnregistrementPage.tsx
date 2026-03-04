import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Camera, Save, Loader2 } from "lucide-react";
import { mockMetiers } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useNavigate } from "react-router-dom";

const EnregistrementPage = () => {
  const [categorie, setCategorie] = useState("");
  const [metier, setMetier] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({ sexe: "M", nationalite: "Ivoirienne" });
  const { toast } = useToast();
  const { user } = useAuth();
  const { isOnline } = useOfflineSync();
  const navigate = useNavigate();

  // Load geography
  const [districts, setDistricts] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [departements, setDepartements] = useState<any[]>([]);
  const [sousPrefectures, setSousPrefectures] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("districts").select("id, nom").eq("actif", true).order("nom"),
      supabase.from("regions").select("id, nom, district_id").eq("actif", true).order("nom"),
      supabase.from("departements").select("id, nom, region_id").eq("actif", true).order("nom"),
      supabase.from("sous_prefectures").select("id, nom, departement_id").eq("actif", true).order("nom"),
      supabase.from("villages").select("id, nom, sous_prefecture_id, type").eq("actif", true).order("nom"),
    ]).then(([d, r, dep, sp, v]) => {
      setDistricts(d.data || []);
      setRegions(r.data || []);
      setDepartements(dep.data || []);
      setSousPrefectures(sp.data || []);
      setVillages(v.data || []);
    });
  }, []);

  const filteredRegions = form.district_id ? regions.filter(r => r.district_id === form.district_id) : [];
  const filteredDeps = form.region_id ? departements.filter(d => d.region_id === form.region_id) : [];
  const filteredSP = form.departement_id ? sousPrefectures.filter(sp => sp.departement_id === form.departement_id) : [];
  const filteredVillages = form.sous_prefecture_id ? villages.filter(v => v.sous_prefecture_id === form.sous_prefecture_id) : [];

  const metiersList = categorie ? mockMetiers[categorie as keyof typeof mockMetiers] || [] : [];

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (beneficiaireId: string): Promise<string | null> => {
    if (!photoFile) return null;
    const ext = photoFile.name.split(".").pop();
    const path = `${beneficiaireId}.${ext}`;
    const { error } = await supabase.storage.from("beneficiaire-photos").upload(path, photoFile, { upsert: true });
    if (error) { console.error("Photo upload error:", error); return null; }
    const { data } = supabase.storage.from("beneficiaire-photos").getPublicUrl(path);
    return data.publicUrl;
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
      contact_secondaire: form.contact_secondaire || null,
      numero_mobile_money: form.mobile_money,
      operateur_mobile_money: form.operateur,
      rccm: form.rccm || null,
      commercial_id: user?.id,
      district_id: form.district_id || null,
      region_id: form.region_id || null,
      departement_id: form.departement_id || null,
      sous_prefecture_id: form.sous_prefecture_id || null,
      village_id: form.village_id || null,
    };

    try {
      if (isOnline) {
        const { data: matricule } = await supabase.rpc("generate_matricule");
        const { data: inserted, error } = await supabase.from("beneficiaires").insert({
          ...beneficiaireData,
          matricule: matricule || `ACI-${Date.now()}`,
        }).select("id").single();

        if (error) throw error;

        if (inserted && photoFile) {
          const photoUrl = await uploadPhoto(inserted.id);
          if (photoUrl) {
            await supabase.from("beneficiaires").update({ photo_url: photoUrl }).eq("id", inserted.id);
          }
        }

        if (inserted) {
          await supabase.from("activity_logs").insert({
            user_id: user!.id, action: "create", target_type: "beneficiaire", target_id: inserted.id,
            details: { matricule, nom: form.nom },
          });
        }

        toast({ title: "Enrôlement réussi", description: `Bénéficiaire enregistré: ${matricule}` });
        if (inserted) { navigate(`/dashboard/beneficiaires/${inserted.id}`); return; }
      } else {
        const localId = `local-${Date.now()}`;
        const { addPendingAction } = await import("@/lib/offlineDB");
        await addPendingAction("beneficiaires", "insert", { ...beneficiaireData, matricule: `ACI-LOCAL-${Date.now()}`, local_id: localId });
        toast({ title: "Sauvegardé hors ligne", description: "L'enregistrement sera synchronisé automatiquement." });
      }

      setForm({ sexe: "M", nationalite: "Ivoirienne" });
      setCategorie(""); setMetier("");
      setPhotoPreview(null); setPhotoFile(null);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Enrôlement d'un bénéficiaire</h1>
        <p className="text-muted-foreground">Formulaire d'enrôlement terrain — Carte de Travail ACI</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Identity */}
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
                      <><Camera className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" /><span className="text-xs text-muted-foreground mt-2">Photo ID</span></>
                    )}
                  </div>
                  <input type="file" accept="image/*" capture="user" className="hidden" onChange={handlePhotoChange} />
                </label>
              </div>
              <div className="space-y-2"><Label>Nom *</Label><Input placeholder="KONAN" required className="h-10 uppercase" value={form.nom || ""} onChange={e => update("nom", e.target.value)} /></div>
              <div className="space-y-2"><Label>Prénom(s) *</Label><Input placeholder="Yao Jean" required className="h-10" value={form.prenoms || ""} onChange={e => update("prenoms", e.target.value)} /></div>
              <div className="space-y-2"><Label>Date de naissance *</Label><Input type="date" required className="h-10" value={form.date_naissance || ""} onChange={e => update("date_naissance", e.target.value)} /></div>
              <div className="space-y-2"><Label>Lieu de naissance *</Label><Input placeholder="Bouaké" required className="h-10" value={form.lieu_naissance || ""} onChange={e => update("lieu_naissance", e.target.value)} /></div>
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

        {/* Section 2: Métier & Localisation */}
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

              {/* Geographic selectors */}
              <div className="space-y-2">
                <Label>District</Label>
                <Select value={form.district_id || ""} onValueChange={v => { update("district_id", v); update("region_id", ""); update("departement_id", ""); update("sous_prefecture_id", ""); update("village_id", ""); }}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>{districts.map(d => <SelectItem key={d.id} value={d.id}>{d.nom}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Région</Label>
                <Select value={form.region_id || ""} onValueChange={v => { update("region_id", v); update("departement_id", ""); update("sous_prefecture_id", ""); update("village_id", ""); }} disabled={!form.district_id}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>{filteredRegions.map(r => <SelectItem key={r.id} value={r.id}>{r.nom}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Département</Label>
                <Select value={form.departement_id || ""} onValueChange={v => { update("departement_id", v); update("sous_prefecture_id", ""); update("village_id", ""); }} disabled={!form.region_id}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>{filteredDeps.map(d => <SelectItem key={d.id} value={d.id}>{d.nom}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sous-préfecture</Label>
                <Select value={form.sous_prefecture_id || ""} onValueChange={v => { update("sous_prefecture_id", v); update("village_id", ""); }} disabled={!form.departement_id}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>{filteredSP.map(sp => <SelectItem key={sp.id} value={sp.id}>{sp.nom}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {filteredVillages.length > 0 && (
                <div className="space-y-2">
                  <Label>Village / Quartier</Label>
                  <Select value={form.village_id || ""} onValueChange={v => update("village_id", v)} disabled={!form.sous_prefecture_id}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>{filteredVillages.map(v => <SelectItem key={v.id} value={v.id}>{v.nom}</SelectItem>)}</SelectContent>
                  </Select>
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

        {/* Section 3: Contact */}
        <Card className="shadow-card">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">3</span>
              Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Contact principal *</Label><Input type="tel" placeholder="07 XX XX XX XX" required className="h-10" value={form.telephone || ""} onChange={e => update("telephone", e.target.value)} /></div>
              <div className="space-y-2"><Label>Contact secondaire</Label><Input type="tel" placeholder="05 XX XX XX XX" className="h-10" value={form.contact_secondaire || ""} onChange={e => update("contact_secondaire", e.target.value)} /></div>
              <div className="space-y-2"><Label>Numéro Mobile Money</Label><Input type="tel" placeholder="07 XX XX XX XX" className="h-10" value={form.mobile_money || ""} onChange={e => update("mobile_money", e.target.value)} /></div>
              <div className="space-y-2">
                <Label>Opérateur</Label>
                <Select onValueChange={v => update("operateur", v)}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="orange">Orange Money</SelectItem>
                    <SelectItem value="mtn">MTN MoMo</SelectItem>
                    <SelectItem value="wave">Wave</SelectItem>
                    <SelectItem value="moov">Moov Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/dashboard/beneficiaires")}>Annuler</Button>
          <Button type="submit" className="gradient-primary font-semibold px-8" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {isSubmitting ? "Enregistrement..." : "Enrôler le bénéficiaire"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EnregistrementPage;
