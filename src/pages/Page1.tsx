import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Filter, Plus, Search, CalendarDays, Info, X, ChevronLeft } from "lucide-react";

/**
 * Pantalla 1: Control Diario / Resumen mensual por códigos (MVP)
 * - React + Tailwind CSS
 * - Sin dependencias externas obligatorias (usa lucide-react + framer-motion si están disponibles)
 * - Componentes simples con estado local para demo
 *
 * Estructura
 *  - Header
 *  - Toolbar (mes/año, búsqueda, acciones)
 *  - Grid mensual (días 1..31) por persona con celdas clicables para asignar códigos
 *  - Panel lateral de leyenda de códigos y ayuda
 */

// === Utilidades ===
const monthNames = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];

const defaultCodes = [
  { code: "T", label: "Trabajo / Guardia", color: "bg-emerald-600" },
  { code: "L", label: "Libre", color: "bg-slate-500" },
  { code: "V", label: "Vacaciones", color: "bg-amber-600" },
  { code: "P", label: "Permiso", color: "bg-sky-600" },
  { code: "B", label: "Baja", color: "bg-rose-600" },
  { code: "HX", label: "Horas extra", color: "bg-indigo-600" },
];

const mockCrew = [
  { id: 1, categoria: "Cabo", apellidos: "García Pérez", nombre: "Luis" },
  { id: 2, categoria: "Bombero", apellidos: "Santos López", nombre: "María" },
  { id: 3, categoria: "Bombero", apellidos: "Romero Díaz", nombre: "Javier" },
  { id: 4, categoria: "Conductor", apellidos: "Navas Torres", nombre: "Ana" },
];

function classNames(...c: (string | undefined | null | false)[]) { return c.filter(Boolean).join(" "); }

// === Componentes menores ===
type BadgeProps = {
  code: string;
  title: string;
  color: string;
};

function Badge({ code, title, color }: BadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-sm">
      <span className={classNames("h-2 w-2 rounded-full", color)} />
      <span className="font-mono font-semibold">{code}</span>
      <span className="text-white/60">{title}</span>
    </div>
  );
}

type ToolbarProps = {
  month: number;
  year: number;
  setMonth: React.Dispatch<React.SetStateAction<number>>;
  setYear: React.Dispatch<React.SetStateAction<number>>;
  onNew: () => void;
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
};

function Toolbar({ month, year, setMonth, setYear, onNew, query, setQuery }: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-zinc-900/60 p-3 ring-1 ring-white/10">
      <div className="flex items-center gap-2">
        <button
          className="rounded-xl p-2 hover:bg-white/5"
          onClick={() => setMonth((m) => (m === 0 ? 11 : m - 1))}
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
          <CalendarDays className="h-5 w-5" />
          <select
            className="bg-transparent text-sm outline-none"
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
          >
            {monthNames.map((m, i) => (
              <option key={m} value={i} className="bg-zinc-900">{m}</option>
            ))}
          </select>
          <input
            type="number"
            className="w-20 bg-transparent text-sm outline-none"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value || String(new Date().getFullYear())))}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
          <Search className="h-4 w-4" />
          <input
            className="w-48 bg-transparent text-sm outline-none"
            placeholder="Buscar por nombre o apellidos"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5">
          <Filter className="h-4 w-4" /> Filtros
        </button>
        <button
          onClick={onNew}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> Nueva incidencia
        </button>
        <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5">
          <Download className="h-4 w-4" /> Exportar
        </button>
      </div>
    </div>
  );
}

type Code = {
  code: string;
  label: string;
  color: string;
};

function CodesLegend({ codes }: { codes: Code[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Info className="h-5 w-5" />
        <h3 className="text-sm font-semibold tracking-wide">Leyenda de Códigos</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {codes.map((c) => (
          <Badge key={c.code} code={c.code} title={c.label} color={c.color} />
        ))}
      </div>
    </div>
  );
}

// Popover simple hecho a mano
type PopoverProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  anchorRect: DOMRect | null;
};

function Popover({ open, onClose, children, anchorRect }: PopoverProps) {
  if (!open || !anchorRect) return null;
  const style = {
    top: anchorRect.bottom + 6 + window.scrollY,
    left: Math.min(anchorRect.left, window.innerWidth - 300) + window.scrollX,
  };
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: -6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -6, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="absolute z-50 w-[280px] rounded-xl border border-white/10 bg-zinc-900/95 p-3 shadow-2xl backdrop-blur"
          style={style}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// === Grid mensual ===
type CrewMember = {
  id: number;
  categoria: string;
  apellidos: string;
  nombre: string;
};

function MonthlyGrid({
  crew,
  codes,
  month,
  year,
  query,
}: {
  crew: CrewMember[];
  codes: Code[];
  month: number;
  year: number;
  query: string;
}) {
  const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [month, year]);
  const [data, setData] = useState<Record<number, Record<number, string | undefined>>>(() => {
    // estado: { [personaId]: { [day]: code } }
    const base: Record<number, Record<number, string | undefined>> = {};
    crew.forEach((p) => (base[p.id] = {}));
    return base;
  });
  const [popover, setPopover] = useState<{
    open: boolean;
    rect: DOMRect | null;
    cell: { personId: number; day: number } | null;
  }>({ open: false, rect: null, cell: null });

  const filteredCrew = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return crew;
    return crew.filter((p) => `${p.apellidos} ${p.nombre}`.toLowerCase().includes(q));
  }, [crew, query]);

  function setCell(personId: number, day: number, code: string | undefined) {
    setData((prev) => ({
      ...prev,
      [personId]: { ...prev[personId], [day]: code },
    }));
  }

  function openCell(
    e: React.MouseEvent<HTMLButtonElement>,
    personId: number,
    day: number
  ) {
    const rect = e.currentTarget.getBoundingClientRect();
    setPopover({ open: true, rect, cell: { personId, day } });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60">
      <div className="sticky top-0 z-10 rounded-t-2xl bg-zinc-900/80 backdrop-blur">
        <div className="grid grid-cols-[140px_140px_120px_repeat(31,minmax(30px,1fr))] overflow-x-auto text-xs">
          <div className="col-span-1 px-3 py-2 font-semibold">Categoría</div>
          <div className="col-span-1 px-3 py-2 font-semibold">Apellidos</div>
          <div className="col-span-1 px-3 py-2 font-semibold">Nombre</div>
          {Array.from({ length: 31 }, (_, i) => (
            <div
              key={i}
              className={classNames(
                "px-2 py-2 text-center font-mono",
                i + 1 <= daysInMonth ? "opacity-100" : "opacity-30"
              )}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      <div className="max-h-[60vh] overflow-auto">
        {filteredCrew.map((p, rowIdx) => (
          <div
            key={p.id}
            className={classNames(
              "grid grid-cols-[140px_140px_120px_repeat(31,minmax(30px,1fr))] text-sm",
              rowIdx % 2 === 0 ? "bg-white/0" : "bg-white/[0.02]"
            )}
          >
            <div className="border-t border-white/10 px-3 py-2">{p.categoria}</div>
            <div className="border-t border-white/10 px-3 py-2">{p.apellidos}</div>
            <div className="border-t border-white/10 px-3 py-2">{p.nombre}</div>
            {Array.from({ length: 31 }, (_, i) => {
              const day = i + 1;
              const disabled = day > daysInMonth;
              const code = data[p.id]?.[day];
              const color = codes.find((c) => c.code === code)?.color;
              return (
                <button
                  key={day}
                  disabled={disabled}
                  onClick={(e) => !disabled && openCell(e, p.id, day)}
                  className={classNames(
                    "border-t border-white/10 px-2 py-2 text-center font-mono transition",
                    disabled ? "cursor-not-allowed opacity-30" : "hover:bg-white/5",
                    code ? "font-semibold" : "text-white/60"
                  )}
                  title={code || "Asignar código"}
                >
                  <span className={classNames("inline-flex h-6 min-w-[24px] items-center justify-center rounded-md px-1", color)}>
                    {code || "-"}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <Popover
        open={popover.open}
        anchorRect={popover.rect}
        onClose={() => setPopover({ open: false, rect: null, cell: null })}
      >
        <div className="flex items-center justify-between">
          <div className="text-xs text-white/70">Asignar código</div>
          <button
            onClick={() => setPopover({ open: false, rect: null, cell: null })}
            className="rounded-md p-1 hover:bg-white/5"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {defaultCodes.map((c) => (
            <button
              key={c.code}
              onClick={() => {
                if (popover.cell) setCell(popover.cell.personId, popover.cell.day, c.code);
                setPopover({ open: false, rect: null, cell: null });
              }}
              className="flex items-center gap-2 rounded-lg border border-white/10 p-2 hover:bg-white/5"
            >
              <span className={classNames("h-2 w-2 rounded-full", c.color)} />
              <span className="font-mono text-sm font-semibold">{c.code}</span>
              <span className="text-xs text-white/70">{c.label}</span>
            </button>
          ))}
          <button
            onClick={() => {
              if (popover.cell) setCell(popover.cell.personId, popover.cell.day, undefined);
              setPopover({ open: false, rect: null, cell: null });
            }}
            className="col-span-2 rounded-lg border border-white/10 p-2 text-center text-sm hover:bg-white/5"
          >
            Limpiar
          </button>
        </div>
      </Popover>
    </div>
  );
}

// === Pantalla principal ===
export default function PantallaControlDiario() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [query, setQuery] = useState("");
  const [showLegend, setShowLegend] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-green-600 text-sm font-bold shadow">FD</div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Cuaderno · Unidad de Bomberos</h1>
              <p className="text-xs text-white/60">Control diario y resumen mensual por códigos</p>
            </div>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            {defaultCodes.slice(0, 4).map((c) => (
              <Badge key={c.code} code={c.code} title={c.label} color={c.color} />
            ))}
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="mx-auto max-w-7xl space-y-4 p-4">
        <Toolbar
          month={month}
          year={year}
          setMonth={setMonth}
          setYear={setYear}
          query={query}
          setQuery={setQuery}
          onNew={() => alert("Acción de ejemplo: nueva incidencia")}
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="space-y-4 lg:col-span-1">
            <button
              onClick={() => setShowLegend((s) => !s)}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-left text-sm hover:bg-white/5"
            >
              {showLegend ? "Ocultar" : "Mostrar"} leyenda
            </button>
            <AnimatePresence>{showLegend && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                <CodesLegend codes={defaultCodes} />
              </motion.div>
            )}</AnimatePresence>

            <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
              <h3 className="mb-2 text-sm font-semibold">Consejos</h3>
              <ul className="list-disc space-y-1 pl-5 text-xs text-white/70">
                <li>Haz clic en una celda para asignar un código.</li>
                <li>Usa el buscador para filtrar por apellidos o nombre.</li>
                <li>Los días que no existan en el mes aparecen atenuados.</li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-3">
            <MonthlyGrid
              crew={mockCrew}
              codes={defaultCodes}
              month={month}
              year={year}
              query={query}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto max-w-7xl px-4 py-6 text-xs text-white/50">
        v0.1 · Pantalla 1 (MVP). Próximos pasos: validación, persistencia y resumen anual.
      </footer>
    </div>
  );
}
