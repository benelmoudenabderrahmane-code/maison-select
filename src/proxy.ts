import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Basic-Auth gate for the admin area. (Next 16 renamed Middleware to Proxy.)
 * Credentials come from ADMIN_USER / ADMIN_PASSWORD in .env.local.
 */
export function proxy(request: NextRequest) {
  const expectedUser = process.env.ADMIN_USER || "admin";
  const expectedPass = process.env.ADMIN_PASSWORD || "";

  const header = request.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const sep = decoded.indexOf(":");
      const user = decoded.slice(0, sep);
      const pass = decoded.slice(sep + 1);
      if (user === expectedUser && pass === expectedPass) {
        return NextResponse.next();
      }
    } catch {
      /* fall through to challenge */
    }
  }

  return new NextResponse("Authentification requise.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Maison.Select Admin", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ["/admin/:path*"],
};
