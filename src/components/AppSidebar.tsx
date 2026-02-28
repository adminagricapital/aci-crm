import { useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, UserPlus, CreditCard, FileText, Settings, MapPin, Briefcase, BarChart3, Truck,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth, roleLabels, UserRole } from "@/contexts/AuthContext";
import aciLogo from "@/assets/aci-logo.jpeg";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { title: "Tableau de bord", url: "/dashboard", icon: LayoutDashboard, roles: ["super_admin", "dg", "assistante_dg", "comptable", "manager_national", "responsable_commercial", "chef_equipe", "commercial"] },
  { title: "Enregistrer", url: "/dashboard/enregistrer", icon: UserPlus, roles: ["super_admin", "commercial", "chef_equipe", "dg", "assistante_dg", "manager_national"] },
  { title: "Bénéficiaires", url: "/dashboard/beneficiaires", icon: Users, roles: ["super_admin", "dg", "assistante_dg", "manager_national", "responsable_commercial", "chef_equipe", "commercial"] },
  { title: "Paiements", url: "/dashboard/paiements", icon: CreditCard, roles: ["super_admin", "dg", "assistante_dg", "comptable", "manager_national"] },
  { title: "Distribution Cartes", url: "/dashboard/cartes", icon: Truck, roles: ["super_admin", "dg", "assistante_dg", "manager_national", "responsable_commercial", "chef_equipe"] },
  { title: "Utilisateurs", url: "/dashboard/utilisateurs", icon: Briefcase, roles: ["super_admin", "dg", "assistante_dg"] },
  { title: "Zones", url: "/dashboard/zones", icon: MapPin, roles: ["super_admin", "dg", "assistante_dg", "manager_national"] },
  { title: "Rapports", url: "/dashboard/rapports", icon: BarChart3, roles: ["super_admin", "dg", "assistante_dg", "comptable", "manager_national"] },
  { title: "Export PDF", url: "/dashboard/export", icon: FileText, roles: ["super_admin", "dg", "assistante_dg", "manager_national"] },
  { title: "Paramètres", url: "/dashboard/parametres", icon: Settings, roles: ["super_admin", "dg", "assistante_dg"] },
];

export function AppSidebar() {
  const { user } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const visibleItems = navItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="pt-4">
        <div className="flex items-center gap-3 px-4 mb-6">
          <img src={aciLogo} alt="ACI" className="w-9 h-9 object-contain rounded-md" />
          {!collapsed && (
            <div className="animate-slide-in-left">
              <span className="font-bold text-sm text-sidebar-primary-foreground">ACI</span>
              <p className="text-[10px] text-sidebar-foreground/60">Cartes de Travail — RCI</p>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <NavLink to={item.url} end className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="h-4 w-4 mr-2" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!collapsed && user && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-sidebar-foreground">{user.prenoms} {user.nom}</p>
            <p className="text-[10px] text-sidebar-foreground/60">{roleLabels[user.role]}</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
