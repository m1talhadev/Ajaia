"use client";

import { IconSearch } from "@tabler/icons-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ROLE_LABELS } from "@/lib/access";
import type { DocumentListItem } from "@/lib/documents";
import { Select, type SelectItem } from "./ui/Select";

type OwnerFilter = "anyone" | "me" | "not-me";
type Sort = "modified" | "title";

const OWNER_ITEMS: SelectItem<OwnerFilter>[] = [
  { value: "anyone", label: "Owned by anyone" },
  { value: "me", label: "Owned by me" },
  { value: "not-me", label: "Not owned by me" },
];
const SORT_ITEMS: SelectItem<Sort>[] = [
  { value: "modified", label: "Last modified" },
  { value: "title", label: "Title" },
];

// Google Drive–style list: search by title, filter by owner, sort; owned and
// shared documents stay in separate sections.
export function DocumentBrowser({ owned, shared }: { owned: DocumentListItem[]; shared: DocumentListItem[] }) {
  const [query, setQuery] = useState("");
  const [owner, setOwner] = useState<OwnerFilter>("anyone");
  const [sort, setSort] = useState<Sort>("modified");

  const prepare = useMemo(
    () => (rows: DocumentListItem[]) =>
      rows
        .filter((d) => d.title.toLowerCase().includes(query.trim().toLowerCase()))
        .sort((a, b) => (sort === "title" ? a.title.localeCompare(b.title) : b.updatedAt.localeCompare(a.updatedAt))),
    [query, sort],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-w-64 flex-1 items-center gap-2 rounded-full bg-slate-200/70 px-4 py-2 focus-within:bg-white focus-within:shadow">
          <IconSearch size={18} className="text-slate-500" />
          <input
            type="search"
            aria-label="Search documents"
            placeholder="Search documents"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
        <Select label="Owned by" value={owner} items={OWNER_ITEMS} onChange={setOwner} />
        <Select label="Sort by" value={sort} items={SORT_ITEMS} onChange={setSort} align="right" />
      </div>
      {owner !== "not-me" && <DocList heading="My documents" rows={prepare(owned)} empty={query ? "No matching documents." : "You haven't created any documents yet."} />}
      {owner !== "me" && <DocList heading="Shared with me" rows={prepare(shared)} empty={query ? "No matching documents." : "Nothing has been shared with you yet."} />}
    </div>
  );
}

function DocList({ heading, rows, empty }: { heading: string; rows: DocumentListItem[]; empty: string }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {heading} <span className="text-slate-400">({rows.length})</span>
      </h2>
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500">{empty}</p>
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {rows.map((d) => {
            const shared = d.role !== "owner";
            return (
              <li key={d.id}>
                <Link href={`/docs/${d.id}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50">
                  <span className="truncate font-medium">{d.title}</span>
                  <span className="flex shrink-0 items-center gap-3 text-xs text-slate-500">
                    {shared && <span>by {d.ownerName}</span>}
                    <span>{new Date(d.updatedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</span>
                    <span className={`rounded-full px-2 py-0.5 font-medium ${shared ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>
                      {ROLE_LABELS[d.role]}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
