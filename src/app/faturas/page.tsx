import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ImportForm } from "./_components/ImportForm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth-utils";

function formatDate(d: Date) {
  return d.toLocaleDateString("pt-BR", { timeZone: "UTC", month: "short", year: "numeric" });
}

function formatVencimento(d: Date) {
  return d.toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit" });
}

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function FaturasPage() {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) redirect("/minha-conta");

  const [cartoes, faturas] = await Promise.all([
    prisma.creditCard.findMany({ orderBy: { nome: "asc" } }),
    prisma.invoice.findMany({
      include: {
        creditCard: { select: { nome: true, ultimos4: true } },
        _count: { select: { transactions: true } },
        transactions: { select: { valorBRL: true, personId: true } },
      },
      orderBy: { importadoEm: "desc" },
    }),
  ]);

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-6">Faturas</h1>

      {cartoes.length === 0 ? (
        <div className="mb-6 bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-400 rounded-lg px-4 py-3 text-sm">
          Cadastre ao menos um{" "}
          <a href="/cartoes" className="underline font-medium">
            cartão
          </a>{" "}
          antes de importar faturas.
        </div>
      ) : (
        <div className="mb-8 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-5">Importar nova fatura</h2>
          <ImportForm cartoes={cartoes} />
        </div>
      )}

      {faturas.length > 0 && (
        <div className="space-y-3">
          {faturas.map((f) => {
            const total = f.transactions.reduce((s, t) => s + t.valorBRL, 0);
            const naoAtribuidas = f.transactions.filter((t) => t.personId === null).length;
            return (
              <Link
                key={f.id}
                href={`/faturas/${f.id}`}
                className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {f.creditCard.nome}{" "}
                    <span className="font-mono text-xs text-gray-500 dark:text-gray-400">•••{f.creditCard.ultimos4}</span>
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {formatDate(f.periodoInicio)} — {formatDate(f.periodoFim)} · {f._count.transactions} transações
                    {f.vencimento && (
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        · venc. {formatVencimento(f.vencimento)}
                      </span>
                    )}
                    {naoAtribuidas > 0 && (
                      <span className="ml-2 text-orange-600 dark:text-orange-400 font-medium">
                        {naoAtribuidas} sem dono
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">{f.nomeArquivo}</p>
                </div>
                <div className="text-right ml-4 shrink-0">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{formatBRL(total)}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">
                    {new Date(f.importadoEm).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {faturas.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-600">Nenhuma fatura importada ainda.</p>
      )}
    </div>
  );
}
