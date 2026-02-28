import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { roleLabels, UserRole, useAuth, isAdmin } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Clock, UserPlus, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const allRoles: UserRole[] = ["super_admin", "dg", "assistante_dg", "comptable", "manager_national", "responsable_commercial", "chef_equipe", "commercial"];

const statusIcons: Record<string, React.ReactNode> = {
  actif: <CheckCircle className="h-4 w-4 text-success" />,
  en_attente: <Clock className="h-4 w-4 text-warning" />,
  suspendu: <XCircle className="h-4 w-4 text-destructive" />,
  refuse: <XCircle className="h-4 w-4 text-destructive" />,
};

const UtilisateursPage = () => {
  const [utilisateurs, setUtilisateurs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (!profiles) { setLoading(false); return; }

    // Get roles for all users
    const { data: roles } = await supabase.from("user_roles").select("*");
    const roleMap = new Map<string, string>();
    roles?.forEach((r: any) => roleMap.set(r.user_id, r.role));

    const enriched = profiles.map((p: any) => ({
      ...p,
      role: roleMap.get(p.id) || "commercial",
    }));

    setUtilisateurs(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleValidate = async (userId: string) => {
    await supabase.from("profiles").update({ status: "actif" }).eq("id", userId);
    toast({ title: "Compte validé" });
    fetchUsers();
  };

  const handleSuspend = async (userId: string) => {
    await supabase.from("profiles").update({ status: "suspendu" }).eq("id", userId);
    toast({ title: "Compte suspendu" });
    fetchUsers();
  };

  const handleRefuse = async (userId: string) => {
    await supabase.from("profiles").update({ status: "refuse" }).eq("id", userId);
    toast({ title: "Compte refusé" });
    fetchUsers();
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    // Delete existing roles and insert new one
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("user_roles").insert([{ user_id: userId, role: newRole as any, assigned_by: user?.id }]);
    toast({ title: "Rôle mis à jour", description: `Rôle changé en ${roleLabels[newRole as UserRole]}` });
    fetchUsers();
  };

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.password || !newUser.nom || !newUser.role) {
      toast({ title: "Erreur", description: "Remplissez tous les champs", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      // Sign up user via edge function or direct Supabase
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: { username: newUser.username, nom: newUser.nom, prenoms: newUser.prenoms || "" },
        },
      });
      if (signupError) throw signupError;

      if (signupData.user) {
        // Activate immediately and assign role
        await supabase.from("profiles").update({ status: "actif" }).eq("id", signupData.user.id);
        await supabase.from("user_roles").insert([{ user_id: signupData.user.id, role: newUser.role as any, assigned_by: user?.id }]);
      }

      toast({ title: "Utilisateur créé" });
      setShowCreate(false);
      setNewUser({});
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const canManage = user && isAdmin(user.role);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Utilisateurs</h1>
          <p className="text-muted-foreground">Gestion des comptes, rôles et validation des accès</p>
        </div>
        {canManage && (
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button className="gradient-primary font-semibold"><UserPlus className="h-4 w-4 mr-2" /> Créer un compte</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Créer un utilisateur</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Nom d'utilisateur *</Label><Input value={newUser.username || ""} onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Nom *</Label><Input value={newUser.nom || ""} onChange={e => setNewUser(p => ({ ...p, nom: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Prénom(s)</Label><Input value={newUser.prenoms || ""} onChange={e => setNewUser(p => ({ ...p, prenoms: e.target.value }))} /></div>
                </div>
                <div className="space-y-2"><Label>Email *</Label><Input type="email" value={newUser.email || ""} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Mot de passe *</Label><Input type="password" value={newUser.password || ""} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} /></div>
                <div className="space-y-2">
                  <Label>Rôle *</Label>
                  <Select onValueChange={v => setNewUser(p => ({ ...p, role: v }))}>
                    <SelectTrigger><SelectValue placeholder="Choisir un rôle" /></SelectTrigger>
                    <SelectContent>
                      {allRoles.map(r => <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full gradient-primary" onClick={handleCreateUser} disabled={creating}>
                  {creating ? "Création..." : "Créer l'utilisateur"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="shadow-card"><CardContent className="p-4 text-center">
          <p className="text-3xl font-bold text-foreground">{utilisateurs.filter(u => u.status === "actif").length}</p>
          <p className="text-xs text-muted-foreground">Actifs</p>
        </CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-4 text-center">
          <p className="text-3xl font-bold text-warning">{utilisateurs.filter(u => u.status === "en_attente").length}</p>
          <p className="text-xs text-muted-foreground">En attente</p>
        </CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-4 text-center">
          <p className="text-3xl font-bold text-foreground">{utilisateurs.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </CardContent></Card>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-4">
          {loading ? (
            <div className="text-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {utilisateurs.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{u.nom} {u.prenoms}</p>
                        <p className="text-xs text-muted-foreground">@{u.username}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      {canManage && u.id !== user?.id ? (
                        <Select value={u.role} onValueChange={(v) => handleRoleChange(u.id, v)}>
                          <SelectTrigger className="h-8 w-44">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {allRoles.map(r => <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          {roleLabels[u.role as UserRole] || u.role}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {statusIcons[u.status]}
                        <span className="text-sm capitalize">{u.status?.replace("_", " ")}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {canManage && u.id !== user?.id && (
                        <div className="flex gap-1">
                          {u.status === "en_attente" && (
                            <>
                              <Button size="sm" className="h-7 text-xs gradient-primary" onClick={() => handleValidate(u.id)}>Valider</Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs text-destructive" onClick={() => handleRefuse(u.id)}>Refuser</Button>
                            </>
                          )}
                          {u.status === "actif" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs text-warning" onClick={() => handleSuspend(u.id)}>Suspendre</Button>
                          )}
                          {u.status === "suspendu" && (
                            <Button size="sm" className="h-7 text-xs gradient-primary" onClick={() => handleValidate(u.id)}>Réactiver</Button>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UtilisateursPage;
