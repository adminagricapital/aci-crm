import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { roleLabels, UserRole, useAuth, isAdmin } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Clock, UserPlus, Shield, Users, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [showTeam, setShowTeam] = useState(false);
  const [showZone, setShowZone] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newUser, setNewUser] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [teamAssignments, setTeamAssignments] = useState<any[]>([]);
  const [zoneAssignments, setZoneAssignments] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [departements, setDepartements] = useState<any[]>([]);
  const [selectedCommercial, setSelectedCommercial] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedDepartement, setSelectedDepartement] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (!profiles) { setLoading(false); return; }

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

  const fetchGeo = async () => {
    const [d, r, dep] = await Promise.all([
      supabase.from("districts").select("id, nom").order("nom"),
      supabase.from("regions").select("id, nom, district_id").order("nom"),
      supabase.from("departements").select("id, nom, region_id").order("nom"),
    ]);
    setDistricts(d.data || []);
    setRegions(r.data || []);
    setDepartements(dep.data || []);
  };

  useEffect(() => { fetchUsers(); fetchGeo(); }, []);

  const handleValidate = async (userId: string) => {
    const { error } = await supabase.from("profiles").update({ status: "actif" as any }).eq("id", userId);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    await supabase.from("activity_logs").insert({
      user_id: user!.id, action: "update", target_type: "profile", target_id: userId,
      details: { action: "validation_compte" },
    });
    toast({ title: "Compte validé avec succès" });
    fetchUsers();
  };

  const handleSuspend = async (userId: string) => {
    const { error } = await supabase.from("profiles").update({ status: "suspendu" as any }).eq("id", userId);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Compte suspendu" });
    fetchUsers();
  };

  const handleRefuse = async (userId: string) => {
    const { error } = await supabase.from("profiles").update({ status: "refuse" as any }).eq("id", userId);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Compte refusé" });
    fetchUsers();
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("user_roles").insert([{ user_id: userId, role: newRole as any, assigned_by: user?.id }]);
    await supabase.from("activity_logs").insert({
      user_id: user!.id, action: "update", target_type: "user_role", target_id: userId,
      details: { new_role: newRole },
    });
    toast({ title: "Rôle mis à jour", description: `Rôle changé en ${roleLabels[newRole as UserRole]}` });
    fetchUsers();
  };

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.password || !newUser.nom || !newUser.role) {
      toast({ title: "Erreur", description: "Remplissez tous les champs obligatoires", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: { email: newUser.email, username: newUser.username, password: newUser.password, nom: newUser.nom, prenoms: newUser.prenoms || "", role: newUser.role, telephone: newUser.telephone || "" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Utilisateur créé avec succès" });
      setShowCreate(false);
      setNewUser({});
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  // Team management
  const openTeamDialog = async (u: any) => {
    setSelectedUser(u);
    const { data } = await supabase.from("team_assignments").select("*").eq("chef_equipe_id", u.id);
    setTeamAssignments(data || []);
    setShowTeam(true);
  };

  const addTeamMember = async () => {
    if (!selectedCommercial || !selectedUser) return;
    const { error } = await supabase.from("team_assignments").insert({
      chef_equipe_id: selectedUser.id, commercial_id: selectedCommercial, assigned_by: user?.id,
    });
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Commercial ajouté à l'équipe" });
    const { data } = await supabase.from("team_assignments").select("*").eq("chef_equipe_id", selectedUser.id);
    setTeamAssignments(data || []);
    setSelectedCommercial("");
  };

  const removeTeamMember = async (assignmentId: string) => {
    await supabase.from("team_assignments").delete().eq("id", assignmentId);
    const { data } = await supabase.from("team_assignments").select("*").eq("chef_equipe_id", selectedUser.id);
    setTeamAssignments(data || []);
    toast({ title: "Commercial retiré de l'équipe" });
  };

  // Zone management
  const openZoneDialog = async (u: any) => {
    setSelectedUser(u);
    const { data } = await supabase.from("zone_assignments").select("*, districts(nom), regions(nom), departements(nom)").eq("user_id", u.id);
    setZoneAssignments(data || []);
    setShowZone(true);
  };

  const addZoneAssignment = async () => {
    if (!selectedUser) return;
    const { error } = await supabase.from("zone_assignments").insert({
      user_id: selectedUser.id,
      district_id: selectedDistrict || null,
      region_id: selectedRegion || null,
      departement_id: selectedDepartement || null,
      assigned_by: user?.id,
    });
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Zone assignée" });
    const { data } = await supabase.from("zone_assignments").select("*, districts(nom), regions(nom), departements(nom)").eq("user_id", selectedUser.id);
    setZoneAssignments(data || []);
  };

  const removeZoneAssignment = async (id: string) => {
    await supabase.from("zone_assignments").delete().eq("id", id);
    const { data } = await supabase.from("zone_assignments").select("*, districts(nom), regions(nom), departements(nom)").eq("user_id", selectedUser.id);
    setZoneAssignments(data || []);
    toast({ title: "Zone retirée" });
  };

  const canManage = user && isAdmin(user.role);
  const commercials = utilisateurs.filter(u => u.role === "commercial");
  const filteredRegions = selectedDistrict ? regions.filter(r => r.district_id === selectedDistrict) : regions;
  const filteredDeps = selectedRegion ? departements.filter(d => d.region_id === selectedRegion) : departements;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Utilisateurs</h1>
          <p className="text-muted-foreground">Gestion des comptes, rôles, équipes et zones</p>
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
                <div className="space-y-2"><Label>Téléphone</Label><Input value={newUser.telephone || ""} onChange={e => setNewUser(p => ({ ...p, telephone: e.target.value }))} /></div>
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
            <div className="overflow-x-auto">
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
                          <div className="flex gap-1 flex-wrap">
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
                            {u.role === "chef_equipe" && (
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openTeamDialog(u)}>
                                <Users className="h-3 w-3 mr-1" /> Équipe
                              </Button>
                            )}
                            {["chef_equipe", "responsable_commercial", "commercial"].includes(u.role) && (
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openZoneDialog(u)}>
                                <MapPin className="h-3 w-3 mr-1" /> Zone
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Assignment Dialog */}
      <Dialog open={showTeam} onOpenChange={setShowTeam}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Équipe de {selectedUser?.nom} {selectedUser?.prenoms}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Select value={selectedCommercial} onValueChange={setSelectedCommercial}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Ajouter un commercial" /></SelectTrigger>
                <SelectContent>
                  {commercials.filter(c => !teamAssignments.some(t => t.commercial_id === c.id)).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nom} {c.prenoms}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={addTeamMember} disabled={!selectedCommercial}>Ajouter</Button>
            </div>
            <div className="space-y-2">
              {teamAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun commercial assigné</p>
              ) : (
                teamAssignments.map(t => {
                  const comm = utilisateurs.find(u => u.id === t.commercial_id);
                  return (
                    <div key={t.id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{comm?.nom || "?"} {comm?.prenoms || ""}</span>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => removeTeamMember(t.id)}>Retirer</Button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Zone Assignment Dialog */}
      <Dialog open={showZone} onOpenChange={setShowZone}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Zones de {selectedUser?.nom} {selectedUser?.prenoms}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <Select value={selectedDistrict} onValueChange={v => { setSelectedDistrict(v); setSelectedRegion(""); setSelectedDepartement(""); }}>
                <SelectTrigger><SelectValue placeholder="District" /></SelectTrigger>
                <SelectContent>
                  {districts.map(d => <SelectItem key={d.id} value={d.id}>{d.nom}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedRegion} onValueChange={v => { setSelectedRegion(v); setSelectedDepartement(""); }}>
                <SelectTrigger><SelectValue placeholder="Région" /></SelectTrigger>
                <SelectContent>
                  {filteredRegions.map(r => <SelectItem key={r.id} value={r.id}>{r.nom}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedDepartement} onValueChange={setSelectedDepartement}>
                <SelectTrigger><SelectValue placeholder="Département" /></SelectTrigger>
                <SelectContent>
                  {filteredDeps.map(d => <SelectItem key={d.id} value={d.id}>{d.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={addZoneAssignment} disabled={!selectedDistrict} className="w-full">Assigner la zone</Button>
            <div className="space-y-2">
              {zoneAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aucune zone assignée</p>
              ) : (
                zoneAssignments.map(z => (
                  <div key={z.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">
                      {z.districts?.nom || ""} {z.regions?.nom ? `> ${z.regions.nom}` : ""} {z.departements?.nom ? `> ${z.departements.nom}` : ""}
                    </span>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => removeZoneAssignment(z.id)}>Retirer</Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UtilisateursPage;
