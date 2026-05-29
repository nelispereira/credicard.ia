"use server";

import { prisma } from "@/lib/prisma";
import { pessoaSchema } from "@/schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-utils";

type PessoaValues = { nome: string; cpf: string; email?: string; telefone?: string };
export type ActionState = { error: string; values?: PessoaValues } | null;

function rawPessoa(formData: FormData) {
  return {
    nome: formData.get("nome") as string,
    cpf: (formData.get("cpf") as string).replace(/\D/g, ""),
    email: (formData.get("email") as string) || undefined,
    telefone: (formData.get("telefone") as string) || undefined,
  };
}

export async function createPessoa(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const raw = rawPessoa(formData);
  const parsed = pessoaSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message, values: raw };

  try {
    await prisma.person.create({ data: parsed.data });
  } catch {
    return { error: "CPF já cadastrado.", values: raw };
  }

  revalidatePath("/pessoas");
  redirect("/pessoas");
}

export async function updatePessoa(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const id = parseInt(formData.get("id") as string);
  const raw = rawPessoa(formData);
  const parsed = pessoaSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message, values: raw };

  try {
    await prisma.person.update({ where: { id }, data: parsed.data });
  } catch {
    return { error: "CPF já cadastrado em outro registro.", values: raw };
  }

  revalidatePath("/pessoas");
  redirect("/pessoas");
}

export async function deletePessoa(formData: FormData) {
  await requireAdmin();
  const id = parseInt(formData.get("id") as string);

  const [usages, transactions] = await Promise.all([
    prisma.cardUsage.count({ where: { personId: id } }),
    prisma.invoiceTransaction.count({ where: { personId: id } }),
  ]);

  if (usages + transactions > 0) {
    redirect("/pessoas?erro=em-uso");
  }

  await prisma.person.delete({ where: { id } });
  revalidatePath("/pessoas");
  redirect("/pessoas");
}
