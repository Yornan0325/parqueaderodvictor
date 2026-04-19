import { ChevronUp, LogOut, Package, ShieldUser, Sparkles, User2 } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"
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
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { navConfig } from "@/components/config/navigation"
import { signOutSession } from "@/firebase/auth"
import { cn } from "@/lib/utils"
import type { UserProfile } from "@/components/types"

export function AppSidebar({ profile }: { profile: UserProfile }) {
  const navigate = useNavigate()
  const location = useLocation()

  const usersNavItem = navConfig.find((item) => item.href === "/usuarios")
  const canOpenUsers =
    !!usersNavItem && usersNavItem.allowedRoles.includes(profile.role)

  const allowedNavItems = navConfig.filter(
    (item) =>
      item.allowedRoles.includes(profile.role) && item.href !== "/usuarios"
  )

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="bg-sidebar border-r border-sidebar-border/80 shadow-md"
    >
      <SidebarHeader className="h-12 flex items-center justify-center border-b border-sidebar-border/80 px-4 bg-sidebar">
        <div className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-black/20 transition-all group-hover:scale-[1.03]">
            <Package className="size-5" />
            <Sparkles className="absolute -right-1 -top-1 size-3 text-emerald-300" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <h1 className="font-black text-lg tracking-tighter leading-none uppercase text-sidebar-foreground">dvictor</h1>
            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest leading-none mt-1">Sistemas</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 pb-2 pt-4 text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/60 font-extrabold">
            Control
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-3">
            <SidebarMenu className="gap-2">
              {allowedNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    onClick={() => navigate(item.href)}
                    isActive={location.pathname === item.href}
                    className={cn(
                      "h-11 w-full rounded-xl border border-transparent transition-all duration-200 font-bold text-[13px] px-3.5",
                      location.pathname === item.href
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-black/25 border-sidebar-primary/20"
                        : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:border-sidebar-border/80"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "size-4 transition-transform duration-200",
                        location.pathname === item.href && "scale-110"
                      )}
                    />
                    <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border/80 bg-sidebar">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="w-full h-14 rounded-xl border border-sidebar-border/80 bg-sidebar-accent/40 shadow-sm transition-all hover:bg-sidebar-accent hover:border-sidebar-border data-[state=open]:bg-sidebar-accent"
                >
                  <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-inner group-data-[collapsible=icon]:size-8">
                    <User2 className="size-5 group-data-[collapsible=icon]:size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight ml-2 group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-black text-xs text-sidebar-foreground tracking-tight leading-none mb-1 capitalize">
                      {profile.name}
                    </span>
                    <span className="truncate text-[10px] text-sidebar-foreground/70 font-medium">{profile.email}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4 text-sidebar-foreground/40 transition-transform group-hover:translate-y-[-2px] group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width] rounded-xl p-2 shadow-xl border-border/80">
                <DropdownMenuItem className="rounded-lg font-bold text-foreground/80 cursor-default focus:bg-transparent">
                  <User2 className="mr-2 size-4" />
                  <div className="flex flex-col">
                    <span>{profile.name}</span>
                    <span className="text-[10px] font-medium text-muted-foreground">{profile.email}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-lg font-bold text-muted-foreground cursor-default focus:bg-transparent">
                  <Package className="mr-2 size-4" />
                  <span className="uppercase text-[10px] tracking-widest">{profile.role}</span>
                </DropdownMenuItem>
                {canOpenUsers && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="rounded-lg border border-border/70 bg-muted/30 font-bold cursor-pointer"
                      onClick={() => navigate("/usuarios")}
                    >
                      <ShieldUser className="mr-2 size-4" />
                      <span>Usuarios</span>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="rounded-lg cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 font-bold"
                  onClick={() => {
                    setTimeout(() => {
                      signOutSession()
                    }, 100)
                  }}
                >
                  <LogOut className="mr-2 size-4" />
                  <span>Cerrar sesion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
