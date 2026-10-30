import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const USERS = [
  { email: "alice@ajaia.test", name: "Alice Owner" },
  { email: "bob@ajaia.test", name: "Bob Collaborator" },
  { email: "carol@ajaia.test", name: "Carol Outsider" },
  { email: "dave@ajaia.test", name: "Dave Viewer" },
  { email: "erin@ajaia.test", name: "Erin Commenter" },
];

async function main() {
  for (const u of USERS) {
    await prisma.user.upsert({ where: { email: u.email }, update: { name: u.name }, create: u });
  }
  const idOf = async (email: string) => (await prisma.user.findUniqueOrThrow({ where: { email } })).id;
  const [alice, bob, dave, erin] = await Promise.all(
    ["alice", "bob", "dave", "erin"].map((name) => idOf(`${name}@ajaia.test`)),
  );

  const content =
    "<h1>Welcome</h1><p>This document is owned by <strong>Alice</strong> and shared with <em>Bob</em> as an editor, " +
    "<em>Erin</em> as a commenter and <em>Dave</em> as a viewer.</p>" +
    "<ul><li>Use Switch user in the top bar to see each role</li><li>Erin can comment but not edit</li>" +
    "<li>Dave can read but not edit</li><li>Carol cannot see this document</li></ul>";
  const doc =
    (await prisma.document.findFirst({ where: { ownerId: alice, title: "Welcome to Ajaia Docs" } })) ??
    (await prisma.document.create({ data: { title: "Welcome to Ajaia Docs", ownerId: alice, content } }));

  for (const [userId, role] of [
    [bob, "editor"],
    [dave, "viewer"],
    [erin, "commenter"],
  ] as const) {
    await prisma.documentShare.upsert({
      where: { documentId_userId: { documentId: doc.id, userId } },
      update: {},
      create: { documentId: doc.id, userId, role },
    });
  }
  console.log("Seeded users:", USERS.map((u) => u.email).join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
