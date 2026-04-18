import { Package, ChevronUp, User2 } from "lucide-react"
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
import { DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { navConfig } from "@/components/config/navigation"
import { signOutSession } from "@/firebase/auth"
import { cn } from "@/lib/utils"
import type { UserProfile } from "@/components/types"

export function AppSidebar({ profile }: { profile: UserProfile }) {
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="h-16 flex items-center justify-center border-b px-6 bg-zinc-50/50">
        <div className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-lg shadow-zinc-900/10 transition-all group-hover:scale-105">
                <Package className="size-5" />
            </div>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <h1 className="font-black text-lg tracking-tighter leading-none uppercase text-zinc-900">dvictor</h1>
                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest leading-none mt-1">Sistemas</span>
            </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-6 pb-2 pt-6 text-[9px] uppercase tracking-[0.2em] text-zinc-400 font-extrabold">Control</SidebarGroupLabel>
          <SidebarGroupContent className="px-3">
            <SidebarMenu className="gap-2">
              {navConfig.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    tooltip={item.title}
                    onClick={() => navigate(item.href)}
                    isActive={location.pathname === item.href}
                    className={cn(
                        "h-12 w-full rounded-2xl transition-all duration-300 font-bold text-[13px] px-4",
                        location.pathname === item.href 
                        ? "bg-zinc-900 text-white shadow-md shadow-zinc-900/10 hover:bg-zinc-800"
                        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                    )}
                  >
                    <item.icon className={cn("size-5 transition-transform duration-300", location.pathname === item.href && "scale-110")} />
                    <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t bg-zinc-50/30">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton 
                    size="lg" 
                    className="w-full h-14 rounded-2xl border border-zinc-100 bg-white shadow-sm transition-all hover:bg-zinc-50 hover:border-zinc-200 data-[state=open]:bg-zinc-100"
                >
                  <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-inner group-data-[collapsible=icon]:size-8">
                    <User2 className="size-5 group-data-[collapsible=icon]:size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight ml-2 group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-black text-xs text-zinc-900 tracking-tight leading-none mb-1 capitalize">
                        {profile.name}
                    </span>
                    <span className="truncate text-[10px] text-zinc-500 font-medium">{profile.email}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4 text-zinc-300 transition-transform group-hover:translate-y-[-2px] group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width] rounded-2xl p-2 shadow-xl border-zinc-100">
                <DropdownMenuItem className="rounded-xl font-bold text-zinc-600 cursor-default focus:bg-transparent">
                    <User2 className="mr-2 size-4" />
                    <div className="flex flex-col">
                      <span>{profile.name}</span>
                      <span className="text-[10px] font-medium text-zinc-400">{profile.email}</span>
                    </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl font-bold text-zinc-500 cursor-default focus:bg-transparent">
                  <Package className="mr-2 size-4" />
                  <span className="uppercase text-[10px] tracking-widest">{profile.role}</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="rounded-xl cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/5 font-bold"
                  onClick={() => signOutSession()}
                >
                  <Package className="mr-2 size-4 rotate-180" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
