import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Users,
  BarChart3,
  History,
  Settings,
  ClipboardList,
  Shield,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useSurvey } from '@/context/SurveyContext';
import { UserRole, ROLE_PERMISSIONS } from '@/types/survey';

type PermissionKey = keyof typeof ROLE_PERMISSIONS.super_admin;

interface NavItem {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  permission: PermissionKey;
}

const mainNavItems: NavItem[] = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard, permission: 'canViewDashboard' },
  { title: 'Surveys', url: '/surveys', icon: FileText, permission: 'canViewDashboard' },
  { title: 'Create Survey', url: '/surveys/create', icon: PlusCircle, permission: 'canCreateSurvey' },
];

const operationsItems: NavItem[] = [
  { title: 'Targets', url: '/targets', icon: Users, permission: 'canManageTargets' },
  { title: 'Monitoring', url: '/monitoring', icon: BarChart3, permission: 'canViewMonitoring' },
  { title: 'History', url: '/history', icon: History, permission: 'canViewHistory' },
];

const settingsItems: NavItem[] = [
  { title: 'Question Bank', url: '/questions', icon: ClipboardList, permission: 'canManageQuestionBank' },
  { title: 'Settings', url: '/settings', icon: Settings, permission: 'canViewDashboard' },
];

const roleLabels: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  read_only: 'Read Only',
  respondent: 'Respondent',
};

const roleColors: Record<UserRole, string> = {
  super_admin: 'bg-destructive/10 text-destructive',
  admin: 'bg-primary/10 text-primary',
  read_only: 'bg-muted text-muted-foreground',
  respondent: 'bg-accent text-accent-foreground',
};

export function AppSidebar() {
  const location = useLocation();
  const { currentUser, setCurrentUser, permissions } = useSurvey();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleRoleChange = (role: UserRole) => {
    setCurrentUser({ ...currentUser, role });
  };

  const renderNavItems = (items: typeof mainNavItems) =>
    items
      .filter(item => {
        // Read-only can see targets (read only) and question bank (read only)
        if (item.permission === 'canManageTargets' && currentUser.role === 'read_only') return true;
        if (item.permission === 'canManageQuestionBank') return currentUser.role === 'super_admin' || currentUser.role === 'admin';
        return ROLE_PERMISSIONS[currentUser.role][item.permission];
      })
      .map(item => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild>
            <NavLink
              to={item.url}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive(item.url)
                  ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ));

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">CS</span>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sidebar-foreground">Customer Survey</span>
            <span className="text-xs text-sidebar-foreground/70">MVP Prototype</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderNavItems(mainNavItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderNavItems(operationsItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderNavItems(settingsItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="space-y-3">
          {/* Role Switcher for prototype */}
          <div className="space-y-1">
            <p className="text-xs text-sidebar-foreground/50 flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Simulate Role
            </p>
            <Select value={currentUser.role} onValueChange={(v) => handleRoleChange(v as UserRole)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="read_only">Read Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-xs">
                {currentUser.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium text-sidebar-foreground truncate">
                {currentUser.name}
              </span>
              <Badge className={`text-[10px] w-fit ${roleColors[currentUser.role]}`}>
                {roleLabels[currentUser.role]}
              </Badge>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
