import { FastifyInstance } from "fastify";
import { prisma } from "../db";
import { authGuard } from "../plugins/auth";

export async function taskRoutes(app: FastifyInstance) {
  // Admin: crear una tarea dentro de una solicitud y asignarla
  app.post(
    "/requests/:id/tasks",
    { preHandler: [authGuard] },
    async (request, reply) => {
      const user = request.user as any;
      if (user.role !== "ADMIN") {
        return reply.status(403).send({ message: "Only admin can create tasks" });
      }

      const params = request.params as { id: string };
      const body = request.body as {
        title?: string;
        description?: string;
        assignedToId?: string; // id del técnico
        dueDate?: string;      // "2026-01-27" o ISO
      };

      if (!body.title) {
        return reply.status(400).send({ message: "title required" });
      }

      // Verificar que la solicitud existe
      const reqExists = await prisma.request.findUnique({ where: { id: params.id } });
      if (!reqExists) {
        return reply.status(404).send({ message: "Request not found" });
      }

      // Si mandan assignedToId, verificar que sea técnico activo
      if (body.assignedToId) {
        const tech = await prisma.user.findUnique({ where: { id: body.assignedToId } });
        if (!tech || tech.role !== "TECH" || !tech.isActive) {
          return reply.status(400).send({ message: "assignedToId is not a valid tech" });
        }
      }

      const task = await prisma.task.create({
        data: {
          title: body.title,
          description: body.description,
          requestId: params.id,
          assignedToId: body.assignedToId || null,
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
        },
      });

      // Si creamos tareas, la solicitud pasa a ASSIGNED
      if (body.assignedToId) {
        await prisma.request.update({
          where: { id: params.id },
          data: { status: "ASSIGNED" },
        });
      }

      return task;
    }
  );

  // Técnico: ver "mi día" (tareas asignadas)
  app.get("/tasks/my-today", { preHandler: [authGuard] }, async (request) => {
    const user = request.user as any;
    if (user.role !== "TECH") return [];

    // Rango de "hoy" en hora local (simple MVP)
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    return prisma.task.findMany({
      where: {
        assignedToId: user.sub,
        status: { not: "DONE" },
        OR: [
          { dueDate: { gte: start, lte: end } },
          { dueDate: null }, // opcional: tareas sin fecha
        ],
      },
      include: {
        request: { select: { id: true, title: true, location: true, priority: true, status: true } },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    });
  });



  // Técnico: actualizar estado de una tarea
  app.patch("/tasks/:id", { preHandler: [authGuard] }, async (request, reply) => {
    const user = request.user as any;
    const params = request.params as { id: string };
    const body = request.body as { status?: "TODO" | "IN_PROGRESS" | "DONE" };

    if (!body.status) {
      return reply.status(400).send({ message: "status required" });
    }

    const task = await prisma.task.findUnique({ where: { id: params.id } });
    if (!task) return reply.status(404).send({ message: "Task not found" });

    // Un técnico solo puede cambiar tareas asignadas a él
    if (user.role === "TECH" && task.assignedToId !== user.sub) {
      return reply.status(403).send({ message: "Not your task" });
    }

    const updated = await prisma.task.update({
      where: { id: params.id },
      data: {
        status: body.status,
        completedAt: body.status === "DONE" ? new Date() : null,
      },
    });

    return updated;
  });
}
