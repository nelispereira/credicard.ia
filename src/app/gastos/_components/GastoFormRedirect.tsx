"use client";

import { useRouter } from "next/navigation";
import { GastoForm } from "./GastoForm";
import type { GastoActionState } from "@/actions/gastos";

type Categoria = { id: number; nome: string; cor: string | null };
type TipoGasto = "UNICO" | "RECORRENTE" | "PARCELADO";

type DefaultValues = {
  id?: number;
  categoriaId?: number;
  descricao?: string;
  valorTotal?: number;
  tipo?: TipoGasto;
  dataInicio?: Date;
  dataFim?: Date | null;
  numeroParcelas?: number | null;
};

type Action = (state: GastoActionState, data: FormData) => Promise<GastoActionState>;

export function GastoFormRedirect({
  action,
  categorias,
  defaultValues,
}: {
  action: Action;
  categorias: Categoria[];
  defaultValues?: DefaultValues;
}) {
  const router = useRouter();
  return (
    <GastoForm
      action={action}
      categorias={categorias}
      defaultValues={defaultValues}
      onSuccess={() => router.push("/gastos")}
    />
  );
}
