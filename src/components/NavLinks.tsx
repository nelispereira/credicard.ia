"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const adminLinks = [
  { href: "/pessoas", label: "Pessoas" },
  { href: "/cartoes", label: "Cartões" },
  { href: "/usos", label: "Usos" },
  { href: "/faturas", label: "Faturas" },
];

const userLinks = [{ href: "/minha-conta", label: "Minha Conta" }];

export default function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const links = isAdmin ? adminLinks : userLinks;

  return (
    <nav className="flex gap-0.5">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            pathname.startsWith(href)
              ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
