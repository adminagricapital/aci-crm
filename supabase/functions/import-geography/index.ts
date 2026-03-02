const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Complete geography of Côte d'Ivoire
const GEOGRAPHY_DATA = {
  districts: [
    { nom: "District Autonome d'Abidjan", regions: [
      { nom: "Abidjan", departements: [
        { nom: "Abidjan", sous_prefectures: ["Abobo", "Adjamé", "Anyama", "Attécoubé", "Bingerville", "Cocody", "Koumassi", "Marcory", "Plateau", "Port-Bouët", "Treichville", "Yopougon", "Songon"] },
      ]},
    ]},
    { nom: "District Autonome de Yamoussoukro", regions: [
      { nom: "Bélier", departements: [
        { nom: "Yamoussoukro", sous_prefectures: ["Yamoussoukro", "Attiégouakro", "Kossou"] },
        { nom: "Didiévi", sous_prefectures: ["Didiévi"] },
        { nom: "Tiébissou", sous_prefectures: ["Tiébissou", "Molonoublé"] },
        { nom: "Toumodi", sous_prefectures: ["Toumodi", "Kokumbo", "Kpouèbo"] },
      ]},
    ]},
    { nom: "District des Comoé", regions: [
      { nom: "Sud-Comoé", departements: [
        { nom: "Aboisso", sous_prefectures: ["Aboisso", "Adiaké", "Ayamé", "Etuéboué", "Maféré", "Tiapoum"] },
        { nom: "Adiaké", sous_prefectures: ["Adiaké"] },
        { nom: "Grand-Bassam", sous_prefectures: ["Grand-Bassam", "Bonoua", "Assinie-Mafia"] },
        { nom: "Tiapoum", sous_prefectures: ["Tiapoum"] },
      ]},
      { nom: "Indénié-Djuablin", departements: [
        { nom: "Abengourou", sous_prefectures: ["Abengourou", "Aniassué", "Niablé"] },
        { nom: "Agnibilékrou", sous_prefectures: ["Agnibilékrou", "Damé"] },
        { nom: "Bettié", sous_prefectures: ["Bettié"] },
      ]},
    ]},
    { nom: "District du Denguélé", regions: [
      { nom: "Folon", departements: [
        { nom: "Minignan", sous_prefectures: ["Minignan", "Kaniasso", "Goulia"] },
      ]},
      { nom: "Kabadougou", departements: [
        { nom: "Odienné", sous_prefectures: ["Odienné", "Gbéléban", "Madinani", "Samatiguila", "Séguélon"] },
      ]},
    ]},
    { nom: "District du Gôh-Djiboua", regions: [
      { nom: "Gôh", departements: [
        { nom: "Gagnoa", sous_prefectures: ["Gagnoa", "Bayota", "Dignago", "Doukouya", "Gnagbodougnoa", "Guéyo", "Ouragahio", "Serihio"] },
        { nom: "Oumé", sous_prefectures: ["Oumé", "Diégonéfla", "Tonla"] },
      ]},
      { nom: "Lôh-Djiboua", departements: [
        { nom: "Divo", sous_prefectures: ["Divo", "Guitry", "Hiré", "Lakota", "Zikisso"] },
        { nom: "Lakota", sous_prefectures: ["Lakota", "Niambézaria"] },
      ]},
    ]},
    { nom: "District des Lagunes", regions: [
      { nom: "Agnéby-Tiassa", departements: [
        { nom: "Agboville", sous_prefectures: ["Agboville", "Azaguié", "Rubino", "Grand-Morié"] },
        { nom: "Tiassalé", sous_prefectures: ["Tiassalé", "N'Douci", "Morokro"] },
        { nom: "Sikensi", sous_prefectures: ["Sikensi", "Taabo"] },
      ]},
      { nom: "Grands-Ponts", departements: [
        { nom: "Dabou", sous_prefectures: ["Dabou", "Jacqueville", "Grand-Lahou"] },
        { nom: "Jacqueville", sous_prefectures: ["Jacqueville"] },
        { nom: "Grand-Lahou", sous_prefectures: ["Grand-Lahou"] },
      ]},
      { nom: "Mé", departements: [
        { nom: "Adzopé", sous_prefectures: ["Adzopé", "Akoupé", "Alépé", "Yakassé-Attobrou", "Bécédi-Brignan"] },
        { nom: "Akoupé", sous_prefectures: ["Akoupé"] },
        { nom: "Alépé", sous_prefectures: ["Alépé"] },
      ]},
    ]},
    { nom: "District des Montagnes", regions: [
      { nom: "Cavally", departements: [
        { nom: "Guiglo", sous_prefectures: ["Guiglo", "Bloléquin", "Toulépleu", "Taï", "Zagné"] },
        { nom: "Bloléquin", sous_prefectures: ["Bloléquin"] },
        { nom: "Toulépleu", sous_prefectures: ["Toulépleu"] },
        { nom: "Taï", sous_prefectures: ["Taï"] },
      ]},
      { nom: "Guémon", departements: [
        { nom: "Duékoué", sous_prefectures: ["Duékoué", "Bangolo", "Facobly", "Kouibly"] },
        { nom: "Bangolo", sous_prefectures: ["Bangolo"] },
      ]},
      { nom: "Tonkpi", departements: [
        { nom: "Man", sous_prefectures: ["Man", "Biankouma", "Danané", "Sipilou", "Zouan-Hounien", "Sangouiné"] },
        { nom: "Biankouma", sous_prefectures: ["Biankouma"] },
        { nom: "Danané", sous_prefectures: ["Danané"] },
      ]},
    ]},
    { nom: "District du Sassandra-Marahoué", regions: [
      { nom: "Haut-Sassandra", departements: [
        { nom: "Daloa", sous_prefectures: ["Daloa", "Issia", "Vavoua", "Zoukougbeu"] },
        { nom: "Issia", sous_prefectures: ["Issia", "Nahio", "Saïoua"] },
        { nom: "Vavoua", sous_prefectures: ["Vavoua", "Bazré", "Kétro-Bassam"] },
      ]},
      { nom: "Marahoué", departements: [
        { nom: "Bouaflé", sous_prefectures: ["Bouaflé", "Bonon", "Sinfra", "Zuénoula"] },
        { nom: "Sinfra", sous_prefectures: ["Sinfra"] },
        { nom: "Zuénoula", sous_prefectures: ["Zuénoula"] },
      ]},
    ]},
    { nom: "District des Savanes", regions: [
      { nom: "Bagoué", departements: [
        { nom: "Boundiali", sous_prefectures: ["Boundiali", "Kouto", "Tengréla", "Ganaoni"] },
        { nom: "Kouto", sous_prefectures: ["Kouto"] },
        { nom: "Tengréla", sous_prefectures: ["Tengréla"] },
      ]},
      { nom: "Poro", departements: [
        { nom: "Korhogo", sous_prefectures: ["Korhogo", "Sinématiali", "Dikodougou", "M'Bengué", "Ferkessédougou"] },
        { nom: "Sinématiali", sous_prefectures: ["Sinématiali"] },
        { nom: "Dikodougou", sous_prefectures: ["Dikodougou"] },
      ]},
      { nom: "Tchologo", departements: [
        { nom: "Ferkessédougou", sous_prefectures: ["Ferkessédougou", "Kong", "Ouangolodougou"] },
        { nom: "Kong", sous_prefectures: ["Kong"] },
        { nom: "Ouangolodougou", sous_prefectures: ["Ouangolodougou"] },
      ]},
    ]},
    { nom: "District du Bas-Sassandra", regions: [
      { nom: "Gbôklé", departements: [
        { nom: "Sassandra", sous_prefectures: ["Sassandra", "Méagui", "Gueyo"] },
      ]},
      { nom: "Nawa", departements: [
        { nom: "Soubré", sous_prefectures: ["Soubré", "Buyo", "Guéyo", "Méagui"] },
        { nom: "Buyo", sous_prefectures: ["Buyo"] },
        { nom: "Méagui", sous_prefectures: ["Méagui"] },
      ]},
      { nom: "San-Pédro", departements: [
        { nom: "San-Pédro", sous_prefectures: ["San-Pédro", "Tabou", "Grand-Béréby"] },
        { nom: "Tabou", sous_prefectures: ["Tabou"] },
        { nom: "Grand-Béréby", sous_prefectures: ["Grand-Béréby"] },
      ]},
    ]},
    { nom: "District de la Vallée du Bandama", regions: [
      { nom: "Gbêkê", departements: [
        { nom: "Bouaké", sous_prefectures: ["Bouaké", "Béoumi", "Sakassou", "Botro"] },
        { nom: "Béoumi", sous_prefectures: ["Béoumi"] },
        { nom: "Sakassou", sous_prefectures: ["Sakassou"] },
        { nom: "Botro", sous_prefectures: ["Botro"] },
      ]},
      { nom: "Hambol", departements: [
        { nom: "Katiola", sous_prefectures: ["Katiola", "Dabakala", "Niakaramandougou"] },
        { nom: "Dabakala", sous_prefectures: ["Dabakala"] },
        { nom: "Niakaramandougou", sous_prefectures: ["Niakaramandougou"] },
      ]},
    ]},
    { nom: "District du Woroba", regions: [
      { nom: "Béré", departements: [
        { nom: "Mankono", sous_prefectures: ["Mankono", "Dianra", "Kounahiri"] },
      ]},
      { nom: "Bafing", departements: [
        { nom: "Touba", sous_prefectures: ["Touba", "Koro", "Ouaninou", "Booko"] },
      ]},
      { nom: "Worodougou", departements: [
        { nom: "Séguéla", sous_prefectures: ["Séguéla", "Kani", "Massala", "Diarabana", "Sifié", "Worofla"] },
      ]},
    ]},
    { nom: "District du Zanzan", regions: [
      { nom: "Bounkani", departements: [
        { nom: "Bouna", sous_prefectures: ["Bouna", "Doropo", "Nassian", "Téhini"] },
      ]},
      { nom: "Gontougo", departements: [
        { nom: "Bondoukou", sous_prefectures: ["Bondoukou", "Koun-Fao", "Sandégué", "Tanda", "Transua"] },
        { nom: "Tanda", sous_prefectures: ["Tanda"] },
      ]},
    ]},
  ]
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let totalInserted = { districts: 0, regions: 0, departements: 0, sous_prefectures: 0 };

    for (const district of GEOGRAPHY_DATA.districts) {
      // Check if district exists
      let { data: existingDistrict } = await supabase.from('districts').select('id').eq('nom', district.nom).maybeSingle();
      
      let districtId: string;
      if (existingDistrict) {
        districtId = existingDistrict.id;
      } else {
        const { data: newDistrict, error } = await supabase.from('districts').insert({ nom: district.nom }).select('id').single();
        if (error) { console.error('District error:', district.nom, error); continue; }
        districtId = newDistrict.id;
        totalInserted.districts++;
      }

      for (const region of district.regions) {
        let { data: existingRegion } = await supabase.from('regions').select('id').eq('nom', region.nom).eq('district_id', districtId).maybeSingle();
        
        let regionId: string;
        if (existingRegion) {
          regionId = existingRegion.id;
        } else {
          const { data: newRegion, error } = await supabase.from('regions').insert({ nom: region.nom, district_id: districtId }).select('id').single();
          if (error) { console.error('Region error:', region.nom, error); continue; }
          regionId = newRegion.id;
          totalInserted.regions++;
        }

        for (const dept of region.departements) {
          let { data: existingDept } = await supabase.from('departements').select('id').eq('nom', dept.nom).eq('region_id', regionId).maybeSingle();
          
          let deptId: string;
          if (existingDept) {
            deptId = existingDept.id;
          } else {
            const { data: newDept, error } = await supabase.from('departements').insert({ nom: dept.nom, region_id: regionId }).select('id').single();
            if (error) { console.error('Dept error:', dept.nom, error); continue; }
            deptId = newDept.id;
            totalInserted.departements++;
          }

          for (const sp of dept.sous_prefectures) {
            let { data: existingSP } = await supabase.from('sous_prefectures').select('id').eq('nom', sp).eq('departement_id', deptId).maybeSingle();
            
            if (!existingSP) {
              const { error } = await supabase.from('sous_prefectures').insert({ nom: sp, departement_id: deptId });
              if (error) { console.error('SP error:', sp, error); continue; }
              totalInserted.sous_prefectures++;
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, inserted: totalInserted }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
