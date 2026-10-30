import { compressImage } from "./compress-image";

export class ApiError extends Error {
  constructor(public status: number, message: string, public body: Record<string, unknown>) {
    super(message);
  }
}

// Client-side fetch helper that surfaces the API's { error } message.
export async function api<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.error ?? `Request failed (${res.status})`, body);
  return body as T;
}

export const jsonBody = (data: unknown): RequestInit => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

function uploadFile<T>(url: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  return api<T>(url, { method: "POST", body: form });
}

export const createDocument = () => api<{ id: string }>("/api/documents", { method: "POST", ...jsonBody({}) });

export const importDocument = (file: File) => uploadFile<{ id: string }>("/api/documents/import", file);

export async function uploadImage(docId: string, file: File) {
  const { url } = await uploadFile<{ url: string }>(`/api/documents/${docId}/images`, await compressImage(file));
  return url;
}
