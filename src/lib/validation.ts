import { z } from "zod";
import { LINK_ACCESS, SHARE_ROLES } from "./access";

export const MAX_CONTENT_CHARS = 1_000_000;

export const title = z.string().trim().min(1, "Title cannot be empty").max(200, "Title is too long");

export const createDocumentSchema = z.object({ title: title.optional() });

export const updateDocumentSchema = z
  .object({
    title: title.optional(),
    content: z.string().max(MAX_CONTENT_CHARS, "Document is too large").optional(),
    // The revision this change was made on; see the conflict check in PATCH.
    baseRevision: z.number().int().min(0),
  })
  .refine((v) => v.title !== undefined || v.content !== undefined, "Nothing to update");

const role = z.enum(SHARE_ROLES, "Role must be viewer, commenter or editor");

export const shareSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  role: role.default("editor"),
});

export const updateShareSchema = z.object({ role });

// General access (link sharing) plus the owner-only share settings.
export const accessSettingsSchema = z
  .object({
    linkAccess: z.enum(LINK_ACCESS, "Access must be restricted or anyone").optional(),
    linkRole: role.optional(),
    editorsCanShare: z.boolean().optional(),
    viewersCanCopy: z.boolean().optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), "Nothing to update");

export const transferOwnershipSchema = z.object({ userId: z.string().min(1) });

export const copyDocumentSchema = z.object({
  title: title.optional(),
  shareWithSamePeople: z.boolean().default(false),
});

const commentBody = z.string().trim().min(1, "Comment cannot be empty").max(5000, "Comment is too long");

export const createCommentSchema = z.object({
  body: commentBody,
  quote: z.string().max(1000, "Selected text is too long").default(""),
  parentId: z.string().min(1).optional(),
});

export const updateCommentSchema = z
  .object({ body: commentBody.optional(), resolved: z.boolean().optional() })
  .refine((v) => v.body !== undefined || v.resolved !== undefined, "Nothing to update");

export const sessionSchema = z.object({ userId: z.string().min(1) });
