import { NavLink } from "react-router-dom";
import { CalendarDays, ClipboardList, BarChart3, Home } from "lucide-react";

const base =
  "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition";
const inactive =
  "text-white-70 hover:text-white hover:bg-white-5";
const active =
  "text-white bg-white/10 ring-1 ring-white-15";

export default function Navbar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `${base} ${isActive ? active : inactive}`;

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-green-600 text-sm font-bold">
            <img
          src="/logoINFOEX.webp"
          alt="Logo Plan INFOEX"
          className="h-12 w-auto"
              />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Cuadernillo · INFOEX
            </h1>
            <p className="text-xs text-white/60">
              Gestión de turnos e incidencias
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NavLink to="/" className={linkClass} end>
            <Home className="h-4 w-4" />
           Inicio
          </NavLink>
          <NavLink to="/control-diario" className={linkClass}>
            <ClipboardList className="h-4 w-4" />
             Control diario
          </NavLink>
          <NavLink to="/resumen-mensual" className={linkClass}>
            <BarChart3 className="h-4 w-4" />
            Resumen mensual
          </NavLink>
          </div>
      </div>
    </nav>
  );
}
