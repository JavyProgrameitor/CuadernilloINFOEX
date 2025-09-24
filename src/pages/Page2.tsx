import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { insertCuadernilloRows, selectionToContext } from "../lib/db";
import { getCurrentSelection } from "../lib/selection";

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
};

export default function Page2() {
  const nav = useNavigate();
  const location = useLocation() as { state?: any };

  // --------- Cabecera ----------
  const [header, setHeader] = useState<Header | null>(null);
  const now = new Date();
  const [dia, setDia] = useState<number>(now.getDate());
  const [mes, setMes] = useState<number>(now.getMonth() + 1);
  const [anio, setAnio] = useState<number>(now.getFullYear());

  useEffect(() => {
    // Si Page1 te envía algo por state, lo recogemos aquí
    const h = location.state?.header as Header | undefined;
    if (h) {
      setHeader(h);
      if (h.dia) setDia(h.dia);
      if (h.mes) setMes(h.mes);
      if (h.anio) setAnio(h.anio);
    } else {
      // Si no llega nada, dejamos header en null; la UI ya lo contempla.
      setHeader(null);
    }
  }, [location.state]);

  const fechaStr = useMemo(() => {
    const mm = String(mes).padStart(2, "0");
    const dd = String(dia).padStart(2, "0");
    return `${anio}-${mm}-${dd}`;
  }, [anio, mes, dia]);


  // --------- Componentes ----------
  const [componentes, setComponentes] = useState<Componente[]>([]);

  function loadComponentesFromStorage() {
    try {
      const keys = [
        "cuadernillo.componentes",
        "cuadernilo:componentes", // legacy typo
        "infoex:componentes", // legacy
      ];
      for (const k of keys) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) {
            setComponentes(arr);
            return;
          }
        }
      }
    } catch (e) {
      console.warn("No se pudieron leer componentes de localStorage:", e);
    }
    setComponentes([]); // si nada
  }

  useEffect(() => {
    // 1) Si vienen por navegación, úsalos
    const comps = location.state?.componentes as Componente[] | undefined;
    if (Array.isArray(comps)) {
      setComponentes(comps);
      return;
    }
    // 2) Si no, lee del localStorage
    loadComponentesFromStorage();
  }, [location.state]);

  // (Opcional) si navegas hacia/desde otras páginas dentro de la SPA y quieres refrescar por si acaso:
  useEffect(() => {
    const onFocus = () => loadComponentesFromStorage();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  // --------- PK derivada SOLO para navegación (no guarda nada) ----------
  const partePk = useMemo(() => {
    if (!header) return "";
    const unidadOCaseta =
      header.tipo === "caseta"
        ? header.caseta ?? "SIN"
        : header.unidad ?? "SIN";
    return [fechaStr, header.tipo ?? "NA", unidadOCaseta].join("|");
  }, [header, fechaStr]);

  // --------- Estado del parte (solo local) ----------
  const [filas, setFilas] = useState<ParteFila[]>([]);
  const [horasExtrasTotal, setHorasExtrasTotal] = useState<string>("");


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
        };
      });
      return merged;
    });
  }, [componentes]);


  // ---------- “Guardar” NO-OP (mantiene el botón, sin DB) ----------
  async function guardarEnSupabase() {
    try {
      const sel = getCurrentSelection();
      if (!sel) {
        alert("Primero selecciona Unidad o Caseta en la página inicial.");
        return;
      }

      // Cargar componentes de localStorage (creados en Page3)
      let comps: Componente[] = [];
      try {
        const keys = [
          "cuadernillo.componentes",
          "cuadernilo:componentes",
          "infoex:componentes",
        ];
        for (const k of keys) {
          const raw = localStorage.getItem(k);
          if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) {
              comps = arr;
              break;
            }
          }
        }
      } catch {
        /* ignore */
      }

      const ctx = selectionToContext(sel);

      // Parse horas extra (global) "1.5" o "1,5" -> 1.5
      const horasExtra =
        horasExtrasTotal && !isNaN(Number(horasExtrasTotal.replace(",", ".")))
          ? Number(horasExtrasTotal.replace(",", "."))
          : null;

      // Construir registros por cada fila con código obligatorio
      const registros = filas
        .filter((f) => f.codigo && f.codigo.trim() !== "")
        .map((f) => {
          const comp = comps.find((c) => c.id === f.componenteId);
          return {
            ...ctx,
            componente_nombre: comp?.nombre ?? null,
            componente_apellidos: comp?.apellidos ?? null,
            componente_numero: comp?.numero ?? null,
            codigo: f.codigo,
            abono_df: !!f.abonoDF,
            superior_categoria: !!f.superiorCategoria,
            jornada_ini: f.jornada.ini || null,
            jornada_fin: f.jornada.fin || null,
            horas_extra: horasExtra,
          };
        });

      if (registros.length === 0) {
        alert("No hay filas con código para guardar.");
        return;
      }

      await insertCuadernilloRows(registros);
      alert("Enviado al centro de datos corrctamente.");
    } catch (e: any) {
      console.error(e);
      alert("Error guardando en Supabase: " + (e?.message ?? e));
    }
  }

  const meses = useMemo(
    () => [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
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
      prev.map((f) =>
        f.componenteId === componenteId ? { ...f, [key]: value } : f
      )
    );
  };

  const updateRango = (
    componenteId: string,
    bloque: "jornada",
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
      <div className="flex flex-wrap justify-center gap-2">
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

      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={() => nav("/componentes", { state: { partePk } })}
          className="rounded-xl bg-amber-900 px-3 py-2 text-sm font-semibold"
        >
          AGREGAR COMPONENTE
        </button>
        <button
          onClick={() => nav("/incendios", { state: { partePk } })}
          className="rounded-xl bg-amber-300 px-3 py-2 text-sm font-semibold"
        >
          SALIDAS A INCENDIOS
        </button>
        <button
          onClick={() => nav("/trabajos", { state: { partePk } })}
          className="rounded-xl bg-amber-400 px-3 py-2 text-sm font-semibold"
        >
          SALIDAS A TRABAJOS
        </button>

        {/* Botón de guardado (no-op por ahora) */}
        <button
          onClick={guardarEnSupabase}
          className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold"
        >
          ENVIAR AL CENTRO DE DATOS
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-2xl border border-white-10 bg-zinc-500">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 bg-zinc-700 backdrop-blur">
            <tr>
              <th className="border-b border-white-10 px-5 py-5 text-left">
                COMPONENTES
                <span className="block text-xs text-white/60">
                  Nombres y apellidos
                </span>
              </th>
              <th className="border-b border-white-10 px-2 py-2">CÓDIGO</th>
              <th className="border-b border-white-10 px-2 py-2">
                Domingo o Festivo
              </th>
              <th className="border-b border-white-10 px-2 py-2">
                Superior Categoría
              </th>
              <th className="min-w-[220px] border-b border-white-10 px-2 py-2">
                Horario Jornada Laboral
                <div className="mt-1 grid grid-cols-2 text-xs text-white-60">
                  <span>Inicio</span>
                  <span>Fin</span>
                </div>
              </th>
              <th className="w-20 sm:w-24 border-b border-white-10 px-2 py-2 text-center">
                Nº.Horas Extras
              </th>
            </tr>
          </thead>

          <tbody>
            {componentes.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-white/60" colSpan={9}>
                  No hay componentes añadidos todavía. Pulsa{" "}
                  <b>AÑADIR COMPONENTES</b> para crear.
                </td>
              </tr>
            ) : (
              componentes.map((c, idx) => {
                const fila = filas.find((f) => f.componenteId === c.id);
                return (
                  <tr key={c.id} className={idx % 2 ? "bg-white-[0.02]" : ""}>
                    <td className="border-t border-white-10 px-3 py-2">
                      {c.apellidos}, {c.nombre}
                      {c.numero ? (
                        <span className="ml-2 text-xs text-white/50">
                          ({c.numero})
                        </span>
                      ) : null}
                    </td>

                    {/* CÓDIGO */}
                    <td className="border-t border-white-10 px-2 py-2 text-center">
                      <select
                        value={fila?.codigo ?? ""}
                        onChange={(e) =>
                          updateFila(c.id, "codigo", e.target.value as Codigo)
                        }
                        className="h-9 w-16 sm:w-20 rounded-md border border-white-10 bg-black-30 px-2 text-center font-mono outline-none"
                      >
                        {["", "JR", "TH", "TC", "V", "B"].map((code) => (
                          <option
                            key={code}
                            value={code}
                            className="bg-zinc-900"
                          >
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
                          className="h-4 w-4 accent-emerald-500 "
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
                            updateFila(
                              c.id,
                              "superiorCategoria",
                              e.target.checked
                            )
                          }
                          className="h-4 w-4 accent-emerald-500"
                        />
                      </label>
                    </td>

                    {/* Jornada */}
                    <td className="border-t border-white-10 px-2 py-2">
                      <div className="grid grid-cols-2 gap-1 sm:gap-2">
                        <input
                          type="time"
                          value={fila?.jornada.ini ?? ""}
                          onChange={(e) =>
                            updateRango(c.id, "jornada", "ini", e.target.value)
                          }
                          className="h-9 w-full min-w-[5.75rem] rounded-md border border-white/20 bg-zinc-800/80 px-2 text-sm text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 font-mono"
                          style={{ colorScheme: "dark" }}
                        />
                        <input
                          type="time"
                          value={fila?.jornada.fin ?? ""}
                          onChange={(e) =>
                            updateRango(c.id, "jornada", "fin", e.target.value)
                          }
                          className="h-9 w-full min-w-[5.75rem] rounded-md border border-white/20 bg-zinc-800/80 px-2 text-sm text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 font-mono"
                          style={{ colorScheme: "dark" }}
                        />
                      </div>
                    </td>

                    {/* Horas extras totales (del día) */}
                    <td className="border-t border-white-10 px-2 py-2 text-center">
                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*[.,]?[0-9]*"
                        placeholder="h.mm"
                        value={horasExtrasTotal}
                        onChange={(e) => setHorasExtrasTotal(e.target.value)}
                        className="h-9 w-16 sm:w-20 rounded-md border border-white-10 bg-black-30 px-2 text-center font-mono outline-none"
                      />
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
