import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, roleLabels, UserRole } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Plus, Trash2 } from "lucide-react";

const ZoneAssignmentPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [departements, setDepartements] = useState<any[]>([]);
  const [sousPrefectures, setSousPrefectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedUser, setSelectedUser] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedDepartement, setSelectedDepartement] = useState("");
  const [selectedSP, setSelectedSP] = useState("");

  const fetchAll = async () => {
    const [profilesRes, rolesRes, assignRes, distRes, regRes, depRes, spRes] = await Promise.all([
      supabase.from("profiles").select("id, nom, prenoms, username, status").eq("status", "actif"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("zone_assignments").select("*, districts(nom), regions(nom), departements(nom), sous_prefectures(nom)").order("created_at", { ascending: false }),
      supabase.from("districts").select("id, nom").eq("actif", true).order("nom"),
      supabase.from("regions").select("id, nom, district_id").eq("actif", true).order("nom"),
      supabase.from("departements").select("id, nom, region_id").eq("actif", true).order("nom"),
      supabase.from("sous_prefectures").select("id, nom, departement_id").eq("actif", true).order("nom"),
    ]);

    const roleMap = new Map<string, string>();
    rolesRes.data?.forEach((r: any) => roleMap.set(r.user_id, r.role));

    const eligibleUsers = (profilesRes.data || [])
      .filter((p: any) => ["responsable_commercial", "chef_equipe", "commercial"].includes(roleMap.get(p.id) || ""))
      .map((p: any) => ({ ...p, role: roleMap.get(p.id) }));

    setUsers(eligibleUsers);
    setAssignments(assignRes.data || []);
    setDistricts(distRes.data || []);
    setRegions(regRes.data || []);
    setDepartements(depRes.data || []);
    setSousPrefectures(spRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const filteredRegions = selectedDistrict ? regions.filter(r => r.district_id === selectedDistrict) : [];
  const filteredDeps = selectedRegion ? departements.filter(d => d.region_id === selectedRegion) : [];
  const filteredSPs = selectedDepartement ? sousPrefectures.filter(s => s.departement_id === selectedDepartement) : [];

  const handleAssign = async () => {
    if (!selectedUser || !selectedDistrict) {
      toast({ title: "Erreur", description: "Sélectionnez un utilisateur et au moins un district", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("zone_assignments").insert({
      user_id: selectedUser,
      district_id: selectedDistrict || null,
      region_id: selectedRegion || null,
      departement_id: selectedDepartement || null,
      sous_prefecture_id: selectedSP || null,
      assigned_by: user?.id,
    });
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Zone assignée avec succès" });
    // Don't reset user/district to allow assigning multiple sous-prefectures quickly
    setSelectedSP("");
    fetchAll();
  };

  const handleRemove = async (id: string) => {
    await supabase.from("zone_assignments").delete().eq("id", id);
    toast({ title: "Zone retirée" });
    fetchAll();
  };

  const getUserName = (userId: string) => {
    const u = users.find(u => u.id === userId);
    return u ? `${u.nom} ${u.prenoms}` : userId;
  };

  const getUserRole = (userId: string) => {
    const u = users.find(u => u.id === userId);
    return u?.role ? roleLabels[u.role as UserRole] : "";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <MapPin className="h-6 w-6 text-primary" /> Assignation des Zones
        </h1>
        <p className="text-muted-foreground">Assigner des zones géographiques aux RCom, chefs d'équipe et commerciaux. Vous pouvez assigner plusieurs sous-préfectures.</p>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Nouvelle assignation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Utilisateur *</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger><SelectValue placeholder="Choisir un utilisateur" /></SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nom} {u.prenoms} ({roleLabels[u.role as UserRole]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">District *</label>
              <Select value={selectedDistrict} onValueChange={v => { setSelectedDistrict(v); setSelectedRegion(""); setSelectedDepartement(""); setSelectedSP(""); }}>
                <SelectTrigger><SelectValue placeholder="District" /></SelectTrigger>
                <SelectContent>
                  {districts.map(d => <SelectItem key={d.id} value={d.id}>{d.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Région</label>
              <Select value={selectedRegion} onValueChange={v => { setSelectedRegion(v); setSelectedDepartement(""); setSelectedSP(""); }} disabled={!selectedDistrict}>
                <SelectTrigger><SelectValue placeholder="Région" /></SelectTrigger>
                <SelectContent>
                  {filteredRegions.map(r => <SelectItem key={r.id} value={r.id}>{r.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Département</label>
              <Select value={selectedDepartement} onValueChange={v => { setSelectedDepartement(v); setSelectedSP(""); }} disabled={!selectedRegion}>
                <SelectTrigger><SelectValue placeholder="Département" /></SelectTrigger>
                <SelectContent>
                  {filteredDeps.map(d => <SelectItem key={d.id} value={d.id}>{d.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Sous-préfecture</label>
              <Select value={selectedSP} onValueChange={setSelectedSP} disabled={!selectedDepartement}>
                <SelectTrigger><SelectValue placeholder="Sous-préfecture" /></SelectTrigger>
                <SelectContent>
                  {filteredSPs.map(s => <SelectItem key={s.id} value={s.id}>{s.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="gradient-primary w-full" onClick={handleAssign} disabled={!selectedUser || !selectedDistrict}>
                <Plus className="h-4 w-4 mr-2" /> Assigner
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground mb-4">Zones assignées ({assignments.length})</h3>
          {loading ? (
            <div className="text-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : assignments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucune zone assignée</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Région</TableHead>
                  <TableHead>Département</TableHead>
                  <TableHead>Sous-préfecture</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{getUserName(a.user_id)}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{getUserRole(a.user_id)}</Badge></TableCell>
                    <TableCell>{a.districts?.nom || "-"}</TableCell>
                    <TableCell>{a.regions?.nom || "-"}</TableCell>
                    <TableCell>{a.departements?.nom || "-"}</TableCell>
                    <TableCell>{a.sous_prefectures?.nom || "-"}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => handleRemove(a.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
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

export default ZoneAssignmentPage;
