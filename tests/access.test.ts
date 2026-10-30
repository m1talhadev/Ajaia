import { describe, expect, it } from "vitest";
import {
  type AccessDoc,
  accessIsViaLink,
  canComment,
  canCopy,
  canEdit,
  canManage,
  canShare,
  canView,
  checkOwnershipTarget,
  checkShareTarget,
  roleFor,
} from "@/lib/access";

const doc: AccessDoc = {
  ownerId: "alice",
  shares: [
    { userId: "bob", role: "editor" },
    { userId: "dave", role: "viewer" },
    { userId: "erin", role: "commenter" },
  ],
  linkAccess: "restricted",
  linkRole: "viewer",
  editorsCanShare: true,
  viewersCanCopy: true,
};

describe("document access rules", () => {
  it("gives the owner full control", () => {
    expect(roleFor(doc, "alice")).toBe("owner");
    expect(canView(doc, "alice")).toBe(true);
    expect(canEdit(doc, "alice")).toBe(true);
    expect(canManage(doc, "alice")).toBe(true);
  });

  it("lets an editor view, comment and edit, but not delete or change settings", () => {
    expect(roleFor(doc, "bob")).toBe("editor");
    expect(canView(doc, "bob")).toBe(true);
    expect(canComment(doc, "bob")).toBe(true);
    expect(canEdit(doc, "bob")).toBe(true);
    expect(canManage(doc, "bob")).toBe(false);
  });

  it("lets editors share only while 'Editors can change permissions and share' is on", () => {
    expect(canShare(doc, "bob")).toBe(true);
    expect(canShare({ ...doc, editorsCanShare: false }, "bob")).toBe(false);
    expect(canShare({ ...doc, editorsCanShare: false }, "alice")).toBe(true);
    expect(canShare(doc, "erin")).toBe(false);
  });

  it("lets a commenter view and comment but not edit", () => {
    expect(roleFor(doc, "erin")).toBe("commenter");
    expect(canComment(doc, "erin")).toBe(true);
    expect(canEdit(doc, "erin")).toBe(false);
  });

  it("limits download/print/copy for viewers and commenters when the setting is off", () => {
    const locked: AccessDoc = { ...doc, viewersCanCopy: false };
    expect(canCopy(doc, "dave")).toBe(true);
    expect(canCopy(locked, "dave")).toBe(false);
    expect(canCopy(locked, "erin")).toBe(false);
    expect(canCopy(locked, "bob")).toBe(true);
    expect(canCopy(locked, "carol")).toBe(false);
  });

  it("lets a viewer view only", () => {
    expect(roleFor(doc, "dave")).toBe("viewer");
    expect(canView(doc, "dave")).toBe(true);
    expect(canComment(doc, "dave")).toBe(false);
    expect(canEdit(doc, "dave")).toBe(false);
    expect(canManage(doc, "dave")).toBe(false);
  });

  it("denies everything to users the document isn't shared with", () => {
    expect(roleFor(doc, "carol")).toBeNull();
    expect(canView(doc, "carol")).toBe(false);
    expect(canEdit(doc, "carol")).toBe(false);
    expect(canManage(doc, "carol")).toBe(false);
  });

  it("takes effect immediately when a role changes", () => {
    const promoted: AccessDoc = { ...doc, shares: [{ userId: "dave", role: "editor" }] };
    expect(canEdit(promoted, "dave")).toBe(true);
    const demoted: AccessDoc = { ...doc, shares: [{ userId: "bob", role: "viewer" }] };
    expect(canEdit(demoted, "bob")).toBe(false);
  });

  describe("general access (anyone with the link)", () => {
    const viewLink: AccessDoc = { ...doc, linkAccess: "anyone", linkRole: "viewer" };
    const editLink: AccessDoc = { ...doc, linkAccess: "anyone", linkRole: "editor" };

    it("keeps restricted documents closed to people not added", () => {
      expect(canView(doc, "carol")).toBe(false);
      expect(accessIsViaLink(doc, "carol")).toBe(false);
    });

    it("gives anyone with a viewer link read-only access", () => {
      expect(roleFor(viewLink, "carol")).toBe("viewer");
      expect(canEdit(viewLink, "carol")).toBe(false);
      expect(accessIsViaLink(viewLink, "carol")).toBe(true);
    });

    it("gives anyone with an editor link edit access but never management", () => {
      expect(roleFor(editLink, "carol")).toBe("editor");
      expect(canEdit(editLink, "carol")).toBe(true);
      expect(canManage(editLink, "carol")).toBe(false);
    });

    it("uses the stronger of a person's own role and the link role", () => {
      expect(roleFor(editLink, "dave")).toBe("editor");
      expect(accessIsViaLink(editLink, "dave")).toBe(true);
      expect(roleFor(viewLink, "bob")).toBe("editor");
      expect(accessIsViaLink(viewLink, "bob")).toBe(false);
      expect(roleFor(editLink, "alice")).toBe("owner");
    });
  });

  it("rejects sharing with the owner or an existing collaborator", () => {
    expect(checkShareTarget(doc, "alice")).toMatchObject({ ok: false, status: 400 });
    expect(checkShareTarget(doc, "bob")).toMatchObject({ ok: false, status: 409 });
    expect(checkShareTarget(doc, "carol")).toEqual({ ok: true });
  });

  it("only transfers ownership to an existing editor", () => {
    expect(checkOwnershipTarget(doc, "bob")).toEqual({ ok: true });
    expect(checkOwnershipTarget(doc, "dave")).toMatchObject({ ok: false });
    expect(checkOwnershipTarget(doc, "carol")).toMatchObject({ ok: false });
    expect(checkOwnershipTarget(doc, "alice")).toMatchObject({ ok: false });
  });
});
