import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Home, ClipboardList, BarChart3, Menu, X } from "lucide-react";

const base =
  "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition";
const inactive = "text-white-70 hover:text-white hover:bg-white-5";
const active = "text-white bg-white-10 ring-1 ring-white-15";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `${base} ${isActive ? active : inactive}`;

  const closeMenu = () => setOpen(false);

  return (
    <nav className="sticky top-0 z-40 border-b border-white-10 bg-black-60 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4">
        {/* Barra superior */}
        <div className="flex items-center justify-between py-3">
          {/* Branding */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-green-600">
              <img
                src="/logoINFOEX.webp"
                alt="Logo Plan INFOEX"
                className="h-9 w-9 object-contain"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-black tracking-tight 
               bg-gradient-to-r from-white to-green-600 bg-clip-text text-transparent">
                JUNTA DE EXTREMADURA
              </h1>
              <p className="hidden text-xs text-white-60 sm:block">
                Servicio de Prevención y Extinción de Incendios
              </p>
            </div>
          </div>

          {/* Botón menú (móvil) */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-white-70 hover:bg-white-5 hover:text-white md:hidden"
            aria-label="Abrir menú"
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Menú en línea (desktop) */}
          <div className="hidden items-center gap-2 md:flex">
            <NavLink to="/" className={linkClass} end>
              <Home className="h-4 w-4" />
              <span className="whitespace-nowrap">Inicio</span>
            </NavLink>
            <NavLink to="/control-diario" className={linkClass}>
              <ClipboardList className="h-4 w-4" />
              <span className="whitespace-nowrap">Control diario</span>
            </NavLink>
            <NavLink to="/resumen-mensual" className={linkClass}>
              <BarChart3 className="h-4 w-4" />
              <span className="whitespace-nowrap">Resumen mensual</span>
            </NavLink>
          </div>
        </div>

        {/* Panel desplegable (móvil) */}
        {open && (
          <div className="pb-3 md:hidden">
            <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/70 p-2">
              <NavLink to="/" className={linkClass} end onClick={closeMenu}>
                <Home className="h-4 w-4" />
                <span>Inicio</span>
              </NavLink>
              <NavLink to="/control-diario" className={linkClass} onClick={closeMenu}>
                <ClipboardList className="h-4 w-4" />
                <span>Control diario</span>
              </NavLink>
              <NavLink to="/resumen-mensual" className={linkClass} onClick={closeMenu}>
                <BarChart3 className="h-4 w-4" />
                <span>Resumen mensual</span>
              </NavLink>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
