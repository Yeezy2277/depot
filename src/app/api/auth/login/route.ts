import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { handle, ok, unauthorized } from "@/lib/http";
import { parseBody } from "@/lib/validate";
import { loginSchema } from "@/lib/schemas";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { clientKey, enforceLimit } from "@/lib/rate-limit";

export function POST(req: Request) {
  return handle(async () => {
    enforceLimit(clientKey(req, "login"), { limit: 10, windowMs: 60_000 });
    const body = await parseBody(req, loginSchema);

    const user = await db.query.users.findFirst({ where: eq(users.email, body.email) });
    // Constant-ish response: same error whether the email or the password is wrong.
    const okPw = user ? await verifyPassword(body.password, user.passwordHash) : false;
    if (!user || !okPw) throw unauthorized("Invalid email or password");

    await createSession({ sub: user.id, email: user.email, role: user.role });
    return ok({ id: user.id, email: user.email, name: user.name, role: user.role });
  });
}
