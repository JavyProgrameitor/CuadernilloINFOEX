import React, { useEffect, useMemo, useState } from "react";
import supabase, { hasSupabase } from "../lib/supabaseClient";

type CuadernilloRow = {
  id: string;
  created_at: string | null;
  session_key: string;
  provincia: string | null;
  zona: string | null;
  municipio: string | null;
  tipo: "unidad" | "caseta" | null;
  unidad: string | null;
  caseta: string | null;
  nombre_centro: string | null;
  fecha: string | null;
  componente_nombre: string | null;
  componente_apellidos: string | null;
  componente_numero: string | null;
  codigo: string;
  abono_df: boolean | null;
  superior_categoria: boolean | null;
  jornada_ini: string | null;
  jornada_fin: string | null;
  horas_extra: number | null;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

// Normaliza: acentos y mayúsculas
const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const Page6: React.FC = () => {
  // ---------- Login “admin / admin” ----------
  const [authed, setAuthed] = useState<boolean>(
    () => sessionStorage.getItem("admin.auth") === "1"
  );
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (norm(user) === "admin" && pass === "admin") {
      sessionStorage.setItem("admin.auth", "1");
      setAuthed(true);
      setLoginError(null);
      return;
    }
    setLoginError("Credenciales incorrectas.");
  }

  function handleLogout() {
    sessionStorage.removeItem("admin.auth");
    setAuthed(false);
    setUser("");
    setPass("");
  }

  // ---------- Estado de datos / filtros ----------
  const [rows, setRows] = useState<CuadernilloRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [mode, setMode] = useState<"centro" | "componente">("centro");
  const [query, setQuery] = useState("");
  const [fecha, setFecha] = useState<string>(todayISO());
  const [pageSize, setPageSize] = useState<number>(100);
  const [page, setPage] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);

  const q = useMemo(() => query.trim(), [query]);

  async function fetchRows() {
    if (!hasSupabase) {
      setError(
        "Faltan variables de entorno de Supabase (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY)."
      );
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const from = page * pageSize;
      const to = from + pageSize - 1;

      let req = supabase
        .from("cuadernillo")
        .select("*", { count: "exact" })
        .eq("fecha", fecha);

      if (q) {
        if (mode === "centro") {
          req = req.or(`unidad.ilike.%${q}%,caseta.ilike.%${q}%`);
        } else {
          req = req.or(
            `componente_nombre.ilike.%${q}%,componente_apellidos.ilike.%${q}%`
          );
        }
      }

      req = req
        .order("tipo", { ascending: true, nullsFirst: true })
        .order("unidad", { ascending: true, nullsFirst: true })
        .order("caseta", { ascending: true, nullsFirst: true })
        .order("componente_apellidos", { ascending: true, nullsFirst: true })
        .range(from, to);

      const { data, error, count } = await req;
      if (error) throw error;

      setRows((data ?? []) as CuadernilloRow[]);
      setTotal(count ?? 0);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  // Cargar sólo si hay auth
  useEffect(() => {
    if (authed) fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, fecha, mode, q, page, pageSize]);

  // Realtime sólo si hay auth
  useEffect(() => {
    if (!authed) return;
    const channel = supabase
      .channel("rt-cuadernillo-admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cuadernillo" },
        () => fetchRows()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  const unidadOCaseta = (r: CuadernilloRow) =>
    r.tipo === "unidad" ? r.unidad ?? "" : r.tipo === "caseta" ? r.caseta ?? "" : "";

  //const totalPages = Math.max(1, Math.ceil(total / pageSize));
 // const canPrev = page > 0;
 // const canNext = page + 1 < totalPages;

  function exportCsv() {
    const headers = [
      "fecha",
      "unidad_caseta",
      "componente_nombre",
      "componente_apellidos",
      "componente_numero",
      "codigo",
      "jornada_ini",
      "jornada_fin",
      "horas_extra",
    ];
    const lines = rows.map((r) =>
      [
        r.fecha ?? "",
        unidadOCaseta(r),
        r.componente_nombre ?? "",
        r.componente_apellidos ?? "",
        r.componente_numero ?? "",
        r.codigo ?? "",
        r.jornada_ini ?? "",
        r.jornada_fin ?? "",
        r.horas_extra ?? "",
      ]
        .map((x) => `"${String(x).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cuadernillo_${fecha}_p${page + 1}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---------- Vista de Login ----------
  if (!authed) {
    return (
      <section className="p-4 flex items-center justify-center min-h-[60vh]">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm space-y-4 rounded-2xl border border-white-10 bg-zinc-900 p-6 text-white"
        >
          <h1 className="text-xl font-semibold">Acceso administración</h1>

          <div>
            <label className="mb-1 block text-xs text-white/70">Usuario</label>
            <input
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="w-full rounded-xl border border-white-10 bg-black-30 p-2 outline-none"
              placeholder="admin"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-white/70">Contraseña</label>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full rounded-xl border border-white-10 bg-black-30 p-2 outline-none"
              placeholder="••••••"
            />
          </div>

          {loginError && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800">
              {loginError}
            </div>
          )}
          <button
            type="submit"
            className="w-full rounded-xl border bg-green-700 px-3 py-2 font-semibold text-black hover:bg-green-500 transition-colors"
          >
            Entrar
          </button>
        </form>
      </section>
    );
  }

  // ---------- Vista principal (autorizada) ----------
  return (
    <section className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Administración · Cuadernillo</h1>
        <button onClick={handleLogout}  className="rounded-xl bg-lime-600 px-4 py-2 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          Salir
        </button>
      </div>

      {!hasSupabase && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          Configura <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code>.
        </div>
      )}

      {loading && <div>Cargando…</div>}
      {error && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      {/* Controles */}
      <div className="flex flex-wrap items-center gap-2 font-bold">
      <p className="">Busqueda por día</p>  
        <div className="flex items-center rounded-xl border px-3 py-2">
          <span className="mr-2 text-xm ">Fecha</span>
          <input
            type="date"
            value={fecha}
            onChange={(e) => {
              setPage(0);
              setFecha(e.target.value);
            }}
          />
        </div>

        <select
          value={mode}
          onChange={(e) => {
            setPage(0);
            setMode(e.target.value as "centro" | "componente");
          }}
          className="rounded-xl border px-3 py-2 bg-transparent"
          title="Campo de búsqueda"
        >
          <option className="bg-gray-900" value="centro">
            Buscar por Unidad o Caseta
          </option>
          <option className="bg-gray-900" value="componente">
            Buscar por componente
          </option>
        </select>

        <input
          value={query}
          onChange={(e) => {
            setPage(0);
            setQuery(e.target.value);
          }}
          placeholder={
            mode === "centro" ? "Escribe unidad o caseta…" : "Escribe nombre o apellidos…"
          }
          className="min-w-[260px] flex-1 rounded-xl border px-3 py-2 bg-transparent"
        />

        <select
          value={pageSize}
          onChange={(e) => {
            setPage(0);
            setPageSize(parseInt(e.target.value, 10));
          }}
          className="rounded-xl border px-3 py-2 bg-transparent"
          title="Filas por página"
        >
          <option className="bg-gray-900" value={50}>50</option>
          <option className="bg-gray-900" value={100}>100</option>
          <option className="bg-gray-900" value={200}>200</option>
        </select>

        <button
          onClick={exportCsv}
          className="rounded-xl border px-3 py-2 text-sm"
          title="Exportar CSV (página actual)"
        >
          Exportar CSV
        </button>

        <div className="ml-auto flex items-center gap-2 text-sm">
          <button
            disabled={page <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className={`rounded-xl border px-3 py-2 ${page <= 0 ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            ◀ Anterior
          </button>
          <span>
            Página {page + 1} / {Math.max(1, Math.ceil(total / pageSize))} · {total} registros
          </span>
          <button
            disabled={page + 1 >= Math.max(1, Math.ceil(total / pageSize))}
            onClick={() => setPage((p) => p + 1)}
            className={`rounded-xl border px-3 py-2 ${page + 1 >= Math.max(1, Math.ceil(total / pageSize)) ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Siguiente ▶
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-700 text-left">
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2">Unidad/Caseta</th>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Apellidos</th>
              <th className="px-3 py-2">Nº</th>
              <th className="px-3 py-2">Código</th>
              <th className="px-3 py-2">Jornada</th>
              <th className="px-3 py-2">Horas Extra</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const centro = unidadOCaseta(r);
              return (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2">{r.fecha ?? ""}</td>
                  <td className="px-3 py-2">{centro}</td>
                  <td className="px-3 py-2">{r.componente_nombre ?? ""}</td>
                  <td className="px-3 py-2">{r.componente_apellidos ?? ""}</td>
                  <td className="px-3 py-2">{r.componente_numero ?? ""}</td>
                  <td className="px-3 py-2">{r.codigo ?? ""}</td>
                  <td className="px-3 py-2">
                    {r.jornada_ini ?? ""}
                    {r.jornada_ini || r.jornada_fin ? " – " : ""}
                    {r.jornada_fin ?? ""}
                  </td>
                  <td className="px-3 py-2">{r.horas_extra ?? ""}</td>
                </tr>
              );
            })}
            {rows.length === 0 && !loading && (
              <tr>
                <td className="px-3 py-4 text-gray-500" colSpan={8}>
                  No hay resultados para los filtros actuales.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {error && (
        <p className="text-xs text-amber-400">
          Si la búsqueda va lenta con muchos datos, aplica una fecha concreta o reduce el tamaño de página.
        </p>
      )}
    </section>
  );
};

export default Page6;
