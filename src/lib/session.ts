import { cookies } from "next/headers";
import { prisma } from "./db";

// Mock auth: the signed-in user is just a user id in an httpOnly cookie.
// Good enough to demonstrate ownership and sharing; not real authentication.
export const SESSION_COOKIE = "ajaia_uid";

export async function getCurrentUser() {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}
