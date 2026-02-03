import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { useNavigate } from "react-router-dom";


type RequestItem = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  location?: string | null;
  area?: string | null;
};

export default function AdminHome() {
  const { logout, user } = useAuth();
  const [items, setItems] = useState<RequestItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const navigate = useNavigate();


  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("Bloque B");
  const [area, setArea] = useState("Infraestructura");
  const [priority, setPriority] = useState<RequestItem["priority"]>("MEDIUM");
  const [creating, setCreating] = useState(false);

  async function load() {
    try {
      setLoadingList(true);
      setError(null);
      const data = await api<RequestItem[]>("/requests");
      setItems(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingList(false);
    }
  }

  async function createRequest(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      setError("Title and description are required");
      return;
    }

    try {
      setCreating(true);
      setError(null);

      await api<RequestItem>("/requests", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          location,
          area,
          priority,
        }),
      });

      // Reset form (title/desc)
      setTitle("");
      setDescription("");

      // Reload list
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin</h1>
            <p className="text-slate-600 text-sm">{user?.email}</p>
          </div>
          <div className="flex gap-2">
            <button className="rounded-lg border px-3 py-2" onClick={load}>
              Recargar
            </button>
            <button
              className="rounded-lg bg-black text-white px-3 py-2"
              onClick={logout}
            >
              Salir
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg bg-red-50 text-red-700 p-2 text-sm">
            {error}
          </div>
        )}

        {/* Create Request Form */}
        <div className="mt-4 rounded-2xl bg-white shadow p-4">
          <h2 className="font-semibold">Crear solicitud</h2>

          <form onSubmit={createRequest} className="mt-3 grid gap-3">
            <div>
              <label className="text-sm text-slate-600">Título</label>
              <input
                className="mt-1 w-full rounded-lg border p-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Internet caído"
              />
            </div>

            <div>
              <label className="text-sm text-slate-600">Descripción</label>
              <textarea
                className="mt-1 w-full rounded-lg border p-2"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe el problema…"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-sm text-slate-600">Ubicación</label>
                <input
                  className="mt-1 w-full rounded-lg border p-2"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm text-slate-600">Área</label>
                <input
                  className="mt-1 w-full rounded-lg border p-2"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm text-slate-600">Prioridad</label>
                <select
                  className="mt-1 w-full rounded-lg border p-2"
                  value={priority}
                  onChange={(e) =>
                    setPriority(e.target.value as RequestItem["priority"])
                  }
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  disabled={creating}
                  className="w-full rounded-lg bg-black text-white p-2 disabled:opacity-60"
                >
                  {creating ? "Creando..." : "Crear"}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* List */}
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Solicitudes</h2>
            {loadingList && (
              <span className="text-sm text-slate-500">Cargando…</span>
            )}
          </div>

          <div className="mt-2 space-y-2">
            {items.map((r) => (
              <button
                key={r.id}
                className="w-full text-left rounded-xl bg-white p-4 shadow cursor-pointer hover:bg-slate-50"
                onClick={() => navigate(`/admin/requests/${r.id}`)}
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <div className="font-semibold">{r.title}</div>
                    <div className="text-sm text-slate-600">
                      {r.location ?? "Sin ubicación"} • {r.priority} • {r.area ?? "Sin área"}
                    </div>
                    <div className="text-sm text-slate-600 mt-1">{r.description}</div>
                  </div>

                  <div className="text-sm font-semibold">{r.status}</div>
                </div>

                <div className="text-xs text-slate-500 mt-2">{r.id}</div>
              </button>
            ))}

          </div>
        </div>
      </div>
    </div>
  );
}
