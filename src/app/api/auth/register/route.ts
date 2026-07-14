import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { handle, ok, conflict, forbidden } from "@/lib/http";
import { parseBody } from "@/lib/validate";
import { registerSchema } from "@/lib/schemas";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { clientKey, enforceLimit } from "@/lib/rate-limit";

export function POST(req: Request) {
  return handle(async () => {
    enforceLimit(clientKey(req, "register"), { limit: 5, windowMs: 60_000 });
    const body = await parseBody(req, registerSchema);

    const required = process.env.SIGNUP_INVITE_CODE;
    if (required && body.invite !== required) {
      throw forbidden("A valid invite code is required to register");
    }

    const existing = await db.query.users.findFirst({ where: eq(users.email, body.email) });
    if (existing) throw conflict("An account with that email already exists");

    const [user] = await db
      .insert(users)
      .values({
        email: body.email,
        name: body.name,
        passwordHash: await hashPassword(body.password),
      })
      .returning({ id: users.id, email: users.email, name: users.name, role: users.role });

    await createSession({ sub: user!.id, email: user!.email, role: user!.role });
    return ok(user, { status: 201 });
  });
}
