import { prisma } from "@/lib/db";
import { userSummarySelect } from "@/lib/users";
import { UserPicker } from "./UserPicker";

export const dynamic = "force-dynamic";

// Only same-site paths are honoured, so `next` can't redirect off-site.
const safeNext = (next?: string) => (next?.startsWith("/") && !next.startsWith("//") ? next : "/");

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  const users = await prisma.user.findMany({ orderBy: { email: "asc" }, select: userSummarySelect });
  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <p className="mt-2 text-sm text-slate-600">
        Demo mode: pick a seeded account. Switch users to see sharing from both sides.
      </p>
      {next !== "/" && (
        <p className="mt-4 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-900">Sign in to open the shared document.</p>
      )}
      <UserPicker users={users} next={next} />
    </div>
  );
}
