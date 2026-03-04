import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { cacheAuthCredentials, verifyOfflineCredentials } from "@/lib/offlineDB";
import { fullSync } from "@/lib/syncEngine";

export type UserRole = "super_admin" | "dg" | "assistante_dg" | "comptable" | "manager_national" | "responsable_commercial" | "chef_equipe" | "commercial";

export interface User {
  id: string;
  nom: string;
  prenoms: string;
  username: string;
  email: string;
  telephone: string;
  role: UserRole;
  photo_url?: string;
  district?: string;
  region?: string;
  departement?: string;
  sous_prefecture?: string;
  status: "actif" | "en_attente" | "suspendu" | "refuse";
}

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOffline: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
}

export interface SignupData {
  username: string;
  nom: string;
  prenoms: string;
  email: string;
  telephone: string;
  password: string;
  role_souhaite: UserRole;
  district?: string;
  region?: string;
  departement?: string;
  sous_prefecture?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const fetchUserProfile = async (supaUser: SupabaseUser) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", supaUser.id)
        .single();

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", supaUser.id)
        .limit(1)
        .single();

      if (profile) {
        const userData: User = {
          id: profile.id,
          nom: profile.nom,
          prenoms: profile.prenoms,
          username: profile.username,
          email: profile.email,
          telephone: profile.telephone || "",
          role: (roleData?.role as UserRole) || "commercial",
          photo_url: profile.photo_url,
          district: profile.district,
          region: profile.region,
          departement: profile.departement,
          sous_prefecture: profile.sous_prefecture,
          status: profile.status as any,
        };
        setUser(userData);
        return userData;
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
    return null;
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        setTimeout(() => fetchUserProfile(session.user), 0);
      } else {
        setSupabaseUser(null);
        setUser(null);
      }
      setIsLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        fetchUserProfile(session.user);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (!isOffline && user) {
      fullSync(user.id).catch(console.error);
    }
  }, [isOffline, user]);

  // Periodic sync every 60s when online
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      if (navigator.onLine) {
        fullSync(user.id).catch(console.error);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const login = async (username: string, password: string) => {
    if (!navigator.onLine) {
      // Offline login
      const cachedUser = await verifyOfflineCredentials(username, password);
      if (!cachedUser) {
        throw new Error("Connexion hors ligne impossible : identifiants non trouvés dans le cache local");
      }
      if (cachedUser.status !== "actif") {
        throw new Error("Compte non actif");
      }
      setUser(cachedUser);
      setIsLoading(false);
      return;
    }

    // Online login
    const { data: email, error: lookupError } = await supabase
      .rpc("get_email_by_username", { _username: username });

    if (lookupError || !email) {
      throw new Error("Nom d'utilisateur introuvable");
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message === "Invalid login credentials" ? "Mot de passe incorrect" : error.message);

    // Cache credentials for offline use after successful login
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const userData = await fetchUserProfile(session.user);
      if (userData) {
        await cacheAuthCredentials(username, password, userData);
        // Trigger initial sync
        fullSync(userData.id).catch(console.error);
      }
    }
  };

  const logout = async () => {
    if (navigator.onLine) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSupabaseUser(null);
  };

  const signup = async (data: SignupData) => {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          username: data.username,
          nom: data.nom,
          prenoms: data.prenoms,
          telephone: data.telephone,
        },
      },
    });

    if (error) throw error;

    const { data: session } = await supabase.auth.getSession();
    if (session?.session?.user) {
      await supabase.from("profiles").update({
        district: data.district,
        region: data.region,
        departement: data.departement,
        sous_prefecture: data.sous_prefecture,
      }).eq("id", session.session.user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, supabaseUser, isAuthenticated: !!user, isLoading, isOffline, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export const roleLabels: Record<UserRole, string> = {
  super_admin: "Super Admin",
  dg: "Directeur Général",
  assistante_dg: "Assistante DG",
  comptable: "Comptable",
  manager_national: "Manager Commercial National",
  responsable_commercial: "Responsable Commercial (R Com)",
  chef_equipe: "Chef d'équipe",
  commercial: "Commercial",
};

export const roleHierarchy: UserRole[] = [
  "super_admin", "dg", "assistante_dg", "comptable", 
  "manager_national", "responsable_commercial", "chef_equipe", "commercial"
];

export function canManageRole(currentRole: UserRole, targetRole: UserRole): boolean {
  return roleHierarchy.indexOf(currentRole) < roleHierarchy.indexOf(targetRole);
}

export function isAdmin(role: UserRole): boolean {
  return ["super_admin", "dg", "assistante_dg"].includes(role);
}
