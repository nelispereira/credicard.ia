import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Duplicado intencionalmente — auth-utils.ts importa Prisma e não roda no Edge runtime
const ADMIN_EMAIL = "nelisnnp@gmail.com";
const ADMIN_ROUTES = ["/pessoas", "/cartoes", "/usos", "/faturas"];

export async function proxy(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const adminUser = session.user.email === ADMIN_EMAIL;
  const { pathname } = req.nextUrl;

  if (!adminUser && ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/minha-conta", req.url));
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ["/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)"],
};
