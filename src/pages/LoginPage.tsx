import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff, LogIn, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import aciLogo from "@/assets/aci-logo.jpeg";

function generateCaptcha() {
  const ops = ["+", "-", "×"] as const;
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a: number, b: number, answer: number;
  switch (op) {
    case "+":
      a = Math.floor(Math.random() * 50) + 1;
      b = Math.floor(Math.random() * 50) + 1;
      answer = a + b;
      break;
    case "-":
      a = Math.floor(Math.random() * 50) + 10;
      b = Math.floor(Math.random() * a) + 1;
      answer = a - b;
      break;
    case "×":
      a = Math.floor(Math.random() * 12) + 1;
      b = Math.floor(Math.random() * 12) + 1;
      answer = a * b;
      break;
  }
  return { question: `${a} ${op} ${b}`, answer };
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 120;

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [captcha, setCaptcha] = useState(generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, navigate]);

  // Lockout countdown
  useEffect(() => {
    if (!lockoutUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
      setLockoutRemaining(remaining);
      if (remaining <= 0) {
        setLockoutUntil(null);
        setAttempts(0);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const refreshCaptcha = useCallback(() => {
    setCaptcha(generateCaptcha());
    setCaptchaInput("");
  }, []);

  const isLockedOut = lockoutUntil !== null && Date.now() < lockoutUntil;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut) return;
    if (!username.trim() || !password.trim()) return;

    // Validate captcha
    if (parseInt(captchaInput) !== captcha.answer) {
      toast({ title: "Captcha incorrect", description: "Veuillez résoudre le calcul correctement", variant: "destructive" });
      refreshCaptcha();
      return;
    }

    setIsLoading(true);
    try {
      await login(username.trim(), password);
      navigate("/dashboard");
    } catch (err: any) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      refreshCaptcha();

      if (newAttempts >= MAX_ATTEMPTS) {
        setLockoutUntil(Date.now() + LOCKOUT_SECONDS * 1000);
        setLockoutRemaining(LOCKOUT_SECONDS);
        toast({
          title: "Compte verrouillé temporairement",
          description: `Trop de tentatives. Réessayez dans ${LOCKOUT_SECONDS} secondes.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur de connexion",
          description: `${err.message || "Identifiants incorrects"} (${MAX_ATTEMPTS - newAttempts} tentative(s) restante(s))`,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated) return null;

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
                <Input id="username" type="text" placeholder="votre_nom_utilisateur" value={username} onChange={(e) => setUsername(e.target.value)} required className="h-11" autoComplete="username" disabled={isLockedOut} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11 pr-10" autoComplete="current-password" disabled={isLockedOut} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Math CAPTCHA */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Vérification de sécurité
                </Label>
                <div className="flex items-center gap-3">
                  <div className="bg-muted rounded-lg px-4 py-2 font-mono text-lg font-bold text-foreground select-none min-w-[120px] text-center">
                    {captcha.question} = ?
                  </div>
                  <Input
                    type="number"
                    placeholder="Réponse"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    required
                    className="h-11 w-28"
                    disabled={isLockedOut}
                  />
                  <Button type="button" variant="ghost" size="sm" onClick={refreshCaptcha} className="text-xs text-muted-foreground">
                    ↻
                  </Button>
                </div>
              </div>

              {isLockedOut && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg text-center font-medium">
                  Compte verrouillé. Réessayez dans {lockoutRemaining}s
                </div>
              )}

              <Button type="submit" className="w-full h-11 gradient-primary font-semibold" disabled={isLoading || isLockedOut}>
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
