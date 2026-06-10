"use server";

import { prisma } from "@/lib/prisma";
import { categoriaGastoSchema, gastoSchema } from "@/schemas";
import { getPersonByUserEmail } from "@/lib/auth-utils";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

type TipoGasto = "UNICO" | "RECORRENTE" | "PARCELADO";

async function getSession() {
  const session = await auth();
  const userId = session?.user?.id;
  const email = session?.user?.email;
  if (!userId || !email) throw new Error("Não autenticado");
  return { userId, email };
}

// ---------- Categorias ----------

export async function listarCategorias() {
  const { userId } = await getSession();
  return prisma.categoriaGasto.findMany({
    where: { userId },
    orderBy: { nome: "asc" },
  });
}

export type CategoriaActionState = { error: string } | null;

export async function criarCategoria(
  _: CategoriaActionState,
  formData: FormData
): Promise<CategoriaActionState> {
  const { userId } = await getSession();
  const raw = {
    nome: formData.get("nome") as string,
    cor: (formData.get("cor") as string) || undefined,
  };
  const parsed = categoriaGastoSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.categoriaGasto.create({
      data: { userId, nome: parsed.data.nome, cor: parsed.data.cor || null },
    });
  } catch {
    return { error: "Já existe uma categoria com esse nome." };
  }

  revalidatePath("/gastos");
  return null;
}

export async function editarCategoria(
  _: CategoriaActionState,
  formData: FormData
): Promise<CategoriaActionState> {
  const { userId } = await getSession();
  const id = parseInt(formData.get("id") as string);
  const raw = {
    nome: formData.get("nome") as string,
    cor: (formData.get("cor") as string) || undefined,
  };
  const parsed = categoriaGastoSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const categoria = await prisma.categoriaGasto.findFirst({ where: { id, userId } });
  if (!categoria) return { error: "Categoria não encontrada." };

  try {
    await prisma.categoriaGasto.update({
      where: { id },
      data: { nome: parsed.data.nome, cor: parsed.data.cor || null },
    });
  } catch {
    return { error: "Já existe uma categoria com esse nome." };
  }

  revalidatePath("/gastos");
  return null;
}

export async function excluirCategoria(formData: FormData) {
  const { userId } = await getSession();
  const id = parseInt(formData.get("id") as string);

  const categoria = await prisma.categoriaGasto.findFirst({ where: { id, userId } });
  if (!categoria) return;

  const count = await prisma.gasto.count({ where: { categoriaId: id } });
  if (count > 0) throw new Error("Categoria possui gastos vinculados.");

  await prisma.categoriaGasto.delete({ where: { id } });
  revalidatePath("/gastos");
}

// ---------- Gastos ----------

export async function listarGastos() {
  const { userId } = await getSession();
  return prisma.gasto.findMany({
    where: { userId },
    include: { categoria: true },
    orderBy: [{ dataInicio: "desc" }, { createdAt: "desc" }],
  });
}

export type GastoActionState = { error: string } | null;

function rawGasto(formData: FormData) {
  return {
    categoriaId: formData.get("categoriaId"),
    descricao: formData.get("descricao") as string,
    valorTotal: formData.get("valorTotal"),
    tipo: formData.get("tipo") as string,
    dataInicio: formData.get("dataInicio"),
    dataFim: (formData.get("dataFim") as string) || null,
    numeroParcelas: (formData.get("numeroParcelas") as string) || null,
  };
}

export async function criarGasto(
  _: GastoActionState,
  formData: FormData
): Promise<GastoActionState> {
  const { userId } = await getSession();
  const raw = rawGasto(formData);
  const parsed = gastoSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const categoria = await prisma.categoriaGasto.findFirst({
    where: { id: parsed.data.categoriaId, userId },
  });
  if (!categoria) return { error: "Categoria não encontrada." };

  await prisma.gasto.create({
    data: {
      userId,
      categoriaId: parsed.data.categoriaId,
      descricao: parsed.data.descricao,
      valorTotal: parsed.data.valorTotal,
      tipo: parsed.data.tipo as TipoGasto,
      dataInicio: parsed.data.dataInicio,
      dataFim: parsed.data.dataFim ?? null,
      numeroParcelas: parsed.data.numeroParcelas ?? null,
    },
  });

  revalidatePath("/gastos");
  return null;
}

export async function editarGasto(
  _: GastoActionState,
  formData: FormData
): Promise<GastoActionState> {
  const { userId } = await getSession();
  const id = parseInt(formData.get("id") as string);
  const raw = rawGasto(formData);
  const parsed = gastoSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const gasto = await prisma.gasto.findFirst({ where: { id, userId } });
  if (!gasto) return { error: "Gasto não encontrado." };

  const categoria = await prisma.categoriaGasto.findFirst({
    where: { id: parsed.data.categoriaId, userId },
  });
  if (!categoria) return { error: "Categoria não encontrada." };

  await prisma.gasto.update({
    where: { id },
    data: {
      categoriaId: parsed.data.categoriaId,
      descricao: parsed.data.descricao,
      valorTotal: parsed.data.valorTotal,
      tipo: parsed.data.tipo as TipoGasto,
      dataInicio: parsed.data.dataInicio,
      dataFim: parsed.data.dataFim ?? null,
      numeroParcelas: parsed.data.numeroParcelas ?? null,
    },
  });

  revalidatePath("/gastos");
  return null;
}

export async function excluirGasto(formData: FormData) {
  const { userId } = await getSession();
  const id = parseInt(formData.get("id") as string);

  const gasto = await prisma.gasto.findFirst({ where: { id, userId } });
  if (!gasto) return;

  await prisma.gasto.delete({ where: { id } });
  revalidatePath("/gastos");
}

// ---------- Resumo mensal ----------

export type ResumoMensal = {
  porCategoria: { nome: string; cor: string | null; total: number }[];
  debitoCartao: number;
  totalGeral: number;
};

function gastoAplicaNoMes(
  gasto: { tipo: TipoGasto; dataInicio: Date; dataFim: Date | null; numeroParcelas: number | null; valorTotal: number },
  mes: number,
  ano: number
): { aplica: boolean; valorMensal: number } {
  const inicio = new Date(gasto.dataInicio);
  const inicioMes = inicio.getUTCMonth() + 1;
  const inicioAno = inicio.getUTCFullYear();
  const mesRef = ano * 12 + mes;
  const mesInicio = inicioAno * 12 + inicioMes;

  if (gasto.tipo === "UNICO") {
    return { aplica: mesRef === mesInicio, valorMensal: gasto.valorTotal };
  }

  if (gasto.tipo === "RECORRENTE") {
    if (mesRef < mesInicio) return { aplica: false, valorMensal: 0 };
    if (gasto.dataFim) {
      const fim = new Date(gasto.dataFim);
      const mesFim = fim.getUTCFullYear() * 12 + (fim.getUTCMonth() + 1);
      if (mesRef > mesFim) return { aplica: false, valorMensal: 0 };
    }
    return { aplica: true, valorMensal: gasto.valorTotal };
  }

  // PARCELADO
  const parcelas = gasto.numeroParcelas ?? 1;
  const mesFim = mesInicio + parcelas - 1;
  if (mesRef < mesInicio || mesRef > mesFim) return { aplica: false, valorMensal: 0 };
  return { aplica: true, valorMensal: gasto.valorTotal / parcelas };
}

export async function calcularResumoMensal(mes: number, ano: number): Promise<ResumoMensal> {
  const { userId, email } = await getSession();

  const [gastos, person] = await Promise.all([
    prisma.gasto.findMany({
      where: { userId },
      include: { categoria: true },
    }),
    getPersonByUserEmail(email),
  ]);

  // Débito cartão: transações do mês atribuídas à pessoa
  let debitoCartao = 0;
  if (person) {
    const inicioMes = new Date(ano, mes - 1, 1);
    const fimMes = new Date(ano, mes, 1);
    const result = await prisma.invoiceTransaction.aggregate({
      where: {
        personId: person.id,
        data: { gte: inicioMes, lt: fimMes },
      },
      _sum: { valorBRL: true },
    });
    debitoCartao = result._sum.valorBRL ?? 0;
  }

  // Agrupar gastos por categoria
  const porCategoriaMap = new Map<number, { nome: string; cor: string | null; total: number }>();

  for (const gasto of gastos) {
    const { aplica, valorMensal } = gastoAplicaNoMes(gasto, mes, ano);
    if (!aplica) continue;

    const catId = gasto.categoriaId;
    if (!porCategoriaMap.has(catId)) {
      porCategoriaMap.set(catId, {
        nome: gasto.categoria.nome,
        cor: gasto.categoria.cor,
        total: 0,
      });
    }
    porCategoriaMap.get(catId)!.total += valorMensal;
  }

  const porCategoria = Array.from(porCategoriaMap.values()).sort((a, b) =>
    a.nome.localeCompare(b.nome)
  );

  const totalGastos = porCategoria.reduce((s, c) => s + c.total, 0);
  const totalGeral = totalGastos + debitoCartao;

  return { porCategoria, debitoCartao, totalGeral };
}
