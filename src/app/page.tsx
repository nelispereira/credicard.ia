import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth-utils";

const cards = [
  {
    href: "/pessoas",
    title: "Pessoas",
    desc: "Cadastre as pessoas que usam os cartões",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: "/cartoes",
    title: "Cartões",
    desc: "Gerencie os cartões de crédito compartilhados",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    href: "/usos",
    title: "Registrar Uso",
    desc: "Informe quem usou qual cartão em cada dia",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    href: "/faturas",
    title: "Faturas",
    desc: "Importe o TXT da fatura e veja o rateio por pessoa",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

export default async function Home() {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) redirect("/minha-conta");

  return (
    <div className="mt-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-1">
          Credicard.ia
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Controle de uso e rateio de faturas de cartões de crédito compartilhados.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map(({ href, title, desc, icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-start gap-4 p-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all"
          >
            <div className="shrink-0 p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 transition-colors">
              {icon}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-0.5">{title}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
