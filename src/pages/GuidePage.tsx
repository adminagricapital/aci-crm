import { Card, CardContent } from "@/components/ui/card";
import { useAuth, roleLabels, UserRole } from "@/contexts/AuthContext";
import { BookOpen, CheckCircle } from "lucide-react";

const guides: Record<UserRole, { title: string; sections: { heading: string; steps: string[] }[] }> = {
  commercial: {
    title: "Guide du Commercial",
    sections: [
      { heading: "Enregistrer un bénéficiaire", steps: ["Aller dans 'Enregistrer'", "Remplir les champs d'identité et prendre la photo", "Saisir le métier et la localisation", "Entrer les contacts principal et secondaire", "Soumettre le formulaire", "Vous serez redirigé vers la fiche du bénéficiaire", "Cliquer sur 'Payer 1 000 FCFA' pour le premier paiement"] },
      { heading: "Livrer une carte", steps: ["Aller dans 'Bénéficiaires'", "Ouvrir la fiche du bénéficiaire", "Cliquer sur 'Payer 3 000 FCFA' (frais de livraison)", "Après confirmation du paiement, cliquer sur 'Valider la livraison'", "Signer dans la zone 'Signature du commercial'", "Faire signer le bénéficiaire dans sa zone", "Confirmer la livraison"] },
      { heading: "Mode hors ligne", steps: ["Tous vos bénéficiaires assignés sont disponibles hors ligne", "Vous pouvez enregistrer de nouveaux bénéficiaires sans réseau", "Les données seront synchronisées automatiquement au retour du réseau"] },
    ],
  },
  chef_equipe: {
    title: "Guide du Chef d'équipe",
    sections: [
      { heading: "Gérer votre équipe", steps: ["Consultez le tableau de bord pour voir les performances", "Suivez les enregistrements de vos commerciaux", "Vérifiez les paiements en attente"] },
      { heading: "Enregistrement & Livraison", steps: ["Même fonctionnalités que le commercial", "Accès aux statistiques de votre zone"] },
    ],
  },
  responsable_commercial: {
    title: "Guide du Responsable Commercial",
    sections: [
      { heading: "Supervision", steps: ["Tableau de bord avec vue d'ensemble de votre zone", "Suivi des performances par chef d'équipe", "Distribution des cartes dans votre zone"] },
    ],
  },
  manager_national: {
    title: "Guide du Manager Commercial National",
    sections: [
      { heading: "Vue nationale", steps: ["Tableau de bord avec toutes les statistiques nationales", "Gestion des zones géographiques", "Rapports et exports"] },
    ],
  },
  comptable: {
    title: "Guide du Comptable",
    sections: [
      { heading: "Gestion financière", steps: ["Consultez les paiements dans 'Paiements'", "Exportez les données en CSV pour la comptabilité", "Suivez les paiements en attente et les montants collectés"] },
    ],
  },
  assistante_dg: {
    title: "Guide de l'Assistante DG",
    sections: [
      { heading: "Administration", steps: ["Validez les nouveaux comptes dans 'Utilisateurs'", "Consultez le journal d'activité", "Gérez les zones géographiques", "Exportez les cartes en PDF et les données en CSV"] },
    ],
  },
  dg: {
    title: "Guide du Directeur Général",
    sections: [
      { heading: "Supervision générale", steps: ["Tableau de bord complet avec toutes les métriques", "Validation des comptes utilisateurs", "Accès à tous les rapports et exports", "Journal d'activité pour la traçabilité"] },
    ],
  },
  super_admin: {
    title: "Guide Complet — Super Admin",
    sections: [
      { heading: "Administration complète", steps: ["Gestion de tous les utilisateurs et rôles", "Suppression et modification des bénéficiaires", "Gestion des zones (districts, régions, départements...)", "Journal d'activité complet", "Tous les exports (PDF, CSV)", "Paramètres de l'application"] },
      { heading: "Sécurité", steps: ["Seul le Super Admin peut supprimer des utilisateurs", "Seul le Super Admin peut modifier les données des bénéficiaires", "Seul le Super Admin peut supprimer des bénéficiaires", "Toutes les actions sont tracées dans le journal"] },
    ],
  },
};

const GuidePage = () => {
  const { user } = useAuth();
  const role = user?.role || "commercial";
  const guide = guides[role];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BookOpen className="h-6 w-6" /> {guide.title}
        </h1>
        <p className="text-muted-foreground">Connecté en tant que {roleLabels[role]}</p>
      </div>

      {guide.sections.map((section, si) => (
        <Card key={si} className="shadow-card">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">{section.heading}</h3>
            <ol className="space-y-2">
              {section.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default GuidePage;
