import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import supabase, { hasSupabase } from "../lib/supabaseClient";

type Salida = {
  id?: string; // local key
  terminoMunicipal: string;
  hMovilizacion: string;   // HH:MM
  hSalida: string;
  hLlegadaInc: string;
  hRegreso: string;
  hLlegadaBase: string;
  numComponentes: number | "";
};

export default function Page4() {
  const nav = useNavigate();
  const loc = useLocation() as any;
  const partePk: string | undefined = loc?.state?.partePk;

  const storageKey = useMemo(
    () => (partePk ? `infoex:incendios:${partePk}` : "infoex:incendios:temp"),
    [partePk]
  );

  const [salidas, setSalidas] = useState<Salida[]>([]);

  // Cargar
  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        setSalidas(JSON.parse(raw));
      } catch {}
    }
    // Cargar de supabase si hay pk
    (async () => {
      if (!hasSupabase || !partePk) return;
      const { data, error } = await supabase
        .from("incendios")
        .select("*")
        .eq("parte_pk", partePk)
        .order("created_at", { ascending: true });
      if (!error && data) {
        setSalidas(
          data.map((r: any) => ({
            id: r.id,
            terminoMunicipal: r.termino_municipal ?? "",
            hMovilizacion: r.h_movilizacion ?? "",
            hSalida: r.h_salida ?? "",
            hLlegadaInc: r.h_llegada_inc ?? "",
            hRegreso: r.h_regreso ?? "",
            hLlegadaBase: r.h_llegada_base ?? "",
            numComponentes: r.num_componentes ?? "",
          }))
        );
      }
    })();
  }, [storageKey, partePk]);

  // Guardar local
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(salidas));
  }, [storageKey, salidas]);

  const addSalida = () => {
    setSalidas((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        terminoMunicipal: "",
        hMovilizacion: "",
        hSalida: "",
        hLlegadaInc: "",
        hRegreso: "",
        hLlegadaBase: "",
        numComponentes: "",
      },
    ]);
  };

  const removeSalida = (id?: string) => {
    setSalidas((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSalida = <K extends keyof Salida>(id: string | undefined, key: K, value: Salida[K]) => {
    setSalidas((prev) => prev.map((s) => (s.id === id ? { ...s, [key]: value } : s)));
  };

  const saveSupabase = async () => {
    if (!hasSupabase) {
      alert("Supabase no está configurado (usa .env con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY). Se ha guardado en local.");
      return;
    }
    if (!partePk) {
      alert("No hay parte vinculado. Vuelve desde Page2 para tener el identificador del parte.");
      return;
    }
    // borramos e insertamos de forma sencilla (también puedes upsert por id si lo prefieres)
    await supabase.from("incendios").delete().eq("parte_pk", partePk);

    if (salidas.length > 0) {
      const payload = salidas.map((s) => ({
        parte_pk: partePk,
        termino_municipal: s.terminoMunicipal || null,
        h_movilizacion: s.hMovilizacion || null,
        h_salida: s.hSalida || null,
        h_llegada_inc: s.hLlegadaInc || null,
        h_regreso: s.hRegreso || null,
        h_llegada_base: s.hLlegadaBase || null,
        num_componentes: s.numComponentes === "" ? null : Number(s.numComponentes),
      }));
      const { error } = await supabase.from("incendios").insert(payload);
      if (error) {
        console.error(error);
        alert("Error guardando en Supabase. Revisa la consola.");
        return;
      }
    }
    alert("Salidas guardadas correctamente.");
  };

  return (
    <section className="space-y-4 text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Salidas a incendios</h1>
        <div className="flex gap-2">
          <button
            onClick={addSalida}
            className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold"
          >
            Añadir salida
          </button>
          <button
            onClick={saveSupabase}
            className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold"
          >
            Guardar
          </button>
          <button
            onClick={() => nav(-1)}
            className="rounded-xl bg-zinc-700 px-3 py-2 text-sm font-semibold"
          >
            Volver
          </button>
        </div>
      </div>

      {salidas.length === 0 ? (
        <p className="text-white/70">Aún no hay salidas. Pulsa “Añadir salida”.</p>
      ) : (
        <div className="space-y-3">
          {salidas.map((s) => (
            <div key={s.id} className="rounded-xl border border-white-10 bg-zinc-500 p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold">Salida</h3>
                <button
                  onClick={() => removeSalida(s.id)}
                  className="rounded-md bg-red-600 px-2 py-1 text-xs font-semibold"
                >
                  Eliminar
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs text-white-70">Término municipal</label>
                  <input
                    type="text"
                    value={s.terminoMunicipal}
                    onChange={(e) => updateSalida(s.id, "terminoMunicipal", e.target.value)}
                    className="w-full rounded-md border border-white-10 bg-black-30 p-2 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-white-70">Hora movilización</label>
                  <input
                    type="time"
                    value={s.hMovilizacion}
                    onChange={(e) => updateSalida(s.id, "hMovilizacion", e.target.value)}
                    className="w-full rounded-md border border-white-10 bg-black-30 p-2 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-white-70">Hora salida al incendio</label>
                  <input
                    type="time"
                    value={s.hSalida}
                    onChange={(e) => updateSalida(s.id, "hSalida", e.target.value)}
                    className="w-full rounded-md border border-white-10 bg-black-30 p-2 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-white-70">Hora llegada al incendio</label>
                  <input
                    type="time"
                    value={s.hLlegadaInc}
                    onChange={(e) => updateSalida(s.id, "hLlegadaInc", e.target.value)}
                    className="w-full rounded-md border border-white-10 bg-black-30 p-2 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-white-70">Hora regreso del incendio</label>
                  <input
                    type="time"
                    value={s.hRegreso}
                    onChange={(e) => updateSalida(s.id, "hRegreso", e.target.value)}
                    className="w-full rounded-md border border-white-10 bg-black-30 p-2 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-white-70">Hora llegada a base</label>
                  <input
                    type="time"
                    value={s.hLlegadaBase}
                    onChange={(e) => updateSalida(s.id, "hLlegadaBase", e.target.value)}
                    className="w-full rounded-md border border-white-10 bg-black-30 p-2 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-white-70">Nº componentes</label>
                  <input
                    type="number"
                    min={0}
                    value={s.numComponentes}
                    onChange={(e) =>
                      updateSalida(
                        s.id,
                        "numComponentes",
                        e.target.value === "" ? "" : parseInt(e.target.value, 10)
                      )
                    }
                    className="w-full rounded-md border border-white-10 bg-black-30 p-2 outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
