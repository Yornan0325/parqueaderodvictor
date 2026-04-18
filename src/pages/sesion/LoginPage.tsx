import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmail } from "@/firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { LayoutDashboard, Mail, Lock, Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.warning("Completa todos los campos");

    setLoading(true);
    const { error } = await signInWithEmail({ email, password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Bienvenido de nuevo");
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 relative overflow-hidden font-sans">
      {/* BACKGROUND DECORATION */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />

      <Card className="w-full max-w-md p-8 border-zinc-800 bg-zinc-900/50 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
            <LayoutDashboard className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white">D'VICTOR</h1>
          <p className="text-zinc-500 text-sm font-medium mt-1 uppercase tracking-widest text-[10px]">Parking Control System</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <Input 
                type="email" 
                placeholder="nombre@empresa.com" 
                className="bg-zinc-800/50 border-zinc-700 pl-10 h-12 text-white placeholder:text-zinc-600 focus:ring-emerald-500/20 focus:border-emerald-500/50"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <Input 
                type="password" 
                placeholder="••••••••" 
                className="bg-zinc-800/50 border-zinc-700 pl-10 h-12 text-white placeholder:text-zinc-600 focus:ring-emerald-500/20 focus:border-emerald-500/50"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-600/20 group transition-all"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <span className="flex items-center gap-2">
                Iniciar Sesión <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </Button>
        </form>

        <div className="mt-8 text-center border-t border-zinc-800 pt-6">
          <p className="text-zinc-500 text-sm font-medium">
            ¿No tienes una cuenta? {" "}
            <Link to="/register" className="text-emerald-400 hover:underline font-bold transition-all">
              Crea una ahora
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
