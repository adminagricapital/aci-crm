import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ZonesPage = () => {
  const [districts, setDistricts] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [departements, setDepartements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetch = async () => {
      const [d, r, dep] = await Promise.all([
        supabase.from("districts").select("*").order("nom"),
        supabase.from("regions").select("*").order("nom"),
        supabase.from("departements").select("*").order("nom"),
      ]);
      setDistricts(d.data || []);
      setRegions(r.data || []);
      setDepartements(dep.data || []);
      setLoading(false);
    };
    fetch();
  }, []);

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

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Zones géographiques</h1>
        <p className="text-muted-foreground">Gestion du découpage administratif en cascade</p>
      </div>

      <div className="space-y-4">
        {districts.map((district) => {
          const distRegions = regions.filter((r) => r.district_id === district.id);
          return (
            <Card key={district.id} className="shadow-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">{district.nom}</h3>
                    <Badge variant={district.actif ? "default" : "secondary"} className={`text-[10px] border-0 ${district.actif ? "bg-success text-success-foreground" : ""}`}>
                      {district.actif ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                  <Switch checked={district.actif} onCheckedChange={() => toggleDistrict(district.id, district.actif)} />
                </div>

                {distRegions.length > 0 && (
                  <div className="ml-8 space-y-2">
                    {distRegions.map((region) => {
                      const deps = departements.filter((d) => d.region_id === region.id);
                      return (
                        <div key={region.id} className="border-l-2 border-border pl-4 py-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground">{region.nom}</span>
                              <Badge variant="secondary" className="text-[10px]">{region.actif ? "Actif" : "Inactif"}</Badge>
                            </div>
                            <Switch checked={region.actif} onCheckedChange={() => toggleRegion(region.id, region.actif)} />
                          </div>
                          {deps.length > 0 && (
                            <div className="ml-4 mt-2 space-y-1">
                              {deps.map((dep) => (
                                <div key={dep.id} className="flex items-center justify-between border-l border-border pl-3 py-1">
                                  <span className="text-sm text-muted-foreground">{dep.nom}</span>
                                  <Switch checked={dep.actif} onCheckedChange={() => toggleDepartement(dep.id, dep.actif)} />
                                </div>
                              ))}
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
