export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          target_id: string | null
          target_type: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      beneficiaires: {
        Row: {
          categorie_metier: string | null
          commercial_id: string | null
          contact_secondaire: string | null
          created_at: string
          date_naissance: string
          departement_id: string | null
          district_id: string | null
          domicile: string
          id: string
          lieu_naissance: string
          local_id: string | null
          matricule: string
          nationalite: string
          nom: string
          numero_mobile_money: string | null
          operateur_mobile_money: string | null
          photo_url: string | null
          prenoms: string
          profession: string
          rccm: string | null
          region_id: string | null
          sexe: string
          sous_prefecture_id: string | null
          status: Database["public"]["Enums"]["beneficiaire_status"]
          synced: boolean
          taille: number | null
          telephone: string
          updated_at: string
          village_id: string | null
        }
        Insert: {
          categorie_metier?: string | null
          commercial_id?: string | null
          contact_secondaire?: string | null
          created_at?: string
          date_naissance: string
          departement_id?: string | null
          district_id?: string | null
          domicile: string
          id?: string
          lieu_naissance: string
          local_id?: string | null
          matricule: string
          nationalite?: string
          nom: string
          numero_mobile_money?: string | null
          operateur_mobile_money?: string | null
          photo_url?: string | null
          prenoms: string
          profession: string
          rccm?: string | null
          region_id?: string | null
          sexe?: string
          sous_prefecture_id?: string | null
          status?: Database["public"]["Enums"]["beneficiaire_status"]
          synced?: boolean
          taille?: number | null
          telephone: string
          updated_at?: string
          village_id?: string | null
        }
        Update: {
          categorie_metier?: string | null
          commercial_id?: string | null
          contact_secondaire?: string | null
          created_at?: string
          date_naissance?: string
          departement_id?: string | null
          district_id?: string | null
          domicile?: string
          id?: string
          lieu_naissance?: string
          local_id?: string | null
          matricule?: string
          nationalite?: string
          nom?: string
          numero_mobile_money?: string | null
          operateur_mobile_money?: string | null
          photo_url?: string | null
          prenoms?: string
          profession?: string
          rccm?: string | null
          region_id?: string | null
          sexe?: string
          sous_prefecture_id?: string | null
          status?: Database["public"]["Enums"]["beneficiaire_status"]
          synced?: boolean
          taille?: number | null
          telephone?: string
          updated_at?: string
          village_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "beneficiaires_departement_id_fkey"
            columns: ["departement_id"]
            isOneToOne: false
            referencedRelation: "departements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beneficiaires_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beneficiaires_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beneficiaires_sous_prefecture_id_fkey"
            columns: ["sous_prefecture_id"]
            isOneToOne: false
            referencedRelation: "sous_prefectures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beneficiaires_village_id_fkey"
            columns: ["village_id"]
            isOneToOne: false
            referencedRelation: "villages"
            referencedColumns: ["id"]
          },
        ]
      }
      cartes: {
        Row: {
          beneficiaire_id: string
          confirme_par: string | null
          created_at: string
          date_confirmation: string | null
          date_expedition: string | null
          date_livraison: string | null
          date_production: string | null
          id: string
          livre_par: string | null
          notes: string | null
          numero_carte: string | null
          signature_beneficiaire: string | null
          signature_commercial: string | null
          status: Database["public"]["Enums"]["card_status"]
          updated_at: string
        }
        Insert: {
          beneficiaire_id: string
          confirme_par?: string | null
          created_at?: string
          date_confirmation?: string | null
          date_expedition?: string | null
          date_livraison?: string | null
          date_production?: string | null
          id?: string
          livre_par?: string | null
          notes?: string | null
          numero_carte?: string | null
          signature_beneficiaire?: string | null
          signature_commercial?: string | null
          status?: Database["public"]["Enums"]["card_status"]
          updated_at?: string
        }
        Update: {
          beneficiaire_id?: string
          confirme_par?: string | null
          created_at?: string
          date_confirmation?: string | null
          date_expedition?: string | null
          date_livraison?: string | null
          date_production?: string | null
          id?: string
          livre_par?: string | null
          notes?: string | null
          numero_carte?: string | null
          signature_beneficiaire?: string | null
          signature_commercial?: string | null
          status?: Database["public"]["Enums"]["card_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cartes_beneficiaire_id_fkey"
            columns: ["beneficiaire_id"]
            isOneToOne: true
            referencedRelation: "beneficiaires"
            referencedColumns: ["id"]
          },
        ]
      }
      departements: {
        Row: {
          actif: boolean
          created_at: string
          id: string
          nom: string
          region_id: string
        }
        Insert: {
          actif?: boolean
          created_at?: string
          id?: string
          nom: string
          region_id: string
        }
        Update: {
          actif?: boolean
          created_at?: string
          id?: string
          nom?: string
          region_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "departements_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      districts: {
        Row: {
          actif: boolean
          created_at: string
          id: string
          nom: string
        }
        Insert: {
          actif?: boolean
          created_at?: string
          id?: string
          nom: string
        }
        Update: {
          actif?: boolean
          created_at?: string
          id?: string
          nom?: string
        }
        Relationships: []
      }
      matricule_sequence: {
        Row: {
          id: number
          last_value: number
        }
        Insert: {
          id?: number
          last_value?: number
        }
        Update: {
          id?: number
          last_value?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      paiements: {
        Row: {
          beneficiaire_id: string
          collected_by: string | null
          created_at: string
          id: string
          id_transaction: string | null
          methode: string | null
          montant: number
          paid_at: string | null
          preuve_url: string | null
          reference_wave: string | null
          status: Database["public"]["Enums"]["payment_status"]
          telephone_payeur: string | null
          type_paiement: string
          updated_at: string
        }
        Insert: {
          beneficiaire_id: string
          collected_by?: string | null
          created_at?: string
          id?: string
          id_transaction?: string | null
          methode?: string | null
          montant: number
          paid_at?: string | null
          preuve_url?: string | null
          reference_wave?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          telephone_payeur?: string | null
          type_paiement?: string
          updated_at?: string
        }
        Update: {
          beneficiaire_id?: string
          collected_by?: string | null
          created_at?: string
          id?: string
          id_transaction?: string | null
          methode?: string | null
          montant?: number
          paid_at?: string | null
          preuve_url?: string | null
          reference_wave?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          telephone_payeur?: string | null
          type_paiement?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "paiements_beneficiaire_id_fkey"
            columns: ["beneficiaire_id"]
            isOneToOne: false
            referencedRelation: "beneficiaires"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cni_recto_url: string | null
          cni_verso_url: string | null
          created_at: string
          departement: string | null
          district: string | null
          email: string
          id: string
          nom: string
          photo_url: string | null
          prenoms: string
          region: string | null
          sous_prefecture: string | null
          status: Database["public"]["Enums"]["user_status"]
          telephone: string | null
          updated_at: string
          username: string
        }
        Insert: {
          cni_recto_url?: string | null
          cni_verso_url?: string | null
          created_at?: string
          departement?: string | null
          district?: string | null
          email?: string
          id: string
          nom?: string
          photo_url?: string | null
          prenoms?: string
          region?: string | null
          sous_prefecture?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          telephone?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          cni_recto_url?: string | null
          cni_verso_url?: string | null
          created_at?: string
          departement?: string | null
          district?: string | null
          email?: string
          id?: string
          nom?: string
          photo_url?: string | null
          prenoms?: string
          region?: string | null
          sous_prefecture?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          telephone?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      regions: {
        Row: {
          actif: boolean
          created_at: string
          district_id: string
          id: string
          nom: string
        }
        Insert: {
          actif?: boolean
          created_at?: string
          district_id: string
          id?: string
          nom: string
        }
        Update: {
          actif?: boolean
          created_at?: string
          district_id?: string
          id?: string
          nom?: string
        }
        Relationships: [
          {
            foreignKeyName: "regions_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      sous_prefectures: {
        Row: {
          actif: boolean
          created_at: string
          departement_id: string
          id: string
          nom: string
        }
        Insert: {
          actif?: boolean
          created_at?: string
          departement_id: string
          id?: string
          nom: string
        }
        Update: {
          actif?: boolean
          created_at?: string
          departement_id?: string
          id?: string
          nom?: string
        }
        Relationships: [
          {
            foreignKeyName: "sous_prefectures_departement_id_fkey"
            columns: ["departement_id"]
            isOneToOne: false
            referencedRelation: "departements"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          records_failed: number
          records_synced: number
          status: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          records_failed?: number
          records_synced?: number
          status?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          records_failed?: number
          records_synced?: number
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      team_assignments: {
        Row: {
          assigned_by: string | null
          chef_equipe_id: string
          commercial_id: string
          created_at: string
          id: string
        }
        Insert: {
          assigned_by?: string | null
          chef_equipe_id: string
          commercial_id: string
          created_at?: string
          id?: string
        }
        Update: {
          assigned_by?: string | null
          chef_equipe_id?: string
          commercial_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      villages: {
        Row: {
          actif: boolean
          created_at: string
          id: string
          nom: string
          sous_prefecture_id: string
          type: string
        }
        Insert: {
          actif?: boolean
          created_at?: string
          id?: string
          nom: string
          sous_prefecture_id: string
          type?: string
        }
        Update: {
          actif?: boolean
          created_at?: string
          id?: string
          nom?: string
          sous_prefecture_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "villages_sous_prefecture_id_fkey"
            columns: ["sous_prefecture_id"]
            isOneToOne: false
            referencedRelation: "sous_prefectures"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_assignments: {
        Row: {
          assigned_by: string | null
          created_at: string
          departement_id: string | null
          district_id: string | null
          id: string
          region_id: string | null
          sous_prefecture_id: string | null
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          departement_id?: string | null
          district_id?: string | null
          id?: string
          region_id?: string | null
          sous_prefecture_id?: string | null
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          departement_id?: string | null
          district_id?: string | null
          id?: string
          region_id?: string | null
          sous_prefecture_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_assignments_departement_id_fkey"
            columns: ["departement_id"]
            isOneToOne: false
            referencedRelation: "departements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_assignments_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_assignments_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_assignments_sous_prefecture_id_fkey"
            columns: ["sous_prefecture_id"]
            isOneToOne: false
            referencedRelation: "sous_prefectures"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_matricule: { Args: never; Returns: string }
      get_email_by_username: { Args: { _username: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_any_admin_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      send_notification: {
        Args: {
          _data?: Json
          _message: string
          _title: string
          _type: Database["public"]["Enums"]["notification_type"]
          _user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "dg"
        | "assistante_dg"
        | "comptable"
        | "manager_national"
        | "responsable_commercial"
        | "chef_equipe"
        | "commercial"
      beneficiaire_status: "enregistre" | "en_production" | "livre"
      card_status:
        | "en_production"
        | "pret"
        | "en_livraison"
        | "livre"
        | "confirme"
      notification_type:
        | "nouvel_enregistrement"
        | "paiement_recu"
        | "validation_compte"
        | "carte_prete"
        | "carte_livree"
        | "nouveau_utilisateur"
        | "system"
      payment_status: "en_attente" | "paye" | "echoue" | "rembourse"
      user_status: "actif" | "en_attente" | "suspendu" | "refuse"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "dg",
        "assistante_dg",
        "comptable",
        "manager_national",
        "responsable_commercial",
        "chef_equipe",
        "commercial",
      ],
      beneficiaire_status: ["enregistre", "en_production", "livre"],
      card_status: [
        "en_production",
        "pret",
        "en_livraison",
        "livre",
        "confirme",
      ],
      notification_type: [
        "nouvel_enregistrement",
        "paiement_recu",
        "validation_compte",
        "carte_prete",
        "carte_livree",
        "nouveau_utilisateur",
        "system",
      ],
      payment_status: ["en_attente", "paye", "echoue", "rembourse"],
      user_status: ["actif", "en_attente", "suspendu", "refuse"],
    },
  },
} as const
