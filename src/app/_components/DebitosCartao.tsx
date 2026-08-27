"use client";

import { useState, useCallback, useEffect } from "react";
import { compraDiretaAplicaNoMes } from "@/lib/compras-diretas-utils";

const MESES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function labelMes(ano: number, mes: number) {
  return `${MESES_ABREV[mes - 1]}/${String(ano).slice(-2)}`;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function formatMesAno(d: Date) {
  const label = d.toLocaleDateString("pt-BR", { timeZone: "UTC", month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatVencimento(d: Date) {
  return d.toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit" });
}

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// A fatura é nomeada pelo mês do vencimento (ex.: fatura "de agosto" vence em 05/08),
// não pelo periodoFim, que é só a data da última transação lançada no arquivo.
function mesReferencia(f: { periodoFim: Date; vencimento: Date | null }) {
  return f.vencimento ?? f.periodoFim;
}

const tabButtonClass = (ativo: boolean) =>
  `shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
    ativo
      ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300"
      : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
  }`;

type PersonTransaction = {
  id: number;
  invoiceId: number;
  data: Date;
  descricao: string;
  valorBRL: number;
  invoice: {
    periodoFim: Date;
    vencimento: Date | null;
    creditCard: { nome: string; ultimos4: string };
  };
};

type CompraDiretaRaw = {
  id: number;
  descricao: string;
  valorTotal: number;
  numeroParcelas: number;
  dataInicio: Date;
};

type SharedInvoice = {
  id: number;
  periodoFim: Date;
  vencimento: Date | null;
  creditCard: { nome: string; ultimos4: string };
  transactions: {
    id: number;
    personId: number | null;
    data: Date;
    descricao: string;
    valorBRL: number;
    person: { nome: string } | null;
  }[];
};

// ---------- Transações pessoais: agrupadas por cartão, navegáveis por fatura ----------
// Agrupa pela fatura real (invoiceId), não pela data de cada transação: em compras
// parceladas a "data" da linha é a data da compra original, não o mês da cobrança.

type FaturaGroup = {
  invoiceId: number;
  periodoFim: Date;
  vencimento: Date | null;
  txs: PersonTransaction[];
};

type CardGroup = {
  cardNome: string;
  cardUltimos4: string;
  faturas: FaturaGroup[];
};

function buildCardGroups(transactions: PersonTransaction[]): CardGroup[] {
  const cardMeta = new Map<string, { nome: string; ultimos4: string }>();
  const byCard = new Map<string, Map<number, FaturaGroup>>();

  for (const tx of transactions) {
    const cardKey = `${tx.invoice.creditCard.nome}__${tx.invoice.creditCard.ultimos4}`;
    cardMeta.set(cardKey, { nome: tx.invoice.creditCard.nome, ultimos4: tx.invoice.creditCard.ultimos4 });

    if (!byCard.has(cardKey)) byCard.set(cardKey, new Map());
    const faturas = byCard.get(cardKey)!;
    if (!faturas.has(tx.invoiceId)) {
      faturas.set(tx.invoiceId, {
        invoiceId: tx.invoiceId,
        periodoFim: tx.invoice.periodoFim,
        vencimento: tx.invoice.vencimento,
        txs: [],
      });
    }
    faturas.get(tx.invoiceId)!.txs.push(tx);
  }

  return Array.from(byCard.entries()).map(([cardKey, faturas]) => {
    const meta = cardMeta.get(cardKey)!;
    const sorted = Array.from(faturas.values()).sort(
      (a, b) => mesReferencia(b).getTime() - mesReferencia(a).getTime()
    );
    return { cardNome: meta.nome, cardUltimos4: meta.ultimos4, faturas: sorted };
  });
}

function CardFaturasPessoais({
  grupo,
  cardKey,
  onFaturaAtivaChange,
}: {
  grupo: CardGroup;
  cardKey: string;
  onFaturaAtivaChange: (cardKey: string, mes: number, ano: number, subtotal: number) => void;
}) {
  const maisRecente = grupo.faturas[0];
  const [ativoId, setAtivoId] = useState(maisRecente.invoiceId);
  const faturaAtiva = grupo.faturas.find((f) => f.invoiceId === ativoId) ?? maisRecente;
  const subtotal = faturaAtiva.txs.reduce((s, t) => s + t.valorBRL, 0);
  const referencia = mesReferencia(faturaAtiva);
  const refMes = referencia.getUTCMonth() + 1;
  const refAno = referencia.getUTCFullYear();

  useEffect(() => {
    onFaturaAtivaChange(cardKey, refMes, refAno, subtotal);
  }, [cardKey, refMes, refAno, subtotal, onFaturaAtivaChange]);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
        <p className="font-semibold text-gray-900 dark:text-gray-100">
          {grupo.cardNome}{" "}
          <span className="font-mono text-sm font-normal text-gray-500 dark:text-gray-400">
            •••{grupo.cardUltimos4}
          </span>
        </p>
      </div>

      {grupo.faturas.length > 1 && (
        <div className="flex items-center gap-1 px-2 py-2 overflow-x-auto border-b border-gray-100 dark:border-gray-800">
          {grupo.faturas.map((f) => (
            <button
              key={f.invoiceId}
              onClick={() => setAtivoId(f.invoiceId)}
              className={tabButtonClass(f.invoiceId === ativoId)}
            >
              {labelMes(mesReferencia(f).getUTCFullYear(), mesReferencia(f).getUTCMonth() + 1)}
            </button>
          ))}
        </div>
      )}

      <table className="w-full text-sm">
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {faturaAtiva.txs.map((tx) => (
            <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <td className="px-4 py-2.5 tabular-nums text-gray-500 dark:text-gray-400 w-28">
                {formatDate(tx.data)}
              </td>
              <td className="py-2.5 pr-4 text-gray-800 dark:text-gray-200">{tx.descricao}</td>
              <td className="py-2.5 pr-4 text-right tabular-nums font-medium text-gray-900 dark:text-gray-100">
                {formatBRL(tx.valorBRL)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize mb-1">
          Fatura de {formatMesAno(mesReferencia(faturaAtiva))}
          {faturaAtiva.vencimento && (
            <span className="ml-1">· venc. {formatVencimento(faturaAtiva.vencimento)}</span>
          )}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Total da fatura</span>
          <span className="font-bold text-lg tabular-nums text-gray-900 dark:text-gray-100">
            {formatBRL(subtotal)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------- Faturas compartilhadas: agrupadas por cartão, navegáveis por mês ----------

type SharedCardGroup = {
  cardNome: string;
  cardUltimos4: string;
  invoices: SharedInvoice[];
};

function buildSharedCardGroups(sharedInvoices: SharedInvoice[]): SharedCardGroup[] {
  const cardMeta = new Map<string, { nome: string; ultimos4: string }>();
  const byCard = new Map<string, SharedInvoice[]>();

  for (const inv of sharedInvoices) {
    const cardKey = `${inv.creditCard.nome}__${inv.creditCard.ultimos4}`;
    cardMeta.set(cardKey, { nome: inv.creditCard.nome, ultimos4: inv.creditCard.ultimos4 });
    if (!byCard.has(cardKey)) byCard.set(cardKey, []);
    byCard.get(cardKey)!.push(inv);
  }

  return Array.from(byCard.entries()).map(([cardKey, invoices]) => {
    const meta = cardMeta.get(cardKey)!;
    const sorted = [...invoices].sort((a, b) => mesReferencia(b).getTime() - mesReferencia(a).getTime());
    return { cardNome: meta.nome, cardUltimos4: meta.ultimos4, invoices: sorted };
  });
}

function CardFaturaCompartilhada({ grupo }: { grupo: SharedCardGroup }) {
  const maisRecente = grupo.invoices[0];
  const [ativoId, setAtivoId] = useState(maisRecente.id);
  const invoiceAtiva = grupo.invoices.find((i) => i.id === ativoId) ?? maisRecente;

  const byPerson = new Map<string, { nome: string; txs: SharedInvoice["transactions"] }>();
  for (const tx of invoiceAtiva.transactions) {
    const key = tx.personId ? String(tx.personId) : "__none__";
    const nome = tx.person?.nome ?? "Não atribuído";
    if (!byPerson.has(key)) byPerson.set(key, { nome, txs: [] });
    byPerson.get(key)!.txs.push(tx);
  }
  const total = invoiceAtiva.transactions.reduce((s, t) => s + t.valorBRL, 0);

  return (
    <div className="bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-200 dark:border-indigo-800">
        <p className="font-semibold text-gray-900 dark:text-gray-100">
          {grupo.cardNome}{" "}
          <span className="font-mono text-sm font-normal text-gray-500 dark:text-gray-400">
            •••{grupo.cardUltimos4}
          </span>
        </p>
      </div>

      {grupo.invoices.length > 1 && (
        <div className="flex items-center gap-1 px-2 py-2 overflow-x-auto border-b border-indigo-100 dark:border-indigo-900/50">
          {grupo.invoices.map((inv) => (
            <button
              key={inv.id}
              onClick={() => setAtivoId(inv.id)}
              className={tabButtonClass(inv.id === invoiceAtiva.id)}
            >
              {labelMes(mesReferencia(inv).getUTCFullYear(), mesReferencia(inv).getUTCMonth() + 1)}
            </button>
          ))}
        </div>
      )}

      {Array.from(byPerson.entries()).map(([key, { nome, txs }]) => {
        const subtotal = txs.reduce((s, t) => s + t.valorBRL, 0);
        return (
          <div key={key}>
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                {nome}
              </span>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 tabular-nums">
                {formatBRL(subtotal)}
              </span>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {txs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-2.5 tabular-nums text-gray-500 dark:text-gray-400 w-28">
                      {formatDate(tx.data)}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-800 dark:text-gray-200">{tx.descricao}</td>
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

      <div className="px-4 py-3 bg-indigo-50 dark:bg-indigo-950/40 border-t border-indigo-200 dark:border-indigo-800">
        <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300 capitalize mb-1">
          Fatura de {formatMesAno(mesReferencia(invoiceAtiva))}
          {invoiceAtiva.vencimento && (
            <span className="ml-1">· venc. {formatVencimento(invoiceAtiva.vencimento)}</span>
          )}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">Total da fatura</span>
          <span className="font-bold text-lg tabular-nums text-indigo-900 dark:text-indigo-200">
            {formatBRL(total)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------- Componente principal ----------

type FaturaAtivaInfo = { mes: number; ano: number; subtotal: number };

export function DebitosCartao({
  transactions,
  sharedInvoices,
  comprasDiretas,
}: {
  transactions: PersonTransaction[];
  sharedInvoices: SharedInvoice[];
  comprasDiretas: CompraDiretaRaw[];
}) {
  const cardGroups = buildCardGroups(transactions);
  const sharedCardGroups = buildSharedCardGroups(sharedInvoices);

  const [faturaAtivaPorCartao, setFaturaAtivaPorCartao] = useState<Record<string, FaturaAtivaInfo>>(() => {
    const map: Record<string, FaturaAtivaInfo> = {};
    for (const g of cardGroups) {
      const f = g.faturas[0];
      if (!f) continue;
      const ref = mesReferencia(f);
      map[`${g.cardNome}__${g.cardUltimos4}`] = {
        mes: ref.getUTCMonth() + 1,
        ano: ref.getUTCFullYear(),
        subtotal: f.txs.reduce((s, t) => s + t.valorBRL, 0),
      };
    }
    return map;
  });

  const handleFaturaAtivaChange = useCallback((cardKey: string, mes: number, ano: number, subtotal: number) => {
    setFaturaAtivaPorCartao((prev) => {
      const atual = prev[cardKey];
      if (atual && atual.mes === mes && atual.ano === ano && atual.subtotal === subtotal) return prev;
      return { ...prev, [cardKey]: { mes, ano, subtotal } };
    });
  }, []);

  if (transactions.length === 0 && sharedInvoices.length === 0 && comprasDiretas.length === 0) {
    return (
      <p className="text-sm text-gray-400 dark:text-gray-600">
        Nenhuma transação encontrada até o momento.
      </p>
    );
  }

  // Mês de referência para as compras diretas: o da fatura selecionada no primeiro
  // cartão (caso comum de 1 cartão pessoal); sem cartão, cai no mês atual.
  const primeiraCardKey = cardGroups[0] ? `${cardGroups[0].cardNome}__${cardGroups[0].cardUltimos4}` : undefined;
  const referenciaAtiva = primeiraCardKey ? faturaAtivaPorCartao[primeiraCardKey] : undefined;
  const agora = new Date();
  const refMesComprasDiretas = referenciaAtiva?.mes ?? agora.getMonth() + 1;
  const refAnoComprasDiretas = referenciaAtiva?.ano ?? agora.getFullYear();

  const totalFaturasSelecionadas = Object.values(faturaAtivaPorCartao).reduce((s, f) => s + f.subtotal, 0);
  const totalComprasDiretasDoMes = comprasDiretas.reduce((s, c) => {
    const { aplica, valorMensal } = compraDiretaAplicaNoMes(c, refMesComprasDiretas, refAnoComprasDiretas);
    return aplica ? s + valorMensal : s;
  }, 0);
  const totalDoMes = totalFaturasSelecionadas + totalComprasDiretasDoMes;

  return (
    <>
      {(cardGroups.length > 0 || comprasDiretas.length > 0) && (
        <div className="space-y-4">
          <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl px-4 py-3 flex justify-between items-center">
            <div>
              <p className="font-semibold text-indigo-800 dark:text-indigo-300">Total do mês</p>
              <p className="text-xs text-indigo-600/80 dark:text-indigo-400/80">
                Compras diretas + fatura selecionada do(s) cartão(ões)
              </p>
            </div>
            <span className="font-bold text-xl tabular-nums text-indigo-900 dark:text-indigo-200">
              {formatBRL(totalDoMes)}
            </span>
          </div>

          {cardGroups.map((g) => {
            const cardKey = `${g.cardNome}__${g.cardUltimos4}`;
            return (
              <CardFaturasPessoais
                key={cardKey}
                grupo={g}
                cardKey={cardKey}
                onFaturaAtivaChange={handleFaturaAtivaChange}
              />
            );
          })}
        </div>
      )}

      {sharedCardGroups.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 pt-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Faturas compartilhadas
            </h2>
            <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-medium">
              Acesso completo
            </span>
          </div>

          {sharedCardGroups.map((g) => (
            <CardFaturaCompartilhada key={`${g.cardNome}__${g.cardUltimos4}`} grupo={g} />
          ))}
        </div>
      )}
    </>
  );
}
