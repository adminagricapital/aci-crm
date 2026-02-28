import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, ChevronDown, ChevronRight, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

const ZonesPage = () => {
  const [districts, setDistricts] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [departements, setDepartements] = useState<any[]>([]);
  const [sousPrefectures, setSousPrefectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    const fetchAll = async () => {
      const [d, r, dep, sp] = await Promise.all([
        supabase.from("districts").select("*").order("nom").then(r => r),
        supabase.from("regions").select("*").order("nom").then(r => r),
        supabase.from("departements").select("*").order("nom").then(r => r),
        supabase.from("sous_prefectures").select("*").order("nom").then(r => r),
      ]);
      setDistricts(d.data || []);
      setRegions(r.data || []);
      setDepartements(dep.data || []);
      setSousPrefectures(sp.data || []);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const toggleDistrict = async (id: string, actif: boolean) => {
    await supabase.from("districts").update({ actif: !actif }).eq("id", id);
    setDistricts(prev => prev.map(d => d.id === id ? { ...d, actif: !actif } : d));
    toast({ title: `District ${!actif ? "activé" : "désactivé"}` });
  };

  const toggleRegion = async (id: string, actif: boolean) => {
    await supabase.from("regions").update({ actif: !actif }).eq("id", id);
    setRegions(prev => prev.map(r => r.id === id ? { ...r, actif: !actif } : r));
  };

  const toggleDepartement = async (id: string, actif: boolean) => {
    await supabase.from("departements").update({ actif: !actif }).eq("id", id);
    setDepartements(prev => prev.map(d => d.id === id ? { ...d, actif: !actif } : d));
  };

  const filteredDistricts = districts.filter(d =>
    !search || d.nom.toLowerCase().includes(search.toLowerCase()) ||
    regions.some(r => r.district_id === d.id && r.nom.toLowerCase().includes(search.toLowerCase())) ||
    regions.some(r => r.district_id === d.id && departements.some(dep => dep.region_id === r.id && dep.nom.toLowerCase().includes(search.toLowerCase())))
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Zones géographiques</h1>
          <p className="text-muted-foreground">
            {districts.length} districts · {regions.length} régions · {departements.length} départements · {sousPrefectures.length} sous-préfectures
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher une zone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="space-y-3">
        {filteredDistricts.map((district) => {
          const distRegions = regions.filter((r) => r.district_id === district.id);
          const isExpanded = expanded[district.id] ?? true;
          return (
            <Card key={district.id} className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggle(district.id)}>
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    <MapPin className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-foreground text-sm">{district.nom}</h3>
                    <Badge variant="secondary" className="text-[10px]">{distRegions.length} régions</Badge>
                    <Badge className={`text-[10px] border-0 ${district.actif ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                      {district.actif ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                  <Switch checked={district.actif} onCheckedChange={() => toggleDistrict(district.id, district.actif)} />
                </div>

                {isExpanded && distRegions.length > 0 && (
                  <div className="ml-8 mt-3 space-y-2">
                    {distRegions.map((region) => {
                      const deps = departements.filter((d) => d.region_id === region.id);
                      const regExpanded = expanded[region.id] ?? false;
                      return (
                        <div key={region.id} className="border-l-2 border-primary/20 pl-4 py-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggle(region.id)}>
                              {deps.length > 0 && (regExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />)}
                              <span className="text-sm font-medium text-foreground">{region.nom}</span>
                              <Badge variant="secondary" className="text-[9px]">{deps.length} dép.</Badge>
                            </div>
                            <Switch checked={region.actif} onCheckedChange={() => toggleRegion(region.id, region.actif)} />
                          </div>
                          {regExpanded && deps.length > 0 && (
                            <div className="ml-6 mt-2 space-y-1">
                              {deps.map((dep) => {
                                const sps = sousPrefectures.filter(sp => sp.departement_id === dep.id);
                                return (
                                  <div key={dep.id} className="border-l border-border pl-3 py-1">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">{dep.nom}</span>
                                        {sps.length > 0 && <Badge variant="outline" className="text-[9px]">{sps.length} s-p</Badge>}
                                      </div>
                                      <Switch checked={dep.actif} onCheckedChange={() => toggleDepartement(dep.id, dep.actif)} />
                                    </div>
                                    {sps.length > 0 && (
                                      <div className="ml-4 mt-1 flex flex-wrap gap-1">
                                        {sps.map(sp => (
                                          <Badge key={sp.id} variant="outline" className="text-[9px] font-normal">{sp.nom}</Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ZonesPage;
