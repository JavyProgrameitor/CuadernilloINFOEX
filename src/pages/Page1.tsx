import { useState } from "react";
import { useNavigate } from "react-router-dom";
import optionsData from "../data/infoex-options.json";

type Options = {
  zonas: string[];
  municipios: string[];
  nombresCentro: string[];
  unidades: string[];
};

const options = optionsData as Options;



export default function Page1() {
  const nav = useNavigate();
  const opts = options as Options;

  const [zona, setZona] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [nombreCentro, setNombreCentro] = useState("");
  const [unidad, setUnidad] = useState("");



  const puedeContinuar =
    zona !== "" && municipio !== "" && nombreCentro !== "" && unidad !== "";

  function handleContinuar() {
    const payload = { zona, municipio, nombreCentro, unidad };
    localStorage.setItem("infoex:header", JSON.stringify(payload));
    nav("/solicitudes");
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-white-10 bg-zinc-900 p-6 text-white">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-emerald-400">
            PLAN INFOEX
          </h1>
          <p className="text-sm text-white-60">
            Selecciona los datos iniciales del parte.
          </p>
        </div>
        <img
          src="/logoINFOEX.webp"
          alt="Logo Plan INFOEX"
          className="h-12 w-auto"
        />
      </div>

      {/* Formulario */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs text-white-70">ZONA DE COORDINACIÓN</label>
          <select
            value={zona}
            onChange={(e) => setZona(e.target.value)}
            className="w-full rounded-xl border border-white-10 bg-black-30 p-2 outline-none"
          >
            <option value="">Selecciona zona…</option>
            {opts.zonas.map((z) => (
              <option key={z} value={z} className="bg-zinc-900">
                {z}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-white-70">
            TÉRMINO MUNICIPAL DEL CENTRO DE TRABAJO
          </label>
          <select
            value={municipio}
            onChange={(e) => setMunicipio(e.target.value)}
            className="w-full rounded-xl border border-white-10 bg-black-30 p-2 outline-none"
          >
            <option value="">Selecciona municipio…</option>
            {opts.municipios.map((m) => (
              <option key={m} value={m} className="bg-zinc-900">
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-white-70">NOMBRE</label>
          <select
            value={nombreCentro}
            onChange={(e) => setNombreCentro(e.target.value)}
            className="w-full rounded-xl border border-white-10 bg-black-30 p-2 outline-none"
          >
            <option value="">Selecciona nombre…</option>
            {opts.nombresCentro.map((n) => (
              <option key={n} value={n} className="bg-zinc-900">
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-white-70">UNIDAD</label>
          <select
            value={unidad}
            onChange={(e) => setUnidad(e.target.value)}
            className="w-full rounded-xl border border-white-10 bg-black-30 p-2 outline-none"
          >
            <option value="">Selecciona unidad…</option>
            {opts.unidades.map((u) => (
              <option key={u} value={u} className="bg-zinc-900">
                {u}
              </option>
            ))}
          </select>
        </div>

      </div>

      <div className="flex justify-end">
        <button
          disabled={!puedeContinuar}
          onClick={handleContinuar}
          className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          CONTINUAR
        </button>
      </div>
    </section>
  );
}
