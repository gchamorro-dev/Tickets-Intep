import { FastifyInstance } from "fastify";
import { prisma } from "../db";
import { authGuard } from "../plugins/auth";

export async function requestRoutes(app: FastifyInstance) {

  // Crear solicitud
  app.post("/requests", { preHandler: [authGuard] }, async (request, reply) => {
    const user = request.user as any;

    if (user.role !== "ADMIN") {
      return reply.status(403).send({ message: "Only admin can create requests" });
    }

    const body = request.body as {
      title?: string;
      description?: string;
      location?: string;
      area?: string;
      priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    };

    if (!body.title || !body.description) {
      return reply.status(400).send({ message: "title and description required" });
    }

    const reqCreated = await prisma.request.create({
      data: {
        title: body.title,
        description: body.description,
        location: body.location,
        area: body.area,
        priority: body.priority || "MEDIUM",
        createdById: user.sub,
      },
    });

    return reqCreated;
  });

  // Listar solicitudes
  app.get("/requests", { preHandler: [authGuard] }, async () => {
    return prisma.request.findMany({
      include: { tasks: true },
      orderBy: { createdAt: "desc" },
    });
  });


// Obtener una solicitud por id (con sus tareas)
  app.get(
    "/requests/:id",
    { preHandler: [authGuard] },
    async (request, reply) => {
      const params = request.params as { id: string };

      const req = await prisma.request.findUnique({
        where: { id: params.id },
        include: { tasks: true },
      });

      if (!req) {
        return reply.status(404).send({ message: "Request not found" });
      }

      return req;
    }
  );

}