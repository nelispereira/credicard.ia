import { prisma } from "@/lib/prisma";
import { createPessoa } from "@/actions/pessoas";
import { PessoaForm } from "./_components/PessoaForm";
import { PessoasList } from "./_components/PessoasList";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth-utils";

export default async function PessoasPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) redirect("/minha-conta");

  const { erro } = await searchParams;

  const pessoas = await prisma.person.findMany({
    include: { _count: { select: { cardUsages: true } } },
    orderBy: { nome: "asc" },
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-6">Pessoas</h1>

      {erro === "em-uso" && (
        <div className="mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 text-sm">
          Esta pessoa possui registros de uso e não pode ser excluída.
        </div>
      )}

      <PessoasList pessoas={pessoas} />

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-5">Nova pessoa</h2>
        <PessoaForm action={createPessoa} />
      </div>
    </div>
  );
}
