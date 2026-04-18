import { Home, Users, Settings, Package, ScrollText, ShieldUser } from "lucide-react"

import type { UserProfile } from "@/components/types"

export const navConfig = [
    { title: "Inicio", href: "/", icon: Home, allowedRoles: ["admin", "employee", "user"] as UserProfile["role"][] },
    { title: "Usuarios", href: "/usuarios", icon: ShieldUser, allowedRoles: ["admin"] as UserProfile["role"][] },
    { title: "Suscripciones", href: "/suscripciones", icon: Package, allowedRoles: ["admin"] as UserProfile["role"][] },
    { title: "Registro", href: "/registro", icon: Users, allowedRoles: ["admin", "employee"] as UserProfile["role"][] },
    { title: "Historial", href: "/historial", icon: ScrollText, allowedRoles: ["admin", "employee", "user"] as UserProfile["role"][] },
    { title: "Configuracion", href: "/configuracion", icon: Settings, allowedRoles: ["admin"] as UserProfile["role"][] },
]
