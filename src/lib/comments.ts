import { prisma } from "./db";
import { userSummarySelect } from "./users";

const author = { select: userSummarySelect } as const;

// Shape of a comment thread returned by the comments API.
const threadSelect = {
  id: true,
  quote: true,
  body: true,
  resolved: true,
  createdAt: true,
  author,
  replies: { select: { id: true, body: true, createdAt: true, author }, orderBy: { createdAt: "asc" } },
} as const;

export const loadThread = (id: string) => prisma.comment.findUniqueOrThrow({ where: { id }, select: threadSelect });

export const listThreads = (documentId: string) =>
  prisma.comment.findMany({ where: { documentId, parentId: null }, orderBy: { createdAt: "asc" }, select: threadSelect });

export type CommentThread = Awaited<ReturnType<typeof loadThread>>;
