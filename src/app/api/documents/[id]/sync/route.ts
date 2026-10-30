import { NextResponse } from "next/server";
import { loadDocument, type SyncResponse } from "@/lib/documents";
import { requireUser, route, type RouteContext } from "@/lib/http";

// Polled by open documents to pick up changes saved by other people. Without
// `?revision=`, the latest content is always returned.
export const GET = route(async (req: Request, { params }: RouteContext<{ id: string }>) => {
  const user = await requireUser();
  const doc = await loadDocument((await params).id, user.id, "view");
  const known = new URL(req.url).searchParams.get("revision");
  const body: SyncResponse =
    known !== null && Number(known) === doc.revision
      ? { revision: doc.revision }
      : { revision: doc.revision, latest: { title: doc.title, content: doc.content, editedBy: doc.lastEditedBy } };
  return NextResponse.json(body);
});
