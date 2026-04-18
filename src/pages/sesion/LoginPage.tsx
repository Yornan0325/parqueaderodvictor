import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmail } from "@/firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { LayoutDashboard, Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen w-full bg-background px-4 py-8 flex items-center justify-center">
      <Card className="w-full max-w-md border border-border/70 bg-card/85 p-6 sm:p-8 shadow-sm backdrop-blur-sm transition-all duration-300">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Iniciar sesion</h1>
          <p className="mt-1 text-sm text-muted-foreground">Accede a tu cuenta para continuar.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Correo electronico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="email"
                placeholder="nombre@empresa.com"
                className="h-11 pl-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Contrasena</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="********"
                className="h-11 pl-9 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
          </Button>
        </form>

        <div className="mt-6 border-t border-border/70 pt-4 text-center text-sm text-muted-foreground">
          No tienes una cuenta?{" "}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Registrate
          </Link>
        </div>
      </Card>
    </div>
  );
}
