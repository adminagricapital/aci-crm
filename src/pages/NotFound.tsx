import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import aciLogo from "@/assets/aci-logo.jpeg";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <img src={aciLogo} alt="ACI" className="w-20 h-20 mx-auto mb-6 rounded-lg object-contain" />
        <h1 className="mb-2 text-5xl font-bold text-foreground">404</h1>
        <p className="mb-6 text-lg text-muted-foreground">Page introuvable</p>
        <Link to="/" className="inline-flex items-center px-6 py-3 rounded-lg gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
