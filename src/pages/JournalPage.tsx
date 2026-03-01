import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ClipboardList, Search } from "lucide-react";

const JournalPage = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("all");

  useEffect(() => {
    const fetchLogs = async () => {
      let query = supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (filterAction !== "all") {
        query = query.eq("action", filterAction);
      }

      const { data } = await query;
      setLogs(data || []);
      setLoading(false);
    };
    fetchLogs();
  }, [filterAction]);

  const filtered = logs.filter(l =>
    !search || l.action?.includes(search) || l.target_type?.includes(search) || l.target_id?.includes(search)
  );

  const actionColors: Record<string, string> = {
    create: "bg-emerald-100 text-emerald-700",
    update: "bg-sky-100 text-sky-700",
    delete: "bg-red-100 text-red-700",
    login: "bg-violet-100 text-violet-700",
    payment: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ClipboardList className="h-6 w-6" /> Journal d'activité
        </h1>
        <p className="text-muted-foreground">Traçabilité complète des actions sur la plateforme</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-10" />
        </div>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-48 h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les actions</SelectItem>
            <SelectItem value="create">Création</SelectItem>
            <SelectItem value="update">Modification</SelectItem>
            <SelectItem value="delete">Suppression</SelectItem>
            <SelectItem value="login">Connexion</SelectItem>
            <SelectItem value="payment">Paiement</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-4">
          {loading ? (
            <div className="text-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Aucune activité enregistrée</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Cible</TableHead>
                    <TableHead>Détails</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("fr-FR")}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs border-0 ${actionColors[log.action] || "bg-muted text-muted-foreground"}`}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{log.target_type || "-"}</TableCell>
                      <TableCell className="text-xs font-mono">{log.target_id?.substring(0, 8) || "-"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {log.details ? JSON.stringify(log.details).substring(0, 60) : "-"}
                      </TableCell>
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

export default JournalPage;
