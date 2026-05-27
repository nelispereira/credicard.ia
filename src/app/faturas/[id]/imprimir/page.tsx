import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AutoPrint } from "./_components/AutoPrint";

function formatDate(d: Date) {
  return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function ImprimirPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ personId?: string }>;
}) {
  const { id } = await params;
  const { personId: personIdStr } = await searchParams;
  const personId = personIdStr ? parseInt(personIdStr) : undefined;

  const fatura = await prisma.invoice.findUnique({
    where: { id: parseInt(id) },
    include: {
      creditCard: true,
      transactions: {
        where: personId ? { personId } : {},
        include: { person: { select: { id: true, nome: true } } },
        orderBy: { data: "asc" },
      },
    },
  });

  if (!fatura) notFound();

  let personaNome: string | null = null;
  if (personId) {
    const p = await prisma.person.findUnique({
      where: { id: personId },
      select: { nome: true },
    });
    personaNome = p?.nome ?? null;
  }

  const total = fatura.transactions.reduce((s, t) => s + t.valorBRL, 0);

  // For full invoice: build per-person summary
  const resumo = !personId
    ? (() => {
        const map = new Map<string, number>();
        for (const tx of fatura.transactions) {
          const nome = tx.person?.nome ?? "Não atribuídas";
          map.set(nome, (map.get(nome) ?? 0) + tx.valorBRL);
        }
        return Array.from(map.entries());
      })()
    : [];

  return (
    <div className="max-w-3xl mx-auto py-8 px-6">
      <AutoPrint />

      {/* Header */}
      <div className="mb-6 pb-4 border-b-2 border-gray-300">
        <h1 className="text-lg font-bold text-gray-900">
          {fatura.creditCard.nome} •••{fatura.creditCard.ultimos4}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {formatDate(fatura.periodoInicio)} a {formatDate(fatura.periodoFim)}
          {" · "}
          {fatura.nomeArquivo}
        </p>
        {personaNome && (
          <p className="text-base font-semibold text-gray-900 mt-2">{personaNome}</p>
        )}
      </div>

      {/* Transactions table */}
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="text-left py-2 pr-4 font-semibold text-gray-700">Data</th>
            <th className="text-left py-2 pr-4 font-semibold text-gray-700">Descrição</th>
            {!personId && (
              <th className="text-left py-2 pr-4 font-semibold text-gray-700">Pessoa</th>
            )}
            <th className="text-right py-2 font-semibold text-gray-700">Valor</th>
          </tr>
        </thead>
        <tbody>
          {fatura.transactions.map((tx) => (
            <tr key={tx.id} className="border-b border-gray-100">
              <td className="py-1.5 pr-4 tabular-nums text-gray-500 whitespace-nowrap">
                {formatDate(tx.data)}
              </td>
              <td className="py-1.5 pr-4 text-gray-800">{tx.descricao}</td>
              {!personId && (
                <td
                  className={`py-1.5 pr-4 ${
                    tx.person ? "text-gray-800" : "text-orange-600"
                  }`}
                >
                  {tx.person?.nome ?? "Não atribuída"}
                </td>
              )}
              <td className="py-1.5 text-right tabular-nums font-medium text-gray-900 whitespace-nowrap">
                {formatBRL(tx.valorBRL)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-300">
            <td
              colSpan={personId ? 2 : 3}
              className="pt-3 pb-1 font-bold text-gray-900"
            >
              Total
            </td>
            <td className="pt-3 pb-1 text-right font-bold tabular-nums text-gray-900">
              {formatBRL(total)}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Per-person summary for full invoice */}
      {resumo.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Resumo por pessoa</h2>
          <table className="w-full text-sm border-collapse">
            <tbody>
              {resumo.map(([nome, valor]) => (
                <tr key={nome} className="border-b border-gray-100">
                  <td
                    className={`py-1.5 ${
                      nome === "Não atribuídas" ? "text-orange-600" : "text-gray-800"
                    }`}
                  >
                    {nome}
                  </td>
                  <td className="py-1.5 text-right tabular-nums font-medium text-gray-900">
                    {formatBRL(valor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
