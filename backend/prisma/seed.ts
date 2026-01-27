import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("intep2026", 10);

  // Admin
  await prisma.user.upsert({
    where: { email: "admin@intep.edu.co" },
    update: {},
    create: {
      name: "Admin INTEP",
      email: "admin@intep.edu.co",
      password: passwordHash,
      role: Role.ADMIN,
    },
  });

  // 3 técnicos
  const techs = [
    { name: "Tecnico 1", email: "tech1@intep.edu.co" },
    { name: "Tecnico 2", email: "tech2@intep.edu.co" },
    { name: "Tecnico 3", email: "tech3@intep.edu.co" },
  ];

  for (const t of techs) {
    await prisma.user.upsert({
      where: { email: t.email },
      update: {},
      create: {
        name: t.name,
        email: t.email,
        password: passwordHash,
        role: Role.TECH,
      },
    });
  }

  console.log("✅ Seed listo. Usuarios creados/actualizados.");
  console.log("🔑 Contraseña para todos: intep2026");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
