import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";

type RequestItem = {
  id: string;
  title: string;
  status: string;
  priority: string;
  location?: string | null;
};

export default function AdminHome() {
  const { logout, user } = useAuth();
  const [items, setItems] = useState<RequestItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      const data = await api<RequestItem[]>("/requests");
      setItems(data);
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-3xl mx-auto">
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

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 text-red-700 p-2 text-sm">
            {error}
          </div>
        )}

        <div className="mt-4 space-y-2">
          {items.map((r) => (
            <div key={r.id} className="rounded-xl bg-white p-4 shadow">
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">{r.title}</div>
                  <div className="text-sm text-slate-600">
                    {r.location ?? "Sin ubicación"} • {r.priority}
                  </div>
                </div>
                <div className="text-sm font-semibold">{r.status}</div>
              </div>
              <div className="text-xs text-slate-500 mt-2">{r.id}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
