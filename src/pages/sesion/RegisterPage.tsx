import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createUserWithEmail } from "@/firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, Lock, UserPlus, Loader2, User as UserIcon, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) return toast.warning("Completa todos los campos");
    if (password !== confirmPassword) return toast.error("Las contrasenas no coinciden");
    if (password.length < 6) return toast.error("La contrasena debe tener al menos 6 caracteres");

    setLoading(true);
    const { error } = await createUserWithEmail({ email, password, name });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Cuenta creada exitosamente");
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen w-full bg-background px-4 py-8 flex items-center justify-center">
      <Card className="w-full max-w-md border border-border/70 bg-card/85 p-6 sm:p-8 shadow-sm backdrop-blur-sm transition-all duration-300">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <UserPlus className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Crear cuenta</h1>
          <p className="mt-1 text-sm text-muted-foreground">Registra tu acceso al sistema.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Nombre completo</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Ej. Juan Perez"
                className="h-11 pl-9"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

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

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Confirmar contrasena</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="********"
                className="h-11 pl-9 pr-10"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showConfirmPassword ? "Ocultar confirmacion de contrasena" : "Mostrar confirmacion de contrasena"}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear cuenta"}
          </Button>
        </form>

        <div className="mt-6 border-t border-border/70 pt-4 text-center text-sm text-muted-foreground">
          Ya tienes una cuenta?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Inicia sesion
          </Link>
        </div>
      </Card>
    </div>
  );
}
