import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { HttpError, parseJson, route } from "@/lib/http";
import { SESSION_COOKIE } from "@/lib/session";
import { sessionSchema } from "@/lib/validation";

export const POST = route(async (req: Request) => {
  const { userId } = await parseJson(req, sessionSchema);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, "User not found");
  const res = NextResponse.json({ user });
  res.cookies.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
});

export const DELETE = route(async () => {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
});
