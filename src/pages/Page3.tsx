import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Page3() {
  const nav = useNavigate();
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [numero, setNumero] = useState("");

  const puedeCrear = nombre.trim() !== "" && apellidos.trim() !== "";



function crear() {
  const nuevo = {
    id: crypto.randomUUID(),
    nombre: nombre.trim(),
    apellidos: apellidos.trim(),
    numero: numero.trim() || undefined,
  };

  // leer compatibilidad con claves antiguas
  const raw =
    localStorage.getItem("cuadernillo.componentes") ||
    localStorage.getItem("cuadernilo:componentes") || // legacy typo
    localStorage.getItem("infoex:componentes");       // legacy

  const arr: any[] = raw ? JSON.parse(raw) : [];
  arr.push(nuevo);

  // ESCRIBIR SIEMPRE AQUÍ:
  localStorage.setItem("cuadernillo.componentes", JSON.stringify(arr));
  nav("/control-diario");
}

  return (
    <section className="mx-auto max-w-md space-y-4 rounded-2xl border border-white/10 bg-zinc-900/60 p-6 text-white">
      <h2 className="text-xl font-semibold">Añadir componentes</h2>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-white/70">Nombre</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 p-2 outline-none"
            placeholder="Nombre"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/70">Apellidos</label>
          <input
            value={apellidos}
            onChange={(e) => setApellidos(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 p-2 outline-none"
            placeholder="Apellidos"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/70">Número</label>
          <input
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 p-2 outline-none"
            placeholder="Número (opcional)"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          disabled={!puedeCrear}
          onClick={crear}
          className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          CREAR
        </button>
        <button
          onClick={() => nav(-1)}
          className="rounded-xl border border-white/10 bg-zinc-800 px-4 py-2"
        >
          Cancelar
        </button>
      </div>
    </section>
  );
}
