import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const testBeneficiaires = [
    { nom: "KOUAME", prenoms: "Yao Bernard", date_naissance: "1985-03-15", lieu_naissance: "Bouaké", sexe: "M", nationalite: "Ivoirienne", profession: "Commerçant", domicile: "Cocody, Abidjan", telephone: "0505001001", taille: 1.75, rccm: "CI-ABJ-01-A12-1001" },
    { nom: "TRAORE", prenoms: "Aminata", date_naissance: "1990-07-22", lieu_naissance: "Korhogo", sexe: "F", nationalite: "Ivoirienne", profession: "Vendeuse", domicile: "Adjamé, Abidjan", telephone: "0707002002", taille: 1.62, rccm: "CI-ABJ-02-B45-2002" },
    { nom: "DIALLO", prenoms: "Moussa Ibrahim", date_naissance: "1988-11-05", lieu_naissance: "Man", sexe: "M", nationalite: "Ivoirienne", profession: "Technicien", domicile: "Marcory, Abidjan", telephone: "0101003003", taille: 1.80, rccm: "CI-ABJ-03-C78-3003" },
    { nom: "BAMBA", prenoms: "Fatoumata", date_naissance: "1992-01-18", lieu_naissance: "Daloa", sexe: "F", nationalite: "Ivoirienne", profession: "Coiffeuse", domicile: "Yopougon, Abidjan", telephone: "0505004004", taille: 1.58, rccm: "CI-ABJ-04-D11-4004" },
    { nom: "KONE", prenoms: "Lacina", date_naissance: "1983-06-30", lieu_naissance: "Odienné", sexe: "M", nationalite: "Ivoirienne", profession: "Mécanicien", domicile: "Abobo, Abidjan", telephone: "0707005005", taille: 1.72, rccm: "CI-ABJ-05-E34-5005" },
    { nom: "COULIBALY", prenoms: "Mariame Awa", date_naissance: "1995-09-12", lieu_naissance: "Ferkessédougou", sexe: "F", nationalite: "Ivoirienne", profession: "Restauratrice", domicile: "Treichville, Abidjan", telephone: "0101006006", taille: 1.65, rccm: "CI-ABJ-06-F67-6006" },
    { nom: "OUATTARA", prenoms: "Seydou", date_naissance: "1987-04-25", lieu_naissance: "Bondoukou", sexe: "M", nationalite: "Ivoirienne", profession: "Chauffeur", domicile: "Koumassi, Abidjan", telephone: "0505007007", taille: 1.78, rccm: "CI-ABJ-07-G90-7007" },
    { nom: "TOURE", prenoms: "Aissatou", date_naissance: "1991-12-08", lieu_naissance: "Yamoussoukro", sexe: "F", nationalite: "Ivoirienne", profession: "Couturière", domicile: "Plateau, Abidjan", telephone: "0707008008", taille: 1.60, rccm: "CI-ABJ-08-H23-8008" },
    { nom: "YAO", prenoms: "Konan Emmanuel", date_naissance: "1986-02-14", lieu_naissance: "Abengourou", sexe: "M", nationalite: "Ivoirienne", profession: "Électricien", domicile: "Port-Bouët, Abidjan", telephone: "0101009009", taille: 1.70, rccm: "CI-ABJ-09-I56-9009" },
    { nom: "KOMLAN", prenoms: "Modest", date_naissance: "2000-02-24", lieu_naissance: "Marcory (CIV)", sexe: "M", nationalite: "Togolaise", profession: "Technicien", domicile: "Marcory Anoumabo", telephone: "0545108044", taille: 1.70, rccm: "CI-ABJ-03-B13-11409" },
  ];

  const results = [];

  for (const ben of testBeneficiaires) {
    // Generate matricule
    const { data: matricule } = await supabase.rpc("generate_matricule");

    const { data: inserted, error: insertErr } = await supabase
      .from("beneficiaires")
      .insert({ ...ben, matricule: matricule || `ACI-TEST-${Math.random().toString(36).slice(2, 6)}`, status: "enregistre" })
      .select("id, matricule")
      .single();

    if (insertErr) {
      results.push({ nom: ben.nom, error: insertErr.message });
      continue;
    }

    // Create 2 payments (both paid)
    await supabase.from("paiements").insert([
      { beneficiaire_id: inserted.id, type_paiement: "paiement_1", montant: 5000, status: "paye", methode: "wave", paid_at: new Date().toISOString() },
      { beneficiaire_id: inserted.id, type_paiement: "paiement_2", montant: 5000, status: "paye", methode: "wave", paid_at: new Date().toISOString() },
    ]);

    // Create card
    await supabase.from("cartes").insert({
      beneficiaire_id: inserted.id,
      numero_carte: `CARD-${inserted.matricule}`,
      status: "pret",
      date_production: new Date().toISOString(),
    });

    results.push({ nom: ben.nom, matricule: inserted.matricule, status: "ok" });
  }

  return new Response(JSON.stringify({ message: "Test data seeded", results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
