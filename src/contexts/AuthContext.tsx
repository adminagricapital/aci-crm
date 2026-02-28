import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

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
        setUser({
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
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
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

  const login = async (username: string, password: string) => {
    // First find email by username
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("username", username)
      .single();

    if (!profile) {
      throw new Error("Nom d'utilisateur introuvable");
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password,
    });

    if (error) throw new Error(error.message === "Invalid login credentials" ? "Mot de passe incorrect" : error.message);
  };

  const logout = async () => {
    await supabase.auth.signOut();
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

    // Update profile with extra fields after signup
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
    <AuthContext.Provider value={{ user, supabaseUser, isAuthenticated: !!user, isLoading, login, logout, signup }}>
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
