import { handle, ok } from "@/lib/http";
import { requireUser } from "@/lib/auth/guard";

export function GET() {
  return handle(async () => {
    const user = await requireUser();
    return ok({ id: user.id, email: user.email, name: user.name, role: user.role });
  });
}
