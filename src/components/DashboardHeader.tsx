import { useAuth, roleLabels } from "@/contexts/AuthContext";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Bell, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { isOnline, pendingCount, isSyncing, triggerSync } = useOfflineSync();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shadow-card">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <div className="hidden sm:block cursor-pointer" onClick={() => navigate("/dashboard/profil")}>
          <h2 className="text-sm font-semibold text-foreground hover:text-primary transition-colors">{user?.prenoms} {user?.nom}</h2>
          <p className="text-xs text-muted-foreground">{user ? roleLabels[user.role] : ""}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Online/Offline indicator */}
        <div className="flex items-center gap-1">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-success" />
          ) : (
            <WifiOff className="h-4 w-4 text-destructive" />
          )}
          {pendingCount > 0 && (
            <Button variant="ghost" size="sm" onClick={triggerSync} disabled={isSyncing || !isOnline} className="text-xs">
              <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? "animate-spin" : ""}`} />
              {pendingCount}
            </Button>
          )}
        </div>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 min-w-4 p-0 flex items-center justify-center text-[10px] gradient-primary text-primary-foreground border-0">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <h4 className="font-semibold text-sm">Notifications</h4>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllAsRead}>
                  Tout marquer lu
                </Button>
              )}
            </div>
            <ScrollArea className="max-h-80">
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4 text-center">Aucune notification</p>
              ) : (
                notifications.slice(0, 20).map(n => (
                  <div
                    key={n.id}
                    className={`p-3 border-b border-border cursor-pointer hover:bg-muted/50 ${!n.read ? "bg-primary/5" : ""}`}
                    onClick={() => markAsRead(n.id)}
                  >
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                ))
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
          <LogOut className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Déconnexion</span>
        </Button>
      </div>
    </header>
  );
}
