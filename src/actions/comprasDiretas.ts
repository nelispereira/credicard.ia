"use server";

import { prisma } from "@/lib/prisma";
import { compraDiretaSchema } from "@/schemas";
import { requireAdmin } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { compraDiretaAplicaNoMes } from "@/lib/compras-diretas-utils";

export type CompraDiretaDetalhe = {
  id: number;
  descricao: string;
  valorMensal: number;
  valorTotal: number;
  numeroParcelas: number;
  parcelaAtual: number;
};

export async function listarComprasDiretasDoMes(
  personId: number,
  mes: number,
  ano: number
): Promise<CompraDiretaDetalhe[]> {
  const compras = await prisma.compraDireta.findMany({ where: { personId } });

  const resultado: CompraDiretaDetalhe[] = [];
  for (const c of compras) {
    const { aplica, valorMensal } = compraDiretaAplicaNoMes(c, mes, ano);
    if (!aplica) continue;

    const inicio = new Date(c.dataInicio);
    const mesInicio = inicio.getUTCFullYear() * 12 + (inicio.getUTCMonth() + 1);
    const mesRef = ano * 12 + mes;

    resultado.push({
      id: c.id,
      descricao: c.descricao,
      valorMensal,
      valorTotal: c.valorTotal,
      numeroParcelas: c.numeroParcelas,
      parcelaAtual: mesRef - mesInicio + 1,
    });
  }

  return resultado.sort((a, b) => a.descricao.localeCompare(b.descricao));
}

export async function listarComprasDiretas(personId: number) {
  await requireAdmin();
  return prisma.compraDireta.findMany({
    where: { personId },
    orderBy: [{ dataInicio: "desc" }, { createdAt: "desc" }],
  });
}

export type CompraDiretaActionState = { error: string } | null;

export async function criarCompraDireta(
  _: CompraDiretaActionState,
  formData: FormData
): Promise<CompraDiretaActionState> {
  await requireAdmin();
  const raw = {
    personId: formData.get("personId"),
    descricao: formData.get("descricao") as string,
    valorTotal: formData.get("valorTotal"),
    dataInicio: formData.get("dataInicio"),
    numeroParcelas: formData.get("numeroParcelas") || undefined,
  };
  const parsed = compraDiretaSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.compraDireta.create({
    data: {
      personId: parsed.data.personId,
      descricao: parsed.data.descricao,
      valorTotal: parsed.data.valorTotal,
      dataInicio: parsed.data.dataInicio,
      numeroParcelas: parsed.data.numeroParcelas,
    },
  });

  revalidatePath(`/pessoas/${parsed.data.personId}`);
  return null;
}

export async function excluirCompraDireta(formData: FormData) {
  await requireAdmin();
  const id = parseInt(formData.get("id") as string);

  const compra = await prisma.compraDireta.findUnique({ where: { id } });
  if (!compra) return;

  await prisma.compraDireta.delete({ where: { id } });
  revalidatePath(`/pessoas/${compra.personId}`);
}
