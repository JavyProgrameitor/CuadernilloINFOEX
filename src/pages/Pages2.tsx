import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type Header = {
  zona: string;
  municipio: string;
  nombreCentro: string;
  unidad: string;
  mes: number;
  anio: number;
};

type Componente = {
  id: string;
  nombre: string;
  apellidos: string;
  numero?: string;
};

export default function Page2() {
  const nav = useNavigate();

  // Carga de cabecera desde Page1
  const [header, setHeader] = useState<Header | null>(null);
  const [dia, setDia] = useState<number>(new Date().getDate());
  const [mes, setMes] = useState<number>(new Date().getMonth() + 1);
  const [anio, setAnio] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    const raw = localStorage.getItem("infoex:header");
    if (raw) {
      const h = JSON.parse(raw) as Header;
      setHeader(h);
      setMes(h.mes);
      setAnio(h.anio);
    }
  }, []);

  // Componentes guardados previamente (desde Page3)
  const [componentes, setComponentes] = useState<Componente[]>([]);
  useEffect(() => {
    const raw = localStorage.getItem("infoex:componentes");
    if (raw) setComponentes(JSON.parse(raw));
  }, []);

  const meses = useMemo(
    () => [
      "Enero","Febrero","Marzo","Abril","Mayo","Junio",
      "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
    ],
    []
  );

  return (
    <section className="space-y-4 text-white">
      {/* Barra superior con botones */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-white-10 bg-zinc-900 px-3 py-2 text-sm">
            <span className="mr-2 text-white-60">DÍA</span>
            <input
              type="number"
              min={1}
              max={31}
              value={dia}
              onChange={(e) => setDia(parseInt(e.target.value || "1"))}
              className="w-16 bg-transparent text-center outline-none"
            />
          </div>

          <div className="rounded-xl border border-white-10 bg-zinc-900 px-3 py-2 text-sm">
            <span className="mr-2 text-white-60">MES</span>
            <select
              value={mes}
              onChange={(e) => setMes(parseInt(e.target.value))}
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
            <span className="mr-2 text-white-60">AÑO</span>
            <input
              type="number"
              min={2000}
              max={2100}
              value={anio}
              onChange={(e) => setAnio(parseInt(e.target.value || "2000"))}
              className="w-20 bg-transparent text-center outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
    
          <button
            disabled
            className="rounded-xl border border-white-10 bg-zinc-900 px-3 py-2 text-sm text-white-70 disabled:opacity-60"
            title="Próximamente"
          >
            ANOTACIONES
          </button>
          <button
            disabled
            className="rounded-xl border border-white-10 bg-zinc-900 px-3 py-2 text-sm text-white-70 disabled:opacity-60"
          >
            RESUMEN MENSUAL
          </button>
          <button
            disabled
            className="rounded-xl border border-white-10 bg-zinc-900 px-3 py-2 text-sm text-white-70 disabled:opacity-60"
          >
            RESUMEN ANUAL
          </button>
        </div>
      </div>

      {/* Caja de anotaciones (cabecera verde del boceto) 
      <div className="rounded-2xl border border-emerald-600 bg-emerald--00 p-3">
        <div className="text-sm font-semibold text-emerald-400">ANOTACIONES</div>
    -  <p className="text-xs text-white-70">
          (Área reservada. Se habilitará funcionalidad más adelante.)
      - </p>
      </div>
        */}
      {/* Metadatos del encabezado (zona, unidad, etc.) */}
      {header && (
        <div className="grid grid-cols-1 gap-2 text-xs text-white-70 md:grid-cols-4">
          <div className="rounded-lg border border-white-10 bg-black-30 p-2">
            <span className="font-semibold text-white-80">Zona: </span>
            {header.zona}
          </div>
          <div className="rounded-lg border border-white-10 bg-black-30 p-2">
            <span className="font-semibold text-white-80">Municipio: </span>
            {header.municipio}
          </div>
          <div className="rounded-lg border border-white-10 bg-black-30 p-2">
            <span className="font-semibold text-white-80">Nombre: </span>
            {header.nombreCentro}
          </div>
          <div className="rounded-lg border border-white-10 bg-black-30 p-2">
            <span className="font-semibold text-white-80">Unidad: </span>
            {header.unidad}
          </div>
        </div>
      )}

      {/* Tabla  */}
      <div className="overflow-x-auto rounded-2xl border border-white-10 bg-zinc-900">
        <table className="min-w-[900px] w-full border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 bg-zinc-900 backdrop-blur">
            <tr>
              <th className="border-b border-white-10 px-3 py-2 text-left">
                COMPONENTES <span className="block text-xs text-white-60">Nombres y apellidos</span>
              </th>
              <th className="w-16 border-b border-white-10 px-2 py-2">CÓD</th>
              <th className="border-b border-white-10 px-2 py-2">
                Salida desde el Centro de Trabajo (h)
                <div className="mt-1 grid grid-cols-2 text-xs text-white-60">
                  <span>Inicio</span><span>Fin</span>
                </div>
              </th>
              <th className="border-b border-white-10 px-2 py-2">
                Trabajos/Servicios realizados (h)
                <div className="mt-1 grid grid-cols-2 text-xs text-white-60">
                  <span>Inicio</span><span>Fin</span>
                </div>
              </th>
              <th className="border-b border-white-10 px-2 py-2">
                Otros (Incendio, Formación…) (h)
                <div className="mt-1 grid grid-cols-2 text-xs text-white-60">
                  <span>Inicio</span><span>Fin</span>
                </div>
              </th>
              <th className="w-40 border-b border-white-10 px-2 py-2">Motivo</th>
            </tr>
          </thead>
          <tbody>
            {componentes.length === 0 ? (
              <tr>
                <td
                  className="px-3 py-6 text-center text-white-60"
                  colSpan={6}
                >
                  No hay componentes añadidos todavía. Pulsa <b>AÑADIR</b> para crear.
                </td>
              </tr>
            ) : (
              componentes.map((c, idx) => {
                return (
                  <tr key={c.id} className={idx % 2 ? "bg-white/[0.02]" : ""}>
                    <td className="border-t border-white-10 px-3 py-2">
                      {c.apellidos}, {c.nombre}
                    </td>
                    <td className="border-t border-white-10 px-2 py-2 text-center">
                      <input
                        className="w-14 rounded-md border border-white-10 bg-black-30 p-1 text-center outline-none"
                        placeholder="—" />
                    </td>
                    {/* Centro */}
                    <td className="border-t border-white-10 px-2 py-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input className="rounded-md border border-white-10 bg-black-30 p-1 outline-none" placeholder="Inicio" />
                        <input className="rounded-md border border-white-10 bg-black-30 p-1 outline-none" placeholder="Fin" />
                      </div>
                    </td>
                    {/* Servicios */}
                    <td className="border-t border-white-10 px-2 py-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input className="rounded-md border border-white-10 bg-black-30 p-1 outline-none" placeholder="Inicio" />
                        <input className="rounded-md border border-white-10 bg-black-30 p-1 outline-none" placeholder="Fin" />
                      </div>
                    </td>
                    {/* Otros */}
                    <td className="border-t border-white-10 px-2 py-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input className="rounded-md border border-white-10 bg-black-30 p-1 outline-none" placeholder="Inicio" />
                        <input className="rounded-md border border-white-10 bg-black-30 p-1 outline-none" placeholder="Fin" />
                      </div>
                    </td>
                    <td className="border-t border-white-10 px-2 py-2">
                      <input className="w-full rounded-md border border-white-10 bg-black-30 p-1 outline-none" placeholder="Motivo / Nota" />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Botón grande como en el boceto (espejo del superior) */}
      <div className="flex justify-start">
         <button
            onClick={() => nav("/componentes")}
            className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold"
          >
            AÑADIR COMPONENTES
          </button>
      </div>
    </section>
  );
}
