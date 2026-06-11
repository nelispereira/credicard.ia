"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

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

export default function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingHref, setLoadingHref] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const links = isAdmin ? adminLinks : userLinks;

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleNavClick(href: string) {
    if (pathname.startsWith(href)) {
      setOpen(false);
      return;
    }
    setLoadingHref(href);
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <div ref={ref} className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
      >
        {open ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {open && (
        <nav className="fixed top-14 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-md px-4 py-2">
          <div className="max-w-5xl mx-auto flex flex-col gap-1">
            {links.map(({ href, label }) => {
              const isLoading = isPending && loadingHref === href;
              return (
                <button
                  key={href}
                  onClick={() => handleNavClick(href)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors text-left flex items-center gap-2 ${
                    pathname.startsWith(href)
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
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
