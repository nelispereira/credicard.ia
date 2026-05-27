import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AtribuirForm } from "./_components/AtribuirForm";
import { ExportButtons } from "./_components/ExportButtons";
import { DeletarFaturaButton } from "./_components/DeletarFaturaButton";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/auth-utils";

function formatDate(d: Date) {
  return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function FaturaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) redirect("/minha-conta");

  const { id } = await params;

  const [fatura, pessoas] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id: parseInt(id) },
      include: {
        creditCard: true,
        transactions: {
          include: { person: { select: { id: true, nome: true } } },
          orderBy: { data: "asc" },
        },
      },
    }),
    prisma.person.findMany({ orderBy: { nome: "asc" } }),
  ]);

  if (!fatura) notFound();

  const byPerson = new Map<number | null, typeof fatura.transactions>();
  for (const tx of fatura.transactions) {
    const key = tx.personId;
    if (!byPerson.has(key)) byPerson.set(key, []);
    byPerson.get(key)!.push(tx);
  }

  const pessoasComTx = pessoas
    .filter((p) => byPerson.has(p.id))
    .map((p) => ({ ...p, transactions: byPerson.get(p.id)! }));

  const semDono = byPerson.get(null) ?? [];
  const total = fatura.transactions.reduce((s, t) => s + t.valorBRL, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <a href="/faturas" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 no-print">
            ← Faturas
          </a>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 mt-1">
            {fatura.creditCard.nome}{" "}
            <span className="font-mono text-base font-normal text-gray-500 dark:text-gray-400">•••{fatura.creditCard.ultimos4}</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {formatDate(fatura.periodoInicio)} a {formatDate(fatura.periodoFim)} · {fatura.nomeArquivo}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-50 tabular-nums">{formatBRL(total)}</p>
          <div className="flex gap-2 justify-end mt-2">
            <DeletarFaturaButton invoiceId={fatura.id} />
            <ExportButtons
              invoiceId={fatura.id}
              pessoas={pessoasComTx.map((p) => ({ id: p.id, nome: p.nome }))}
            />
          </div>
        </div>
      </div>

      {/* Unassigned transactions */}
      {semDono.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
          <h2 className="font-semibold text-orange-800 dark:text-orange-400 mb-3">
            Transações sem dono ({semDono.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-orange-700 dark:text-orange-500 border-b border-orange-200 dark:border-orange-800">
                  <th className="pb-2 font-medium">Data</th>
                  <th className="pb-2 font-medium">Descrição</th>
                  <th className="pb-2 font-medium text-right">Valor</th>
                  <th className="pb-2 font-medium no-print"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100 dark:divide-orange-900">
                {semDono.map((tx) => (
                  <tr key={tx.id}>
                    <td className="py-2.5 pr-4 tabular-nums text-orange-700 dark:text-orange-400">
                      {formatDate(tx.data)}
                    </td>
                    <td className="py-2.5 pr-4 text-orange-900 dark:text-orange-300">{tx.descricao}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums font-medium text-orange-900 dark:text-orange-300">
                      {formatBRL(tx.valorBRL)}
                    </td>
                    <td className="py-2.5 no-print">
                      <AtribuirForm
                        transactionId={tx.id}
                        invoiceId={fatura.id}
                        pessoas={pessoas}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Per-person breakdown */}
      {pessoasComTx.map(({ id: pid, nome, transactions }) => {
        const subtotal = transactions.reduce((s, t) => s + t.valorBRL, 0);
        return (
          <div key={pid} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">{nome}</h2>
              <span className="font-bold text-gray-900 dark:text-gray-100 tabular-nums">{formatBRL(subtotal)}</span>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-2.5 tabular-nums text-gray-500 dark:text-gray-400 w-28">
                      {formatDate(tx.data)}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-800 dark:text-gray-200">{tx.descricao}</td>
                    {tx.pais !== "BR" && (
                      <td className="py-2.5 pr-2 text-xs text-gray-400 dark:text-gray-600">{tx.pais}</td>
                    )}
                    {tx.atribuidoManualmente && (
                      <td className="py-2.5 pr-2">
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded font-medium">
                          manual
                        </span>
                      </td>
                    )}
                    <td className="py-2.5 pr-4 text-right tabular-nums font-medium text-gray-900 dark:text-gray-100">
                      {formatBRL(tx.valorBRL)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {/* Summary */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Resumo</h2>
        </div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {pessoasComTx.map(({ id: pid, nome, transactions }) => (
              <tr key={pid}>
                <td className="px-4 py-2.5 text-gray-800 dark:text-gray-200">{nome}</td>
                <td className="py-2.5 pr-4 text-gray-500 dark:text-gray-400 text-right">
                  {transactions.length} transações
                </td>
                <td className="py-2.5 pr-4 text-right font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                  {formatBRL(transactions.reduce((s, t) => s + t.valorBRL, 0))}
                </td>
              </tr>
            ))}
            {semDono.length > 0 && (
              <tr>
                <td className="px-4 py-2.5 text-orange-700 dark:text-orange-400">Não atribuídas</td>
                <td className="py-2.5 pr-4 text-orange-600 dark:text-orange-500 text-right">
                  {semDono.length} transações
                </td>
                <td className="py-2.5 pr-4 text-right font-semibold tabular-nums text-orange-700 dark:text-orange-400">
                  {formatBRL(semDono.reduce((s, t) => s + t.valorBRL, 0))}
                </td>
              </tr>
            )}
            <tr className="border-t-2 border-gray-300 dark:border-gray-700">
              <td className="px-4 py-2.5 font-bold text-gray-900 dark:text-gray-50">Total</td>
              <td className="py-2.5 pr-4 text-gray-500 dark:text-gray-400 text-right">
                {fatura.transactions.length} transações
              </td>
              <td className="py-2.5 pr-4 text-right font-bold tabular-nums text-gray-900 dark:text-gray-50">
                {formatBRL(total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
