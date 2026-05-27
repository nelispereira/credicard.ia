import { prisma } from "@/lib/prisma";
import { deleteUso } from "@/actions/usos";
import { UsoForm } from "./_components/UsoForm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth-utils";

function formatDate(d: Date) {
  return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export default async function UsosPage() {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) redirect("/minha-conta");

  const [pessoas, cartoes, usos] = await Promise.all([
    prisma.person.findMany({ orderBy: { nome: "asc" } }),
    prisma.creditCard.findMany({ orderBy: { nome: "asc" } }),
    prisma.cardUsage.findMany({
      include: {
        person: { select: { nome: true } },
        creditCard: { select: { nome: true, ultimos4: true } },
      },
      orderBy: { data: "desc" },
      take: 100,
    }),
  ]);

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-6">Registrar Uso</h1>

      {pessoas.length === 0 || cartoes.length === 0 ? (
        <div className="mb-6 bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-400 rounded-lg px-4 py-3 text-sm">
          {pessoas.length === 0 && (
            <span>
              Cadastre ao menos uma{" "}
              <a href="/pessoas" className="underline font-medium">
                pessoa
              </a>{" "}
              antes de registrar uso.{" "}
            </span>
          )}
          {cartoes.length === 0 && (
            <span>
              Cadastre ao menos um{" "}
              <a href="/cartoes" className="underline font-medium">
                cartão
              </a>{" "}
              antes de registrar uso.
            </span>
          )}
        </div>
      ) : (
        <div className="mb-8 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-5">Novo registro</h2>
          <UsoForm pessoas={pessoas} cartoes={cartoes} />
        </div>
      )}

      {usos.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Data</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Pessoa</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Cartão</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Descrição</th>
                  <th className="px-4 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {usos.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 tabular-nums text-gray-500 dark:text-gray-400">
                      {formatDate(u.data)}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      {u.person.nome}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {u.creditCard.nome}{" "}
                      <span className="font-mono text-xs">••{u.creditCard.ultimos4}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-500">{u.descricao ?? "—"}</td>
                    <td className="px-4 py-3">
                      <form action={deleteUso}>
                        <input type="hidden" name="id" value={u.id} />
                        <button
                          type="submit"
                          className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                        >
                          Excluir
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {usos.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-600">Nenhum registro de uso ainda.</p>
      )}
    </div>
  );
}
