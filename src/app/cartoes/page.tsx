import { prisma } from "@/lib/prisma";
import { createCartao } from "@/actions/cartoes";
import { CartaoForm } from "./_components/CartaoForm";
import { CartoesList } from "./_components/CartoesList";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth-utils";

export default async function CartoesPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) redirect("/minha-conta");

  const { erro } = await searchParams;

  const cartoes = await prisma.creditCard.findMany({
    include: { _count: { select: { cardUsages: true, invoices: true } } },
    orderBy: { nome: "asc" },
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-6">Cartões</h1>

      {erro === "em-uso" && (
        <div className="mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 text-sm">
          Este cartão possui registros vinculados e não pode ser excluído.
        </div>
      )}

      <CartoesList cartoes={cartoes} />

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-5">Novo cartão</h2>
        <CartaoForm action={createCartao} />
      </div>
    </div>
  );
}
