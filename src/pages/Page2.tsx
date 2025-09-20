import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase, { hasSupabase } from "../lib/supabaseClient";

type Header = {
  zona: string;
  municipio: string;
  nombreCentro: string;
  tipo?: "unidad" | "caseta";
  unidad?: string;
  caseta?: string;
  dia?: number;
  mes?: number;
  anio?: number;
};

type Componente = {
  id: string;
  nombre: string;
  apellidos: string;
  numero?: string;
};

type Codigo = "" | "JR" | "TH" | "TC" | "V" | "B";
type HHMM = string; // "08:00", "14:30", etc.

type ParteFila = {
  componenteId: string;
  codigo: Codigo;
  abonoDF: boolean;
  superiorCategoria: boolean;
  jornada: { ini: HHMM; fin: HHMM };
  salida: { ini: HHMM; fin: HHMM };
};

export default function Page2() {
  const nav = useNavigate();

  // --------- Cabecera (cargada desde Page1) ----------
  const [header, setHeader] = useState<Header | null>(null);
  const now = new Date();
  const [dia, setDia] = useState<number>(now.getDate());
  const [mes, setMes] = useState<number>(now.getMonth() + 1);
  const [anio, setAnio] = useState<number>(now.getFullYear());

  useEffect(() => {
    const raw = localStorage.getItem("infoex:header");
    if (raw) {
      const h = JSON.parse(raw) as Header;
      setHeader(h);
      if (h.dia) setDia(h.dia);
      if (h.mes) setMes(h.mes);
      if (h.anio) setAnio(h.anio);
    }
  }, []);

  // --------- Componentes (desde Page3) ----------
  const [componentes, setComponentes] = useState<Componente[]>([]);
  useEffect(() => {
    const raw = localStorage.getItem("infoex:componentes");
    if (raw) setComponentes(JSON.parse(raw));
  }, []);

  // --------- Estado del parte ----------
  const storageKey = useMemo(() => {
    const unidadOCaseta = header?.tipo === "caseta" ? header?.caseta : header?.unidad;
    const mm = String(mes).padStart(2, "0");
    const dd = String(dia).padStart(2, "0");
    return `infoex:parte:${anio}-${mm}-${dd}:${header?.tipo ?? "NA"}:${unidadOCaseta ?? "SIN"}`;
  }, [anio, mes, dia, header?.tipo, header?.unidad, header?.caseta]);

  const partePk = storageKey.replace("infoex:parte:", ""); // usamos esta pk para Supabase

  const [filas, setFilas] = useState<ParteFila[]>([]);
  const [horasExtrasTotal, setHorasExtrasTotal] = useState<string>(""); // puede ser "2" o "2.5" o "02:30"

  // Cargar parte guardado (localStorage o Supabase)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Primero localStorage (fallback inmediato)
      const raw = localStorage.getItem(storageKey);
      if (raw && !cancelled) {
        try {
          const saved = JSON.parse(raw);
          if (saved?.filas) setFilas(saved.filas);
          if (saved?.horasExtrasTotal) setHorasExtrasTotal(saved.horasExtrasTotal);
        } catch {
          // ignore
        }
      }
      // Si hay supabase, intentamos cargar último estado
      if (hasSupabase && header) {
        const { data: parte, error } = await supabase
          .from("partes")
          .select("*")
          .eq("pk", partePk)
          .maybeSingle();

        if (!cancelled && !error && parte) {
          if (parte.horas_extras_total != null) {
            setHorasExtrasTotal(String(parte.horas_extras_total));
          }
          const { data: lineas } = await supabase
            .from("parte_filas")
            .select("*")
            .eq("parte_pk", partePk)
            .order("id", { ascending: true });

          if (lineas) {
            const mapped: ParteFila[] = lineas.map((r: any) => ({
              componenteId: r.componente_id,
              codigo: (r.codigo ?? "") as Codigo,
              abonoDF: !!r.abono_df,
              superiorCategoria: !!r.superior_categoria,
              jornada: { ini: r.jornada_ini ?? "", fin: r.jornada_fin ?? "" },
              salida: { ini: r.salida_ini ?? "", fin: r.salida_fin ?? "" },
            }));
            setFilas(mapped);
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [storageKey, partePk, header, hasSupabase]);

  // Sincronizar filas con componentes (crea filas nuevas si hace falta y conserva las existentes)
  useEffect(() => {
    if (componentes.length === 0) {
      setFilas([]);
      return;
    }
    setFilas((prev) => {
      const byId = new Map(prev.map((f) => [f.componenteId, f]));
      const merged: ParteFila[] = componentes.map((c) => {
        if (byId.has(c.id)) return byId.get(c.id)!;
        return {
          componenteId: c.id,
          codigo: "",
          abonoDF: false,
          superiorCategoria: false,
          jornada: { ini: "", fin: "" },
          salida: { ini: "", fin: "" },
        };
      });
      return merged;
    });
  }, [componentes]);

  // Guardado: localStorage inmediato + Supabase (debounced)
  useEffect(() => {
    // Local
    localStorage.setItem(
      storageKey,
      JSON.stringify({ filas, horasExtrasTotal })
    );

    // Supabase
    if (!hasSupabase || !header) return;

    const t = setTimeout(async () => {
      const fechaISO = new Date(anio, mes - 1, dia).toISOString().slice(0, 10);

      // Upsert en "partes"
      await supabase.from("partes").upsert(
        {
          pk: partePk,
          fecha: fechaISO,
          zona: header.zona,
          municipio: header.municipio,
          tipo: header.tipo ?? null,
          unidad: header.unidad ?? null,
          caseta: header.caseta ?? null,
          nombre_centro: header.nombreCentro,
          horas_extras_total: horasExtrasTotal === "" ? null : parseFloat(horasExtrasTotal.replace(",", ".")) || null,
        },
        { onConflict: "pk" }
      );

      // Reemplazar detalle (simple approach: borrar e insertar)
      await supabase.from("parte_filas").delete().eq("parte_pk", partePk);

      if (filas.length > 0) {
        const payload = filas.map((f) => ({
          parte_pk: partePk,
          componente_id: f.componenteId,
          codigo: f.codigo || null,
          abono_df: f.abonoDF,
          superior_categoria: f.superiorCategoria,
          jornada_ini: f.jornada.ini || null,
          jornada_fin: f.jornada.fin || null,
          salida_ini: f.salida.ini || null,
          salida_fin: f.salida.fin || null,
        }));
        await supabase.from("parte_filas").insert(payload);
      }
    }, 500); // debounce para no spamear

    return () => clearTimeout(t);
  }, [filas, horasExtrasTotal, storageKey, header, partePk, anio, mes, dia]);

  const meses = useMemo(
    () => [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
    ],
    []
  );

  // --------- Helpers de edición ----------
  const updateFila = <K extends keyof ParteFila>(
    componenteId: string,
    key: K,
    value: ParteFila[K]
  ) => {
    setFilas((prev) =>
      prev.map((f) => (f.componenteId === componenteId ? { ...f, [key]: value } : f))
    );
  };

  const updateRango = (
    componenteId: string,
    bloque: "jornada" | "salida",
    campo: "ini" | "fin",
    value: HHMM
  ) => {
    setFilas((prev) =>
      prev.map((f) =>
        f.componenteId === componenteId
          ? { ...f, [bloque]: { ...f[bloque], [campo]: value } }
          : f
      )
    );
  };

  return (
    <section className="space-y-4 text-white">
      {/* Barra superior con fecha */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-white-10 bg-zinc-900 px-3 py-2 text-sm">
            <span className="mr-2 text-white/60">DÍA</span>
            <input
              type="number"
              min={1}
              max={31}
              value={dia}
              onChange={(e) => setDia(parseInt(e.target.value || "1", 10))}
              className="w-16 bg-transparent text-center outline-none"
            />
          </div>

          <div className="rounded-xl border border-white-10 bg-zinc-900 px-3 py-2 text-sm">
            <span className="mr-2 text-white/60">MES</span>
            <select
              value={mes}
              onChange={(e) => setMes(parseInt(e.target.value, 10))}
              className="bg-transparent outline-none"
            >
              {meses.map((m, i) => (
                <option key={m} value={i + 1} className="bg-zinc-900">
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-white-10 bg-zinc-900 px-3 py-2 text-sm">
            <span className="mr-2 text-white">AÑO</span>
            <input
              type="number"
              min={2000}
              max={2100}
              value={anio}
              onChange={(e) => setAnio(parseInt(e.target.value || "2000", 10))}
              className="w-20 bg-transparent text-center outline-none"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => nav("/componentes", { state: { partePk } })}
            className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold"
          >
            AGREGAR COMPONETE
          </button>
          <button
            onClick={() => nav("/incendios", { state: { partePk } })}
            className="rounded-xl bg-amber-600 px-3 py-2 text-sm font-semibold"
          >
            SALIDAS A INCENDIOS
          </button>
        </div>
                  {/* Campo horas extras totales del día */}
        <div className="rounded-xl border border-white-10 bg-zinc-900 px-3 py-2 text-sm">
          <span className="mr-2 text-white/80">Nº.Horas Extras</span>
          <input
            type="text"
            placeholder="hh.mm"
            value={horasExtrasTotal}
            onChange={(e) => setHorasExtrasTotal(e.target.value)}
            className="w-28 bg-transparent text-center outline-none"
          />
        </div>
      </div>
      {/* Metadatos del encabezado */}
      {header && (
        <div className="grid grid-cols-1 gap-2 text-xs text-white-70 md:grid-cols-4">
          <div className="rounded-lg border border-white-10 bg-black-30 p-2">
            <span className="font-semibold text-white/80">Zona: </span>
            {header.zona}
          </div>
          <div className="rounded-lg border border-white-10 bg-black-30 p-2">
            <span className="font-semibold text-white/80">Municipio: </span>
            {header.municipio}
          </div>
          <div className="rounded-lg border border-white-10 bg-black-30 p-2">
            <span className="font-semibold text-white/80">Nombre: </span>
            {header.nombreCentro}
          </div>
          <div className="rounded-lg border border-white-10 bg-black-30 p-2">
            <span className="font-semibold text-white/80">
              {header.tipo === "caseta" ? "Caseta" : "Unidad"}:{" "}
            </span>
            {header.tipo === "caseta" ? header.caseta : header.unidad}
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto rounded-2xl border border-white-10 bg-zinc-500">
        <table className="min-w-[1100px] w-full border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 bg-zinc-700 backdrop-blur">
            <tr>
              <th className="border-b border-white-10 px-5 py-5 text-left">
                COMPONENTES
                <span className="block text-xs text-white/60">Nombres y apellidos</span>
              </th>
              <th className="w-24 border-b border-white-10 px-2 py-2">CÓDIGO</th>
              <th className="w-28 border-b border-white-10 px-2 py-2">Abono Domingo o Festivo</th>
              <th className="w-28 border-b border-white-10 px-2 py-2">Superior Categoría</th>

              <th className="border-b border-white-10 px-2 py-2">
                Horario de la jornada Laboral
                <div className="mt-1 grid grid-cols-2 text-xs text-white-60">
                  <span>Inicio</span><span>Fin</span>
                </div>
              </th>
              <th className="border-b border-white-10 px-2 py-2">
                Salida desde el Centro de Trabajo (h)
                <div className="mt-1 grid grid-cols-2 text-xs text-white-60">
                  <span>Inicio</span><span>Fin</span>
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            {componentes.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-white/60" colSpan={9}>
                  No hay componentes añadidos todavía. Pulsa <b>AÑADIR COMPONENTES</b> para crear.
                </td>
              </tr>
            ) : (
              componentes.map((c, idx) => {
                const fila = filas.find((f) => f.componenteId === c.id);
                return (
                  <tr key={c.id} className={idx % 2 ? "bg-white/[0.02]" : ""}>
                    <td className="border-t border-white-10 px-3 py-2">
                      {c.apellidos}, {c.nombre}
                      {c.numero ? (
                        <span className="ml-2 text-xs text-white/50">({c.numero})</span>
                      ) : null}
                    </td>

                    {/* CÓDIGO */}
                    <td className="border-t border-white-10 px-2 py-2 text-center">
                      <select
                        value={fila?.codigo ?? ""}
                        onChange={(e) =>
                          updateFila(c.id, "codigo", e.target.value as Codigo)
                        }
                        className="w-20 rounded-md border border-white-10 bg-black-30 p-1 outline-none"
                      >
                        {["", "JR", "TH", "TC", "V", "B"].map((code) => (
                          <option key={code} value={code} className="bg-zinc-900">
                            {code || "—"}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Abono Domingo o Festivo */}
                    <td className="border-t border-white-10 px-2 py-2 text-center">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!fila?.abonoDF}
                          onChange={(e) =>
                            updateFila(c.id, "abonoDF", e.target.checked)
                          }
                          className="h-4 w-4 accent-emerald-500"
                        />
                      </label>
                    </td>

                    {/* Superior Categoría */}
                    <td className="border-t border-white-10 px-2 py-2 text-center">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!fila?.superiorCategoria}
                          onChange={(e) =>
                            updateFila(c.id, "superiorCategoria", e.target.checked)
                          }
                          className="h-4 w-4 accent-emerald-500"
                        />
                      </label>
                    </td>

                    {/* Jornada laboral */}
                    <td className="border-t border-white-10 px-2 py-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="time"
                          value={fila?.jornada.ini ?? ""}
                          onChange={(e) => updateRango(c.id, "jornada", "ini", e.target.value)}
                          className="rounded-md border border-white-10 bg-black-30 p-1 outline-none"
                        />
                        <input
                          type="time"
                          value={fila?.jornada.fin ?? ""}
                          onChange={(e) => updateRango(c.id, "jornada", "fin", e.target.value)}
                          className="rounded-md border border-white-10 bg-black-30 p-1 outline-none"
                        />
                      </div>
                    </td>

                    {/* Salida desde el Centro */}
                    <td className="border-t border-white-10 px-2 py-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="time"
                          value={fila?.salida.ini ?? ""}
                          onChange={(e) => updateRango(c.id, "salida", "ini", e.target.value)}
                          className="rounded-md border border-white-10 bg-black-30 p-1 outline-none"
                        />
                        <input
                          type="time"
                          value={fila?.salida.fin ?? ""}
                          onChange={(e) => updateRango(c.id, "salida", "fin", e.target.value)}
                          className="rounded-md border border-white-10 bg-black-30 p-1 outline-none"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
