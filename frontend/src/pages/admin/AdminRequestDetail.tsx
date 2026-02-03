import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../api/client";

type Tech = {
  id: string;
  name: string;
  email: string;
};

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  assignedToId?: string | null;
  dueDate?: string | null;
};

type Request = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  location?: string | null;
  area?: string | null;
  tasks: Task[];
};

export default function AdminRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [request, setRequest] = useState<Request | null>(null);
  const [techs, setTechs] = useState<Tech[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [dueDate, setDueDate] = useState<string>(""); // yyyy-mm-dd
  const [creating, setCreating] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const [reqData, techData] = await Promise.all([
        api<Request>(`/requests/${id}`),
        api<Tech[]>("/users/techs"),
      ]);

      setRequest(reqData);
      setTechs(techData);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault();

    if (!taskTitle.trim()) {
      setError("Task title is required");
      return;
    }

    try {
      setCreating(true);
      setError(null);

      await api(`/requests/${id}/tasks`, {
        method: "POST",
        body: JSON.stringify({
          title: taskTitle,
          description: taskDesc || null,
          assignedToId: assignedToId || null,
          dueDate: dueDate ? `${dueDate}T00:00:00.000Z` : null,
        }),
      });

      // reset form
      setTaskTitle("");
      setTaskDesc("");
      setAssignedToId("");
      setDueDate("");

      // reload request with tasks
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  }

  function techName(id?: string | null) {
    if (!id) return "Sin asignar";
    return techs.find((t) => t.id === id)?.name ?? "Sin asignar";
  }

  useEffect(() => {
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Cargando...
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        No encontrado
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-3xl mx-auto">
        <button
          className="text-sm text-slate-600 mb-3"
          onClick={() => navigate("/admin")}
        >
          ← Volver
        </button>

        {error && (
          <div className="mb-3 rounded-lg bg-red-50 text-red-700 p-2 text-sm">
            {error}
          </div>
        )}

        {/* Info solicitud */}
        <div className="rounded-2xl bg-white shadow p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">{request.title}</h1>
              <p className="text-slate-600 mt-1">{request.description}</p>
              <div className="text-sm text-slate-500 mt-2">
                {request.location ?? "Sin ubicación"} •{" "}
                {request.area ?? "Sin área"} • {request.priority}
              </div>
            </div>

            <div className="text-sm font-semibold">{request.status}</div>
          </div>
        </div>

        {/* Crear tarea */}
        <div className="mt-4 rounded-2xl bg-white shadow p-4">
          <h2 className="font-semibold">Crear tarea</h2>

          <form onSubmit={createTask} className="mt-3 grid gap-3">
            <div>
              <label className="text-sm text-slate-600">Título</label>
              <input
                className="mt-1 w-full rounded-lg border p-2"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Ej: Revisar AP del Bloque B"
              />
            </div>

            <div>
              <label className="text-sm text-slate-600">Descripción</label>
              <textarea
                className="mt-1 w-full rounded-lg border p-2"
                rows={3}
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                placeholder="Instrucciones para el técnico..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-slate-600">Asignar a</label>
                <select
                  className="mt-1 w-full rounded-lg border p-2"
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                >
                  <option value="">Sin asignar</option>
                  {techs.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-600">Fecha límite</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border p-2"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <button
                  disabled={creating}
                  className="w-full rounded-lg bg-black text-white p-2 disabled:opacity-60"
                >
                  {creating ? "Creando..." : "Crear tarea"}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Tareas */}
        <div className="mt-4 rounded-2xl bg-white shadow p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Tareas</h2>
            <button className="text-sm underline" onClick={load}>
              Recargar
            </button>
          </div>

          {request.tasks.length === 0 && (
            <div className="text-sm text-slate-500 mt-2">No hay tareas aún</div>
          )}

          <div className="mt-2 space-y-2">
            {request.tasks.map((t) => (
              <div key={t.id} className="rounded-xl border p-3">
                <div className="flex justify-between gap-3">
                  <div>
                    <div className="font-medium">{t.title}</div>
                    {t.description && (
                      <div className="text-sm text-slate-600">
                        {t.description}
                      </div>
                    )}
                    <div className="text-xs text-slate-500 mt-1">
                      Técnico: {techName(t.assignedToId)}
                      {t.dueDate ? ` • Due: ${t.dueDate.slice(0, 10)}` : ""}
                    </div>
                  </div>

                  <div className="text-xs font-semibold">{t.status}</div>
                </div>

                <div className="text-xs text-slate-400 mt-2">{t.id}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
