"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      className="rounded-md border border-slate-300 px-3 py-1 hover:bg-slate-50"
      onClick={async () => {
        await api("/api/session", { method: "DELETE" });
        router.push("/login");
        router.refresh();
      }}
    >
      Switch user
    </button>
  );
}
