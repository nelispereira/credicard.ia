import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import NavLinks from "./NavLinks";
import MobileNav from "./MobileNav";
import { auth, signOut } from "@/auth";
import { isAdmin } from "@/lib/auth-utils";

async function handleSignOut() {
  "use server";
  await signOut({ redirectTo: "/" });
}

export default async function Nav() {
  const session = await auth();
  const adminUser = isAdmin(session?.user?.email);

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href={adminUser ? "/" : "/minha-conta"} className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100 text-sm">
          <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Credicard.ia
        </Link>

        <div className="flex items-center gap-1">
          <div className="hidden md:flex items-center">
            <NavLinks isAdmin={adminUser} />
          </div>
          <ThemeToggle />

          {session?.user && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200 dark:border-gray-700">
              {session.user.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={session.user.name ?? ""}
                  className="w-7 h-7 rounded-full"
                />
              )}
              <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:block max-w-30 truncate">
                {session.user.name}
              </span>
              <form action={handleSignOut}>
                <button
                  type="submit"
                  className="text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Sair
                </button>
              </form>
            </div>
          )}

          <MobileNav isAdmin={adminUser} />
        </div>
      </div>
    </header>
  );
}
