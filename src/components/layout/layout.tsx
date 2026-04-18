import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
// import { Separator } from "@/components/ui/separator"
 
import { TooltipProvider } from "../ui/tooltip"

import { ModeToggle } from "@/components/ui/mode-toggle"
import { AppSidebar } from "./app-sidebar"
import { usePrinter } from "@/hooks/use-printer"
import { Bluetooth, BluetoothOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { UserProfile } from "@/components/types"
  

export default function Layout({
  children,
  profile,
}: {
  children: React.ReactNode
  profile: UserProfile
}) {
  const { isConnected, isConnecting, deviceName, connect, disconnect } = usePrinter();

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <AppSidebar profile={profile} />
        <SidebarInset>
          {/* Navbar Superior */}
          <main className="flex h-10 shrink-0 items-center justify-between gap-2 border-b px-4 sticky top-0 bg-background/80 backdrop-blur-md z-10">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              {/* <Separator orientation="vertical" className="mr-2 h-4" /> */}
            </div>
            {/* Espacio para buscador o perfil rápido si se desea */}
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={isConnected ? disconnect : connect}
                disabled={isConnecting}
                className={`flex items-center gap-2 rounded-full px-3 h-8 border transition-all ${isConnected ? 'text-blue-500 border-blue-500/20 bg-blue-500/5' : 'text-zinc-400 border-zinc-200'}`}
              >
                {isConnecting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : isConnected ? (
                  <Bluetooth className="h-3.5 w-3.5" />
                ) : (
                  <BluetoothOff className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline font-bold text-[9px] uppercase tracking-wider">
                  {isConnected ? deviceName : 'Impresora'}
                </span>
              </Button>
              <ModeToggle />
            </div>
          </main>

          {/* Contenido de la página */}
          <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
