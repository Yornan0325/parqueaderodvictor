import { Button } from "@/components/ui/button"
import { usePrinter } from "@/hooks/use-printer"
import { Bluetooth, BluetoothOff, Loader2 } from "lucide-react"

export function Navbar() {
  const { isConnected, isConnecting, deviceName, connect, disconnect } = usePrinter();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold tracking-tight text-emerald-500">dvictor</h2>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={isConnected ? disconnect : connect}
            disabled={isConnecting}
            className={`flex items-center gap-2 rounded-full px-4 border ${isConnected ? 'text-blue-500 border-blue-500/20 bg-blue-500/5' : 'text-zinc-500 border-zinc-200'}`}
          >
            {isConnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isConnected ? (
              <Bluetooth className="h-4 w-4" />
            ) : (
              <BluetoothOff className="h-4 w-4" />
            )}
            <span className="hidden sm:inline font-bold text-[10px] uppercase tracking-wider">
              {isConnected ? deviceName : 'Conectar Impresora'}
            </span>
          </Button>
          <div className="h-4 w-px bg-zinc-200 mx-1 hidden sm:block" />
          <Button variant="ghost" size="sm" className="font-bold text-[10px] uppercase tracking-wider">Perfil</Button>
        </div>
      </div>
    </header>
  )
}