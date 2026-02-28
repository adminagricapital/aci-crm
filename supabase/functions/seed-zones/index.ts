import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Complete administrative divisions with sous-préfectures
const COTE_DIVOIRE_DATA: Record<string, Record<string, Record<string, string[]>>> = {
  "District Autonome d'Abidjan": {
    "Abidjan": {
      "Abobo": ["Abobo", "Abobo-Baoulé", "N'Dotré"],
      "Adjamé": ["Adjamé", "Attécoubé-Adjamé"],
      "Anyama": ["Anyama"],
      "Attécoubé": ["Attécoubé"],
      "Bingerville": ["Bingerville"],
      "Cocody": ["Cocody"],
      "Koumassi": ["Koumassi"],
      "Marcory": ["Marcory"],
      "Plateau": ["Plateau"],
      "Port-Bouët": ["Port-Bouët", "Vridi"],
      "Songon": ["Songon"],
      "Treichville": ["Treichville"],
      "Yopougon": ["Yopougon", "Yopougon-Attié"],
    },
    "Région des Grands-Ponts": {
      "Dabou": ["Dabou", "Lopou", "Toupah"],
      "Grand-Lahou": ["Grand-Lahou", "Toukouzou", "Bacanda"],
      "Jacqueville": ["Jacqueville", "Addah"],
    },
    "Région de l'Agnéby-Tiassa": {
      "Agboville": ["Agboville", "Azaguié", "Grand-Morié", "Rubino"],
      "Tiassalé": ["Tiassalé", "Morokro", "N'Douci"],
      "Taabo": ["Taabo"],
      "Sikensi": ["Sikensi"],
    },
    "Région de La Mé": {
      "Adzopé": ["Adzopé", "Annépé", "Assikoi", "Bécédi-Brignan"],
      "Akoupé": ["Akoupé", "Bongouanou-Akoupé"],
      "Alépé": ["Alépé", "Oghlwapo"],
      "Yakassé-Attobrou": ["Yakassé-Attobrou"],
    },
  },
  "District Autonome de Yamoussoukro": {
    "Région du Bélier": {
      "Yamoussoukro": ["Yamoussoukro", "Attiégouakro", "Kossou"],
      "Didiévi": ["Didiévi"],
      "Tiébissou": ["Tiébissou", "Molonoublé"],
      "Toumodi": ["Toumodi", "Kokumbo", "Djékanou"],
    },
    "Région de l'Iffou": {
      "Daoukro": ["Daoukro", "Ettrokro"],
      "Bocanda": ["Bocanda", "Kouakou-Broukro"],
      "M'Bahiakro": ["M'Bahiakro", "Prikro"],
    },
    "Région du N'Zi": {
      "Dimbokro": ["Dimbokro", "Nofou", "Abigui"],
      "Kouassi-Kouassikro": ["Kouassi-Kouassikro"],
      "Bocanda": ["Bocanda"],
    },
  },
  "District des Lagunes": {
    "Région du Gôh": {
      "Gagnoa": ["Gagnoa", "Guibéroua", "Ouragahio", "Bayota"],
      "Oumé": ["Oumé", "Diégonéfla", "Tonla"],
    },
    "Région du Lôh-Djiboua": {
      "Divo": ["Divo", "Hiré", "Guitry"],
      "Lakota": ["Lakota", "Zikisso"],
      "Guitry": ["Guitry"],
      "Fresco": ["Fresco", "Dahiri"],
    },
  },
  "District de la Comoé": {
    "Région du Sud-Comoé": {
      "Aboisso": ["Aboisso", "Ayamé", "Maféré", "Bianouan"],
      "Adiaké": ["Adiaké", "Assinie-Mafia", "Étuéboué"],
      "Grand-Bassam": ["Grand-Bassam", "Bonoua", "Samo"],
      "Tiapoum": ["Tiapoum"],
    },
    "Région de l'Indénié-Djuablin": {
      "Abengourou": ["Abengourou", "Aniassué", "Niablé", "Amélékia"],
      "Agnibilékrou": ["Agnibilékrou", "Damé"],
      "Bettié": ["Bettié", "Ébilassokro"],
    },
  },
  "District du Zanzan": {
    "Région du Gontougo": {
      "Bondoukou": ["Bondoukou", "Laoudi-Bâ", "Sapli-Sépingo", "Tabagne"],
      "Tanda": ["Tanda", "Tankessé", "Assuéfry"],
      "Koun-Fao": ["Koun-Fao", "Kouassi-Datékro"],
      "Transua": ["Transua", "Sandégué"],
    },
    "Région du Bounkani": {
      "Bouna": ["Bouna", "Ondéfidouo"],
      "Doropo": ["Doropo", "Kalamon"],
      "Nassian": ["Nassian", "Soko"],
      "Téhini": ["Téhini", "Tougbo"],
    },
  },
  "District des Savanes": {
    "Région du Poro": {
      "Korhogo": ["Korhogo", "Karakoro", "Lataha", "Dassoungboho", "Tioroniaradougou"],
      "Sinématiali": ["Sinématiali", "Niéllé"],
      "Dikodougou": ["Dikodougou", "Guiembé"],
      "M'Bengué": ["M'Bengué", "Kanoroba"],
    },
    "Région du Tchologo": {
      "Ferkessédougou": ["Ferkessédougou", "Koumbala"],
      "Kong": ["Kong", "Bilimono"],
      "Ouangolodougou": ["Ouangolodougou", "Nielle"],
    },
    "Région de la Bagoué": {
      "Boundiali": ["Boundiali", "Gbon", "Kolia", "Siempurgo"],
      "Tengréla": ["Tengréla", "Débété", "Kanakono"],
      "Kouto": ["Kouto", "Sianhala"],
    },
  },
  "District de la Vallée du Bandama": {
    "Région du Hambol": {
      "Katiola": ["Katiola", "Timbé", "Fronan"],
      "Dabakala": ["Dabakala", "Boniéré", "Satama-Sokoro"],
      "Niakaramandougou": ["Niakaramandougou", "Arikokaha", "Tortiya"],
    },
    "Région du Gbêkê": {
      "Bouaké": ["Bouaké", "Djébonoua", "Brobo", "Languibonou"],
      "Béoumi": ["Béoumi", "Kondrobo", "Bodokro"],
      "Sakassou": ["Sakassou", "Ayaou-Sran"],
      "Botro": ["Botro", "Diabo"],
    },
  },
  "District du Denguélé": {
    "Région du Folon": {
      "Minignan": ["Minignan", "Sokoro"],
      "Kaniasso": ["Kaniasso", "Goulia"],
    },
    "Région du Kabadougou": {
      "Odienné": ["Odienné", "Bako", "Dioulatiédougou", "Samatiguila"],
      "Madinani": ["Madinani", "Tienko"],
      "Séguélon": ["Séguélon", "Gbéléban"],
    },
  },
  "District du Woroba": {
    "Région du Bafing": {
      "Touba": ["Touba", "Guintéguéla", "Borotou-Koro"],
      "Koro": ["Koro", "Dianra"],
      "Ouaninou": ["Ouaninou"],
    },
    "Région du Béré": {
      "Mankono": ["Mankono", "Sarhala", "Marandallah"],
      "Kounahiri": ["Kounahiri", "Kongasso"],
      "Dianra": ["Dianra"],
    },
    "Région du Worodougou": {
      "Séguéla": ["Séguéla", "Massala", "Sifié", "Dualla"],
      "Kani": ["Kani"],
    },
  },
  "District du Sassandra-Marahoué": {
    "Région du Haut-Sassandra": {
      "Daloa": ["Daloa", "Gonaté", "Gboguhé", "Bédiala"],
      "Vavoua": ["Vavoua", "Bazra-Nattis", "Kétro-Bassam"],
      "Issia": ["Issia", "Saïoua", "Iboguhé", "Nahio"],
      "Zoukougbeu": ["Zoukougbeu", "Guezon"],
    },
    "Région de la Marahoué": {
      "Bouaflé": ["Bouaflé", "Bonon", "Manfla"],
      "Sinfra": ["Sinfra", "Konéfla"],
      "Zuénoula": ["Zuénoula", "Gohitafla"],
    },
  },
  "District du Bas-Sassandra": {
    "Région de San-Pedro": {
      "San-Pédro": ["San-Pédro", "Doba", "Grand-Béréby"],
      "Tabou": ["Tabou", "Grabo", "Olodio", "Djouroutou"],
      "Grand-Béréby": ["Grand-Béréby"],
    },
    "Région de la Nawa": {
      "Soubré": ["Soubré", "Liliyo", "Okrouyo", "Grand-Zattry"],
      "Buyo": ["Buyo"],
      "Guéyo": ["Guéyo"],
      "Méagui": ["Méagui", "Oupoyo"],
    },
    "Région du Gbôklé": {
      "Sassandra": ["Sassandra", "Sago", "Dakpadou"],
      "Fresco": ["Fresco"],
    },
  },
  "District des Montagnes": {
    "Région du Tonkpi": {
      "Man": ["Man", "Logoualé", "Gbonné", "Sangouiné"],
      "Biankouma": ["Biankouma", "Gbangbégouiné", "Santa"],
      "Danané": ["Danané", "Mahapleu", "Gouiné"],
      "Sipilou": ["Sipilou"],
      "Zouan-Hounien": ["Zouan-Hounien", "Bin-Houyé"],
    },
    "Région du Guémon": {
      "Duékoué": ["Duékoué", "Guéhiébly", "Bagouo"],
      "Bangolo": ["Bangolo", "Zouan", "Diéouzon"],
      "Facobly": ["Facobly"],
      "Kouibly": ["Kouibly", "Ouyably-Gnondrou"],
    },
    "Région du Cavally": {
      "Guiglo": ["Guiglo", "Duékoué-Cavally"],
      "Bloléquin": ["Bloléquin", "Zéo", "Doké"],
      "Taï": ["Taï", "Zagné"],
      "Toulépleu": ["Toulépleu", "Péhé", "Tiobly"],
    },
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

    let distCount = 0, regCount = 0, depCount = 0, spCount = 0;

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

        for (const [depName, sousPrefectures] of Object.entries(departements)) {
          const { data: dep, error: depErr } = await supabaseAdmin
            .from("departements")
            .insert({ nom: depName, region_id: region.id, actif: true })
            .select("id")
            .single();

          if (depErr) { console.error("Dept error:", depErr); continue; }
          depCount++;

          for (const spName of sousPrefectures) {
            const { error: spErr } = await supabaseAdmin
              .from("sous_prefectures")
              .insert({ nom: spName, departement_id: dep.id, actif: true });

            if (spErr) { console.error("SP error:", spErr); continue; }
            spCount++;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, districts: distCount, regions: regCount, departements: depCount, sous_prefectures: spCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
