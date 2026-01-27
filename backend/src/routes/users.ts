import { FastifyInstance } from "fastify";
import { prisma } from "../db";
import { authGuard } from "../plugins/auth";

export async function userRoutes(app: FastifyInstance) {
  // Listar técnicos (solo admin)
  app.get("/users/techs", { preHandler: [authGuard] }, async (request, reply) => {
    const user = request.user as any;

    if (user.role !== "ADMIN") {
      return reply.status(403).send({ message: "Only admin can list techs" });
    }

    return prisma.user.findMany({
      where: { role: "TECH", isActive: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });
  });
}
