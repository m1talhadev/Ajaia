import { redirect } from "next/navigation";
import { listDocuments } from "@/lib/documents";
import { getCurrentUser } from "@/lib/session";
import { DashboardActions } from "@/components/DashboardActions";
import { DocumentBrowser } from "@/components/DocumentBrowser";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { owned, shared } = await listDocuments(user.id);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Documents</h1>
        <DashboardActions />
      </div>
      <DocumentBrowser owned={owned} shared={shared} />
    </div>
  );
}
