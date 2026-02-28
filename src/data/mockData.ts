// Mock data for ACI - Association des Commerciaux Ivoiriens

export const mockBeneficiaires = [
  { id: "ACI-0001", nom: "KONAN", prenoms: "Yao Jean", dateNaissance: "15/03/1985", lieuNaissance: "Bouaké", sexe: "M", nationalite: "Ivoirienne", taille: "1.72", profession: "Menuisier", domicile: "Abobo, Abidjan", statut: "livré", paiement1: true, paiement2: true, commercial: "OUATTARA Moussa", dateEnregistrement: "2026-01-15", telephone: "0708091011", operateur: "Orange Money" },
  { id: "ACI-0002", nom: "TOURÉ", prenoms: "Aminata", dateNaissance: "22/08/1990", lieuNaissance: "Man", sexe: "F", nationalite: "Ivoirienne", taille: "1.65", profession: "Couturière", domicile: "Yopougon, Abidjan", statut: "en_production", paiement1: true, paiement2: false, commercial: "OUATTARA Moussa", dateEnregistrement: "2026-01-20", telephone: "0501020304", operateur: "MTN MoMo" },
  { id: "ACI-0003", nom: "DIABATÉ", prenoms: "Seydou", dateNaissance: "05/12/1978", lieuNaissance: "Korhogo", sexe: "M", nationalite: "Ivoirienne", taille: "1.78", profession: "Maçon", domicile: "Cocody, Abidjan", statut: "enregistré", paiement1: true, paiement2: false, commercial: "BAMBA Lassina", dateEnregistrement: "2026-02-01", telephone: "0102030405", operateur: "Wave" },
  { id: "ACI-0004", nom: "SORO", prenoms: "Fatoumata", dateNaissance: "18/06/1992", lieuNaissance: "Daloa", sexe: "F", nationalite: "Ivoirienne", taille: "1.60", profession: "Commerçante", domicile: "Marcory, Abidjan", statut: "livré", paiement1: true, paiement2: true, commercial: "BAMBA Lassina", dateEnregistrement: "2026-02-05", telephone: "0704050607", operateur: "Orange Money" },
  { id: "ACI-0005", nom: "N'GUESSAN", prenoms: "Kouamé Paul", dateNaissance: "30/01/1988", lieuNaissance: "Yamoussoukro", sexe: "M", nationalite: "Ivoirienne", taille: "1.75", profession: "Électricien", domicile: "Plateau, Abidjan", statut: "en_production", paiement1: true, paiement2: false, commercial: "OUATTARA Moussa", dateEnregistrement: "2026-02-10", telephone: "0508091011", operateur: "MTN MoMo" },
  { id: "ACI-0006", nom: "YAPI", prenoms: "Adjoua Marie", dateNaissance: "12/09/1995", lieuNaissance: "Abengourou", sexe: "F", nationalite: "Ivoirienne", taille: "1.58", profession: "Coiffeuse", domicile: "Treichville, Abidjan", statut: "enregistré", paiement1: true, paiement2: false, commercial: "OUATTARA Moussa", dateEnregistrement: "2026-02-15", telephone: "0103040506", operateur: "Wave" },
  { id: "ACI-0007", nom: "KOFFI", prenoms: "Ange", dateNaissance: "03/04/1980", lieuNaissance: "San-Pédro", sexe: "M", nationalite: "Ivoirienne", taille: "1.80", profession: "Soudeur", domicile: "Adjamé, Abidjan", statut: "livré", paiement1: true, paiement2: true, commercial: "BAMBA Lassina", dateEnregistrement: "2026-02-18", telephone: "0706070809", operateur: "Orange Money" },
  { id: "ACI-0008", nom: "OUÉDRAOGO", prenoms: "Salimata", dateNaissance: "25/11/1987", lieuNaissance: "Abidjan", sexe: "F", nationalite: "Burkinabè", taille: "1.63", profession: "Vendeuse", domicile: "Koumassi, Abidjan", statut: "enregistré", paiement1: true, paiement2: false, commercial: "BAMBA Lassina", dateEnregistrement: "2026-02-22", telephone: "0509101112", operateur: "MTN MoMo" },
];

export const mockStats = {
  totalBeneficiaires: 1247,
  enregistresAujourdhui: 23,
  enregistresSemaine: 156,
  enregistresMois: 487,
  cartesEnProduction: 312,
  cartesLivrees: 845,
  paiementsRecus: 4235000,
  commerciauxActifs: 34,
};

export const mockMetiers = {
  "Commerce": ["Commerçant(e)", "Vendeur(se)", "Grossiste", "Détaillant(e)"],
  "BTP": ["Maçon", "Menuisier", "Électricien", "Plombier", "Peintre", "Carreleur", "Soudeur"],
  "Artisanat": ["Couturier(ère)", "Coiffeur(se)", "Bijoutier(ère)", "Tapissier(ère)"],
  "Transport": ["Chauffeur", "Conducteur de taxi", "Livreur"],
  "Restauration": ["Restaurateur(trice)", "Boulanger(ère)", "Pâtissier(ère)"],
  "Agriculture": ["Agriculteur(trice)", "Éleveur(se)", "Pêcheur"],
  "Santé": ["Tradipraticien(ne)", "Herboriste"],
};

export const mockGeographie = {
  districts: [
    { id: "d1", nom: "District Autonome d'Abidjan", actif: true },
    { id: "d2", nom: "District Autonome de Yamoussoukro", actif: true },
    { id: "d3", nom: "District des Lagunes", actif: true },
    { id: "d4", nom: "District de la Vallée du Bandama", actif: false },
  ],
  regions: [
    { id: "r1", nom: "Région des Lagunes", districtId: "d1", actif: true },
    { id: "r2", nom: "Région de l'Agnéby-Tiassa", districtId: "d1", actif: true },
    { id: "r3", nom: "Région du Bélier", districtId: "d2", actif: true },
  ],
  departements: [
    { id: "dep1", nom: "Département d'Abidjan", regionId: "r1", actif: true },
    { id: "dep2", nom: "Département de Bingerville", regionId: "r1", actif: true },
    { id: "dep3", nom: "Département d'Agboville", regionId: "r2", actif: true },
  ],
};

export const mockChartData = [
  { mois: "Sep", enregistrements: 45 },
  { mois: "Oct", enregistrements: 78 },
  { mois: "Nov", enregistrements: 125 },
  { mois: "Déc", enregistrements: 189 },
  { mois: "Jan", enregistrements: 256 },
  { mois: "Fév", enregistrements: 487 },
];
