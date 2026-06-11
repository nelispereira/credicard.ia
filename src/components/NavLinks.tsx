"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition, useState } from "react";

const adminLinks = [
  { href: "/pessoas", label: "Pessoas" },
  { href: "/cartoes", label: "Cartões" },
  { href: "/usos", label: "Usos" },
  { href: "/faturas", label: "Faturas" },
  { href: "/gastos", label: "Gastos" },
  { href: "/usuarios", label: "Usuários" },
];

const userLinks = [
  { href: "/minha-conta", label: "Minha Conta" },
  { href: "/gastos", label: "Gastos" },
];

export default function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingHref, setLoadingHref] = useState<string | null>(null);
  const links = isAdmin ? adminLinks : userLinks;

  function handleClick(href: string) {
    if (pathname.startsWith(href)) return;
    setLoadingHref(href);
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <nav className="flex gap-0.5">
      {links.map(({ href, label }) => {
        const isActive = pathname.startsWith(href);
        const isLoading = isPending && loadingHref === href;

        return (
          <button
            key={href}
            onClick={() => handleClick(href)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
              isActive
                ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            {label}
            {isLoading && (
              <svg
                className="animate-spin h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            )}
          </button>
        );
      })}
    </nav>
  );
}
