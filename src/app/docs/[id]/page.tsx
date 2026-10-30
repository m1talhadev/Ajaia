import { notFound, redirect } from "next/navigation";
import { loadDocument, serializeDocument } from "@/lib/documents";
import { HttpError } from "@/lib/http";
import { getCurrentUser } from "@/lib/session";
import { DocumentEditor } from "@/components/DocumentEditor";

export const dynamic = "force-dynamic";

export default async function DocPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/docs/${id}`)}`);
  try {
    const doc = await loadDocument(id, user.id, "view");
    return <DocumentEditor initial={serializeDocument(doc, user.id)} currentUserId={user.id} />;
  } catch (err) {
    if (err instanceof HttpError) notFound();
    throw err;
  }
}
