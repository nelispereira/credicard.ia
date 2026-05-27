import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createPessoa, deletePessoa } from "@/actions/pessoas";
import { PessoaForm } from "./_components/PessoaForm";
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

      {pessoas.length > 0 && (
        <div className="mb-8 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Nome</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">CPF</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">E-mail</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Telefone</th>
                  <th className="px-4 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {pessoas.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{p.nome}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 tabular-nums">
                      {p.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.email ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.telefone ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3 justify-end">
                        <Link
                          href={`/pessoas/${p.id}`}
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                        >
                          Editar
                        </Link>
                        {p._count.cardUsages === 0 ? (
                          <form action={deletePessoa}>
                            <input type="hidden" name="id" value={p.id} />
                            <button
                              type="submit"
                              className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                            >
                              Excluir
                            </button>
                          </form>
                        ) : (
                          <span
                            title="Possui registros de uso"
                            className="text-xs text-gray-300 dark:text-gray-700 cursor-not-allowed"
                          >
                            Excluir
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pessoas.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-600 mb-8">Nenhuma pessoa cadastrada ainda.</p>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-5">Nova pessoa</h2>
        <PessoaForm action={createPessoa} />
      </div>
    </div>
  );
}
