"use server";

import { prisma } from "@/lib/prisma";
import { compraDiretaSchema } from "@/schemas";
import { requireAdmin } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

function compraDiretaAplicaNoMes(
  compra: { dataInicio: Date; numeroParcelas: number; valorTotal: number },
  mes: number,
  ano: number
): { aplica: boolean; valorMensal: number } {
  const inicio = new Date(compra.dataInicio);
  const inicioMes = inicio.getUTCMonth() + 1;
  const inicioAno = inicio.getUTCFullYear();
  const mesRef = ano * 12 + mes;
  const mesInicio = inicioAno * 12 + inicioMes;
  const mesFim = mesInicio + compra.numeroParcelas - 1;

  if (mesRef < mesInicio || mesRef > mesFim) return { aplica: false, valorMensal: 0 };
  return { aplica: true, valorMensal: compra.valorTotal / compra.numeroParcelas };
}

export async function calcularDebitoDiretoDoMes(personId: number, mes: number, ano: number): Promise<number> {
  const compras = await prisma.compraDireta.findMany({ where: { personId } });
  return compras.reduce((soma, c) => {
    const { aplica, valorMensal } = compraDiretaAplicaNoMes(c, mes, ano);
    return aplica ? soma + valorMensal : soma;
  }, 0);
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
