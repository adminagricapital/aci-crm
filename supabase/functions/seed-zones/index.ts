import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Complete administrative divisions of Côte d'Ivoire
const COTE_DIVOIRE_DATA: Record<string, Record<string, string[]>> = {
  "District Autonome d'Abidjan": {
    "Région des Grands-Ponts": ["Dabou", "Grand-Lahou", "Jacqueville"],
    "Région de l'Agnéby-Tiassa": ["Agboville", "Tiassalé", "Taabo", "Sikensi"],
    "Région de La Mé": ["Adzopé", "Akoupé", "Alépé", "Yakassé-Attobrou"],
    "Abidjan": ["Abobo", "Adjamé", "Anyama", "Attécoubé", "Bingerville", "Cocody", "Koumassi", "Marcory", "Plateau", "Port-Bouët", "Songon", "Treichville", "Yopougon"],
  },
  "District Autonome de Yamoussoukro": {
    "Région du Bélier": ["Yamoussoukro", "Didiévi", "Tiébissou", "Toumodi"],
    "Région de l'Iffou": ["Daoukro", "Bocanda", "M'Bahiakro"],
    "Région du N'Zi": ["Dimbokro", "Kouassi-Kouassikro", "Bocanda"],
  },
  "District des Lagunes": {
    "Région du Gôh": ["Gagnoa", "Oumé"],
    "Région du Lôh-Djiboua": ["Divo", "Lakota", "Guitry", "Fresco"],
  },
  "District de la Comoé": {
    "Région du Sud-Comoé": ["Aboisso", "Adiaké", "Grand-Bassam", "Tiapoum"],
    "Région de l'Indénié-Djuablin": ["Abengourou", "Agnibilékrou", "Bettié"],
  },
  "District du Zanzan": {
    "Région du Gontougo": ["Bondoukou", "Tanda", "Koun-Fao", "Transua"],
    "Région du Bounkani": ["Bouna", "Doropo", "Nassian", "Téhini"],
  },
  "District des Savanes": {
    "Région du Poro": ["Korhogo", "Sinématiali", "Dikodougou", "M'Bengué"],
    "Région du Tchologo": ["Ferkessédougou", "Kong", "Ouangolodougou"],
    "Région de la Bagoué": ["Boundiali", "Tengréla", "Kouto"],
  },
  "District de la Vallée du Bandama": {
    "Région du Hambol": ["Katiola", "Dabakala", "Niakaramandougou"],
    "Région du Gbêkê": ["Bouaké", "Béoumi", "Sakassou", "Botro"],
  },
  "District du Denguélé": {
    "Région du Folon": ["Minignan", "Kaniasso"],
    "Région du Kabadougou": ["Odienné", "Madinani", "Séguélon", "Gbéléban"],
  },
  "District du Woroba": {
    "Région du Bafing": ["Touba", "Koro", "Ouaninou"],
    "Région du Béré": ["Mankono", "Kounahiri", "Dianra"],
    "Région du Worodougou": ["Séguéla", "Kani", "Dianra"],
  },
  "District du Sassandra-Marahoué": {
    "Région du Haut-Sassandra": ["Daloa", "Vavoua", "Issia", "Zoukougbeu"],
    "Région de la Marahoué": ["Bouaflé", "Sinfra", "Zuénoula"],
  },
  "District du Bas-Sassandra": {
    "Région de San-Pedro": ["San-Pédro", "Tabou", "Grand-Béréby"],
    "Région de la Nawa": ["Soubré", "Buyo", "Guéyo", "Méagui"],
    "Région du Gbôklé": ["Sassandra", "Fresco"],
  },
  "District des Montagnes": {
    "Région du Tonkpi": ["Man", "Biankouma", "Danané", "Sipilou", "Zouan-Hounien"],
    "Région du Guémon": ["Duékoué", "Bangolo", "Facobly", "Kouibly"],
    "Région du Cavally": ["Guiglo", "Bloléquin", "Taï", "Toulépleu"],
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Clear existing data in reverse order
    await supabaseAdmin.from("sous_prefectures").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("departements").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("regions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("districts").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    let distCount = 0, regCount = 0, depCount = 0;

    for (const [districtName, regionsMap] of Object.entries(COTE_DIVOIRE_DATA)) {
      const { data: district, error: dErr } = await supabaseAdmin
        .from("districts")
        .insert({ nom: districtName, actif: true })
        .select("id")
        .single();

      if (dErr) { console.error("District error:", dErr); continue; }
      distCount++;

      for (const [regionName, departements] of Object.entries(regionsMap)) {
        const { data: region, error: rErr } = await supabaseAdmin
          .from("regions")
          .insert({ nom: regionName, district_id: district.id, actif: true })
          .select("id")
          .single();

        if (rErr) { console.error("Region error:", rErr); continue; }
        regCount++;

        for (const depName of departements) {
          const { error: depErr } = await supabaseAdmin
            .from("departements")
            .insert({ nom: depName, region_id: region.id, actif: true });

          if (depErr) { console.error("Dept error:", depErr); continue; }
          depCount++;
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, districts: distCount, regions: regCount, departements: depCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
