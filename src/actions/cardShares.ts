"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

export async function addCardShare(formData: FormData) {
  await requireAdmin();

  const creditCardId = parseInt(formData.get("creditCardId") as string);
  const userId = formData.get("userId") as string;

  if (!creditCardId || !userId) return;

  await prisma.cardShare.create({
    data: { creditCardId, userId },
  });

  revalidatePath(`/cartoes/${creditCardId}`);
}

export async function removeCardShare(formData: FormData) {
  await requireAdmin();

  const creditCardId = parseInt(formData.get("creditCardId") as string);
  const userId = formData.get("userId") as string;

  if (!creditCardId || !userId) return;

  await prisma.cardShare.deleteMany({
    where: { creditCardId, userId },
  });

  revalidatePath(`/cartoes/${creditCardId}`);
}
