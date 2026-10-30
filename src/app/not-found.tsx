import Link from "next/link";

export default function NotFound() {
  return (
    <div className="px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold">Document not found</h1>
      <p className="mt-2 text-slate-600">It doesn&apos;t exist or hasn&apos;t been shared with you.</p>
      <Link href="/" className="mt-6 inline-block text-blue-700 underline">
        Back to documents
      </Link>
    </div>
  );
}
