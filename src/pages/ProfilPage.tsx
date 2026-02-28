import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Camera, Save, Loader2, Lock, User, FileText, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ProfilPage = () => {
  const { user, supabaseUser } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [form, setForm] = useState({
    nom: user?.nom || "",
    prenoms: user?.prenoms || "",
    telephone: user?.telephone || "",
  });
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.photo_url || null);
  const [cniRectoPreview, setCniRectoPreview] = useState<string | null>(null);
  const [cniVersoPreview, setCniVersoPreview] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const cniRectoRef = useRef<HTMLInputElement>(null);
  const cniVersoRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (bucket: string, path: string, file: File): Promise<string | null> => {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) { console.error("Upload error:", error); return null; }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);

    const ext = file.name.split(".").pop();
    const url = await uploadFile("user-avatars", `${user.id}/avatar.${ext}`, file);
    if (url) {
      await supabase.from("profiles").update({ photo_url: url }).eq("id", user.id);
      toast({ title: "Photo mise à jour" });
    }
  };

  const handleCniUpload = async (side: "recto" | "verso", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (side === "recto") setCniRectoPreview(reader.result as string);
      else setCniVersoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    const ext = file.name.split(".").pop();
    const url = await uploadFile("user-documents", `${user.id}/cni_${side}.${ext}`, file);
    if (url) {
      await supabase.from("profiles").update({ [`cni_${side}_url`]: url }).eq("id", user.id);
      toast({ title: `CNI ${side} enregistrée` });
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        nom: form.nom,
        prenoms: form.prenoms,
        telephone: form.telephone,
      }).eq("id", user.id);
      if (error) throw error;
      toast({ title: "Profil mis à jour" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.newPass !== passwords.confirm) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas", variant: "destructive" });
      return;
    }
    if (passwords.newPass.length < 6) {
      toast({ title: "Erreur", description: "6 caractères minimum", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwords.newPass });
      if (error) throw error;
      toast({ title: "Mot de passe modifié" });
      setPasswords({ current: "", newPass: "", confirm: "" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mon profil</h1>
        <p className="text-muted-foreground">Gérez vos informations personnelles et votre sécurité</p>
      </div>

      {/* Photo & Identity */}
      <Card className="shadow-card">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" /> Informations personnelles
          </h3>
          <div className="flex flex-col items-center mb-6">
            <div className="relative group cursor-pointer" onClick={() => photoRef.current?.click()}>
              <Avatar className="h-24 w-24">
                <AvatarImage src={photoPreview || undefined} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {user?.prenoms?.[0]}{user?.nom?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            <p className="text-xs text-muted-foreground mt-2">Cliquez pour changer</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Prénom(s)</Label>
              <Input value={form.prenoms} onChange={e => setForm(p => ({ ...p, prenoms: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input value={form.telephone} onChange={e => setForm(p => ({ ...p, telephone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Nom d'utilisateur</Label>
              <Input value={user?.username || ""} disabled className="bg-muted" />
            </div>
          </div>
          <Button className="gradient-primary font-semibold mt-4" onClick={handleSaveProfile} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Enregistrer
          </Button>
        </CardContent>
      </Card>

      {/* CNI Upload */}
      <Card className="shadow-card">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Pièce d'identité (CNI)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Recto</Label>
              <div
                className="border-2 border-dashed border-border rounded-lg h-40 flex items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden bg-muted"
                onClick={() => cniRectoRef.current?.click()}
              >
                {cniRectoPreview ? (
                  <img src={cniRectoPreview} alt="CNI Recto" className="h-full w-full object-cover" />
                ) : (
                  <div className="text-center">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Télécharger le recto</p>
                  </div>
                )}
              </div>
              <input ref={cniRectoRef} type="file" accept="image/*" className="hidden" onChange={e => handleCniUpload("recto", e)} />
            </div>
            <div>
              <Label className="mb-2 block">Verso</Label>
              <div
                className="border-2 border-dashed border-border rounded-lg h-40 flex items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden bg-muted"
                onClick={() => cniVersoRef.current?.click()}
              >
                {cniVersoPreview ? (
                  <img src={cniVersoPreview} alt="CNI Verso" className="h-full w-full object-cover" />
                ) : (
                  <div className="text-center">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Télécharger le verso</p>
                  </div>
                )}
              </div>
              <input ref={cniVersoRef} type="file" accept="image/*" className="hidden" onChange={e => handleCniUpload("verso", e)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card className="shadow-card">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" /> Sécurité
          </h3>
          <div className="space-y-4 max-w-sm">
            <div className="space-y-2">
              <Label>Nouveau mot de passe</Label>
              <Input type="password" value={passwords.newPass} onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))} placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label>Confirmer le mot de passe</Label>
              <Input type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} placeholder="••••••••" />
            </div>
            <Button variant="outline" onClick={handleChangePassword} disabled={changingPassword || !passwords.newPass}>
              {changingPassword ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
              Changer le mot de passe
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilPage;
