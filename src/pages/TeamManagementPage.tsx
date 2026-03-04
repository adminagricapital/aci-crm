import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, roleLabels, UserRole } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Trash2, UserCheck } from "lucide-react";

const TeamManagementPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedChef, setSelectedChef] = useState("");
  const [selectedCommercial, setSelectedCommercial] = useState("");

  const fetchAll = async () => {
    const [profilesRes, rolesRes, assignRes] = await Promise.all([
      supabase.from("profiles").select("id, nom, prenoms, username, status").eq("status", "actif"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("team_assignments").select("*").order("created_at", { ascending: false }),
    ]);

    const roleMap = new Map<string, string>();
    rolesRes.data?.forEach((r: any) => roleMap.set(r.user_id, r.role));

    const enriched = (profilesRes.data || []).map((p: any) => ({
      ...p,
      role: roleMap.get(p.id) || "commercial",
    }));

    setAllUsers(enriched);
    setAssignments(assignRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const chefsEquipe = allUsers.filter(u => u.role === "chef_equipe");
  const rcoms = allUsers.filter(u => u.role === "responsable_commercial");
  const commercials = allUsers.filter(u => u.role === "commercial");
  const assignableLeaders = [...chefsEquipe, ...rcoms];

  const availableCommercials = commercials.filter(c => !assignments.some(a => a.commercial_id === c.id && a.chef_equipe_id === selectedChef));

  const handleAssign = async () => {
    if (!selectedChef || !selectedCommercial) {
      toast({ title: "Erreur", description: "Sélectionnez un chef et un commercial", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("team_assignments").insert({
      chef_equipe_id: selectedChef,
      commercial_id: selectedCommercial,
      assigned_by: user?.id,
    });
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Commercial assigné à l'équipe" });
    setSelectedCommercial("");
    fetchAll();
  };

  const handleRemove = async (id: string) => {
    await supabase.from("team_assignments").delete().eq("id", id);
    toast({ title: "Assignation retirée" });
    fetchAll();
  };

  const getName = (id: string) => {
    const u = allUsers.find(u => u.id === id);
    return u ? `${u.nom} ${u.prenoms}` : id;
  };

  const getRole = (id: string) => {
    const u = allUsers.find(u => u.id === id);
    return u?.role ? roleLabels[u.role as UserRole] : "";
  };

  // Group assignments by chef
  const groupedByChef = new Map<string, any[]>();
  assignments.forEach(a => {
    const list = groupedByChef.get(a.chef_equipe_id) || [];
    list.push(a);
    groupedByChef.set(a.chef_equipe_id, list);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" /> Gestion des Équipes
        </h1>
        <p className="text-muted-foreground">Assigner des commerciaux aux chefs d'équipe et RCom</p>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Nouvelle assignation</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Chef d'équipe / RCom *</label>
              <Select value={selectedChef} onValueChange={setSelectedChef}>
                <SelectTrigger><SelectValue placeholder="Choisir un responsable" /></SelectTrigger>
                <SelectContent>
                  {assignableLeaders.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nom} {u.prenoms} ({roleLabels[u.role as UserRole]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Commercial *</label>
              <Select value={selectedCommercial} onValueChange={setSelectedCommercial} disabled={!selectedChef}>
                <SelectTrigger><SelectValue placeholder="Choisir un commercial" /></SelectTrigger>
                <SelectContent>
                  {availableCommercials.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nom} {c.prenoms}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="gradient-primary w-full" onClick={handleAssign} disabled={!selectedChef || !selectedCommercial}>
                <Plus className="h-4 w-4 mr-2" /> Assigner
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : assignableLeaders.length === 0 ? (
        <Card className="shadow-card"><CardContent className="p-8 text-center text-muted-foreground">
          Aucun chef d'équipe ou RCom actif trouvé
        </CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {assignableLeaders.map(leader => {
            const teamMembers = assignments.filter(a => a.chef_equipe_id === leader.id);
            return (
              <Card key={leader.id} className="shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <UserCheck className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">{leader.nom} {leader.prenoms}</p>
                      <Badge variant="secondary" className="text-xs">{roleLabels[leader.role as UserRole]}</Badge>
                    </div>
                    <Badge className="ml-auto">{teamMembers.length} commercial{teamMembers.length > 1 ? "x" : ""}</Badge>
                  </div>
                  {teamMembers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun commercial assigné</p>
                  ) : (
                    <div className="space-y-1">
                      {teamMembers.map(tm => (
                        <div key={tm.id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm font-medium">{getName(tm.commercial_id)}</span>
                          <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => handleRemove(tm.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeamManagementPage;
