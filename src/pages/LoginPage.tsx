import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import aciLogo from "@/assets/aci-logo.jpeg";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate("/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setIsLoading(true);
    try {
      await login(username.trim(), password);
      navigate("/dashboard");
    } catch (err: any) {
      toast({
        title: "Erreur de connexion",
        description: err.message || "Identifiants incorrects",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex gradient-hero">
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12">
        <div className="text-center animate-fade-in">
          <img src={aciLogo} alt="ACI" className="w-64 h-64 mx-auto mb-8 object-contain drop-shadow-2xl rounded-xl" />
          <h1 className="text-4xl font-bold text-primary-foreground mb-1">ACI</h1>
          <p className="text-xl text-sidebar-foreground/80 font-medium mb-2">Association des Commerciaux Ivoiriens</p>
          <p className="text-base text-sidebar-foreground/60 max-w-md mx-auto">
            Plateforme de Gestion des Cartes de Travail — République de Côte d'Ivoire
          </p>
          <div className="mt-8 flex gap-3 justify-center">
            {["Enregistrement", "Paiement", "Livraison"].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <span className="text-sidebar-foreground text-sm font-medium">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <Card className="w-full max-w-md shadow-elevated border-0 animate-fade-in">
          <CardContent className="p-8">
            <div className="lg:hidden flex flex-col items-center mb-6">
              <img src={aciLogo} alt="ACI" className="w-20 h-20 object-contain rounded-lg" />
              <span className="text-lg font-bold text-foreground mt-2">ACI</span>
            </div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground">Connexion</h2>
              <p className="text-muted-foreground mt-1">Connectez-vous avec votre nom d'utilisateur</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <Input id="username" type="text" placeholder="votre_nom_utilisateur" value={username} onChange={(e) => setUsername(e.target.value)} required className="h-11" autoComplete="username" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11 pr-10" autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-11 gradient-primary font-semibold" disabled={isLoading}>
                <LogIn className="mr-2 h-4 w-4" />
                {isLoading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/inscription" className="text-sm text-primary hover:underline font-medium">
                Pas encore de compte ? S'inscrire
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
