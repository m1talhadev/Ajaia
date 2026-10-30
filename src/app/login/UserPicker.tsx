"use client";

import { useRouter } from "next/navigation";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { api, jsonBody } from "@/lib/api";
import type { UserSummary } from "@/lib/users";

export function UserPicker({ users, next }: { users: UserSummary[]; next: string }) {
  const router = useRouter();
  const { error, run } = useAsyncAction();

  const signIn = (userId: string) =>
    run(async () => {
      await api("/api/session", { method: "POST", ...jsonBody({ userId }) });
      router.push(next);
      router.refresh();
    });

  if (users.length === 0) return <p className="mt-6 text-sm text-red-600">No users found. Run `npm run db:seed`.</p>;

  return (
    <div className="mt-6 space-y-2">
      {users.map((u) => (
        <button
          key={u.id}
          onClick={() => signIn(u.id)}
          className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-left hover:border-blue-400"
        >
          <span className="font-medium">{u.name}</span>
          <span className="text-sm text-slate-500">{u.email}</span>
        </button>
      ))}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
