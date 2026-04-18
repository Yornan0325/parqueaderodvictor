import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldTitle } from "../ui/field"

interface SwitchChoiceCardProps {
  isMonthly: boolean;
  setIsMonthly: (value: boolean) => void;
  owner: { name: string; id: string; phone: string };
  setOwner: (owner: any) => void;
}

export function SwitchChoiceCard({ isMonthly, setIsMonthly, owner, setOwner }: SwitchChoiceCardProps) {
  return (
    <div className="space-y-4">
      <FieldGroup className="w-full max-w-sm">
        <FieldLabel htmlFor="switch-share" className="cursor-pointer">
          <Field orientation="horizontal">
            <FieldContent>
              <FieldTitle>¿Es Cliente Mensual?</FieldTitle>
              <FieldDescription>
                Marque para omitir el cobro por tiempo.
              </FieldDescription>
            </FieldContent>
            <Switch
              id="switch-share"
              checked={isMonthly}
              onCheckedChange={setIsMonthly}
              onClick={(e) => e.stopPropagation()}
            />
          </Field>
        </FieldLabel>
      </FieldGroup>

      {/* Formulario condicional integrado */}
      {isMonthly && (
        <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
            Información Propietario
          </p>
          <Input
            placeholder="Nombre completo"
            value={owner.name}
            onChange={(e) => setOwner({ ...owner, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="Documento / NIT"
              value={owner.id}
              onChange={(e) => setOwner({ ...owner, id: e.target.value })}
            />
            <Input
              placeholder="WhatsApp / Tel"
              value={owner.phone}
              onChange={(e) => setOwner({ ...owner, phone: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  )
}