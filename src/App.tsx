import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import InscriptionPage from "./pages/InscriptionPage";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardOverview from "./pages/DashboardOverview";
import BeneficiairesPage from "./pages/BeneficiairesPage";
import BeneficiaireDetailPage from "./pages/BeneficiaireDetailPage";
import EnregistrementPage from "./pages/EnregistrementPage";
import PaiementsPage from "./pages/PaiementsPage";
import UtilisateursPage from "./pages/UtilisateursPage";
import ZonesPage from "./pages/ZonesPage";
import ExportPDFPage from "./pages/ExportPDFPage";
import ExportCSVPage from "./pages/ExportCSVPage";
import CartesDistributionPage from "./pages/CartesDistributionPage";
import ProfilPage from "./pages/ProfilPage";
import JournalPage from "./pages/JournalPage";
import GuidePage from "./pages/GuidePage";
import { RapportsPage, ParametresPage } from "./pages/PlaceholderPages";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/inscription" element={<InscriptionPage />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardOverview />} />
              <Route path="beneficiaires" element={<BeneficiairesPage />} />
              <Route path="beneficiaires/:id" element={<BeneficiaireDetailPage />} />
              <Route path="enrolement" element={<EnregistrementPage />} />
              {/* Legacy route redirect */}
              <Route path="enregistrer" element={<EnregistrementPage />} />
              <Route path="paiements" element={<PaiementsPage />} />
              <Route path="cartes" element={<CartesDistributionPage />} />
              <Route path="utilisateurs" element={<UtilisateursPage />} />
              <Route path="zones" element={<ZonesPage />} />
              <Route path="journal" element={<JournalPage />} />
              <Route path="rapports" element={<RapportsPage />} />
              <Route path="export" element={<ExportPDFPage />} />
              <Route path="export-csv" element={<ExportCSVPage />} />
              <Route path="guide" element={<GuidePage />} />
              <Route path="parametres" element={<ParametresPage />} />
              <Route path="profil" element={<ProfilPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
