import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { UserRole, roleLabels, SignupData } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import aciLogo from "@/assets/aci-logo.jpeg";

const registrableRoles: UserRole[] = ["responsable_commercial", "chef_equipe", "commercial"];

const InscriptionPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState<Partial<SignupData>>({});
  const [districts, setDistricts] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [departements, setDepartements] = useState<any[]>([]);
  const [sousPrefectures, setSousPrefectures] = useState<any[]>([]);
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    supabase.from("districts").select("*").eq("actif", true).then(({ data }) => data && setDistricts(data));
  }, []);

  useEffect(() => {
    if (form.district) {
      supabase.from("regions").select("*").eq("district_id", form.district).eq("actif", true).then(({ data }) => data && setRegions(data));
    }
  }, [form.district]);

  useEffect(() => {
    if (form.region) {
      supabase.from("departements").select("*").eq("region_id", form.region).eq("actif", true).then(({ data }) => data && setDepartements(data));
    }
  }, [form.region]);

  useEffect(() => {
    if (form.departement) {
      supabase.from("sous_prefectures").select("*").eq("departement_id", form.departement).eq("actif", true).then(({ data }) => data && setSousPrefectures(data));
    }
  }, [form.departement]);

  const showGeo = form.role_souhaite && ["responsable_commercial", "chef_equipe", "commercial"].includes(form.role_souhaite);
  const showDept = form.role_souhaite && ["chef_equipe", "commercial"].includes(form.role_souhaite);
  const showSP = form.role_souhaite === "commercial";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.nom || !form.prenoms || !form.email || !form.password || !form.telephone || !form.role_souhaite) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs obligatoires", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await signup(form as SignupData);
      toast({ title: "Inscription soumise", description: "Votre compte est en attente de validation par l'administration." });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero p-6">
      <Card className="w-full max-w-lg shadow-elevated border-0 animate-fade-in">
        <CardContent className="p-8">
          <div className="flex justify-center mb-4">
            <img src={aciLogo} alt="ACI" className="w-16 h-16 object-contain rounded-lg" />
          </div>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">Créer un compte</h2>
            <p className="text-muted-foreground mt-1">Votre compte sera soumis à validation par l'administration</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nom d'utilisateur *</Label>
              <Input placeholder="mon_nom_utilisateur" required className="h-10" value={form.username || ""} onChange={e => update("username", e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input placeholder="KONÉ" required className="h-10" value={form.nom || ""} onChange={e => update("nom", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Prénom(s) *</Label>
                <Input placeholder="Amadou" required className="h-10" value={form.prenoms || ""} onChange={e => update("prenoms", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Adresse e-mail *</Label>
              <Input type="email" placeholder="votre@email.ci" required className="h-10" value={form.email || ""} onChange={e => update("email", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Téléphone *</Label>
              <Input type="tel" placeholder="07 XX XX XX XX" required className="h-10" value={form.telephone || ""} onChange={e => update("telephone", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Mot de passe *</Label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} placeholder="Min. 8 caractères" required className="h-10 pr-10" value={form.password || ""} onChange={e => update("password", e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Rôle souhaité *</Label>
              <Select onValueChange={(v) => update("role_souhaite", v)}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Choisir un rôle" /></SelectTrigger>
                <SelectContent>
                  {registrableRoles.map((r) => (
                    <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {showGeo && (
              <div className="space-y-2 animate-fade-in">
                <Label>District *</Label>
                <Select onValueChange={(v) => { update("district", v); setRegions([]); setDepartements([]); }}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {districts.map((d: any) => (<SelectItem key={d.id} value={d.id}>{d.nom}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {showGeo && form.district && regions.length > 0 && (
              <div className="space-y-2 animate-fade-in">
                <Label>Région</Label>
                <Select onValueChange={(v) => { update("region", v); setDepartements([]); }}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {regions.map((r: any) => (<SelectItem key={r.id} value={r.id}>{r.nom}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {showDept && form.region && departements.length > 0 && (
              <div className="space-y-2 animate-fade-in">
                <Label>Département</Label>
                <Select onValueChange={(v) => update("departement", v)}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {departements.map((d: any) => (<SelectItem key={d.id} value={d.id}>{d.nom}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {showSP && form.departement && sousPrefectures.length > 0 && (
              <div className="space-y-2 animate-fade-in">
                <Label>Sous-préfecture</Label>
                <Select onValueChange={(v) => update("sous_prefecture", v)}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {sousPrefectures.map((s: any) => (<SelectItem key={s.id} value={s.id}>{s.nom}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button type="submit" className="w-full h-11 gradient-primary font-semibold mt-2" disabled={isLoading}>
              <UserPlus className="mr-2 h-4 w-4" />
              {isLoading ? "Inscription..." : "Soumettre l'inscription"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/" className="text-sm text-primary hover:underline font-medium">
              Déjà inscrit ? Se connecter
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InscriptionPage;
