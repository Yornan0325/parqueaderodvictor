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
          <main className="sticky top-0 z-10 flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border/70 bg-background/80 px-3 backdrop-blur-md transition-all duration-300 sm:px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              {/* <Separator orientation="vertical" className="mr-2 h-4" /> */}
            </div>
            {/* Espacio para buscador o perfil rÃ¡pido si se desea */}
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

          {/* Contenido de la pÃ¡gina */}
          <div className="flex-1 space-y-6 px-3 py-4 transition-all duration-300 sm:px-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
