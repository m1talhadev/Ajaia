import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { getCurrentUser } from "./session";

export class HttpError extends Error {
  constructor(public status: number, message: string, public data?: Record<string, unknown>) {
    super(message);
  }
}

// Second argument of a dynamic route handler, e.g. RouteContext<{ id: string }>.
export type RouteContext<Params> = { params: Promise<Params> };

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Not signed in");
  return user;
}

export async function parseJson<T>(req: Request, schema: ZodType<T>): Promise<T> {
  const body = await req.json().catch(() => {
    throw new HttpError(400, "Invalid JSON body");
  });
  const result = schema.safeParse(body);
  if (!result.success) throw new HttpError(400, result.error.issues[0]?.message ?? "Invalid request");
  return result.data;
}

// Reads the `file` field of a multipart upload.
export async function readUploadedFile(req: Request, maxBytes: number, tooLarge: string) {
  const form = await req.formData().catch(() => {
    throw new HttpError(400, "Expected a multipart form upload");
  });
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) throw new HttpError(400, "Choose a non-empty file to upload");
  if (file.size > maxBytes) throw new HttpError(400, tooLarge);
  return { name: file.name, data: Buffer.from(await file.arrayBuffer()) };
}

// Wraps a route handler so thrown HttpErrors become JSON responses.
export function route<A extends unknown[]>(handler: (...args: A) => Promise<Response>) {
  return async (...args: A) => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof HttpError) return NextResponse.json({ ...err.data, error: err.message }, { status: err.status });
      console.error(err);
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
  };
}
