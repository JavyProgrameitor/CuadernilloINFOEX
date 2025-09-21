import { useState } from "react";
import { useNavigate } from "react-router-dom";
import rawData from "../data/selectINFOEX_Full.json";

/** Tipos del JSON **/
type ZonaData = {
  municipios: string[];
  unidades: string[];
  alias?: string[];
  // Mapa: nombreMunicipio -> lista de casetas 
  casetas?: Record<string, string[]>;
};

type InfoexData = {
  provincias: Record<
    string,
    {
      zonas: Record<string, ZonaData>;
    }
  >;
};

const data = rawData as InfoexData;

// Normalizador mínimo para que las UNIDADES hagan match con el municipio
// (sin acentos, minúsculas, sin "de/la/del/los/las/y", y colapsando espacios).
const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(de|la|del|los|las|y)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export default function Page1() {
  const nav = useNavigate();

  const [provincia, setProvincia] = useState<string>("");
  const [zona, setZona] = useState<string>("");
  const [municipio, setMunicipio] = useState<string>("");

  // "tipo" decide si mostramos Unidades o Casetas en el último selector
  const [tipo, setTipo] = useState<"" | "unidad" | "caseta">("");
  const [seleccion, setSeleccion] = useState<string>(""); // valor elegido (unidad o caseta)

  const provincias = Object.keys(data.provincias);
  const zonas = provincia ? Object.keys(data.provincias[provincia].zonas) : [];
  const municipios =
    provincia && zona
      ? data.provincias[provincia].zonas[zona].municipios
      : [];

  // Datos de la zona actual
  const zonaData: ZonaData | undefined =
    provincia && zona ? data.provincias[provincia].zonas[zona] : undefined;

  // UNIDADES: ahora filtradas de forma tolerante (sin acentos, sin artículos, etc.)
  const unidadesZona = zonaData?.unidades ?? [];
  const unidadesFiltradas =
    municipio && unidadesZona.length > 0
      ? unidadesZona.filter((u) => norm(u).includes(norm(municipio)))
      : [];

  // CASETAS: directamente por municipio
  const casetasFiltradas =
    municipio && zonaData?.casetas
      ? zonaData.casetas[municipio] ?? []
      : [];

  // Opciones finales según el tipo elegido
  const opcionesFinales =
    tipo === "unidad" ? unidadesFiltradas : tipo === "caseta" ? casetasFiltradas : [];

  const puedeContinuar =
    Boolean(provincia) &&
    Boolean(zona) &&
    Boolean(municipio) &&
    Boolean(tipo) &&
    Boolean(seleccion);

  const handleProvincia = (value: string) => {
    setProvincia(value);
    // reset dependientes
    setZona("");
    setMunicipio("");
    setTipo("");
    setSeleccion("");
  };

  const handleZona = (value: string) => {
    setZona(value);
    setMunicipio("");
    setTipo("");
    setSeleccion("");
  };

  const handleMunicipio = (value: string) => {
    setMunicipio(value);
    setTipo("");
    setSeleccion("");
  };

  const handleTipo = (value: "unidad" | "caseta" | "") => {
    setTipo(value);
    setSeleccion("");
  };

  const handleContinuar = () => {
    // Guardamos información clara en el header
    const header = {
      zona,
      municipio,
      tipo, // "unidad" | "caseta"
      nombreCentro: tipo === "caseta" ? seleccion : municipio,
      unidad: tipo === "unidad" ? seleccion : undefined,
      caseta: tipo === "caseta" ? seleccion : undefined,
    };
    localStorage.setItem("infoex:header", JSON.stringify(header));
    nav("/control-diario");
  };

  return (
    <section className="space-y-6">
  <h1 className="flex flex-wrap justify-center text-3xl sm:text-4xl font-black tracking-tight 
               bg-gradient-to-r from-white to-green-600 bg-clip-text text-transparent">
              PLAN INFOEX
              </h1>
       <h2 className="flex flex-wrap justify-center text-xl font-semibold">APP DE INCIDENCIAS</h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Provincia */}
        <div>
          <label className="mb-1 block text-xs text-white-70">Provincia</label>
          <select
            value={provincia}
            onChange={(e) => handleProvincia(e.target.value)}
            className="w-full rounded-xl border border-white-10 bg-black-30 p-2 outline-none"
          >
            <option value="">Selecciona provincia…</option>
            {provincias.map((p) => (
              <option key={p} value={p} className="bg-zinc-600">
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Zona (depende de provincia) */}
        <div>
          <label className="mb-1 block text-xs text-white-70">Zona</label>
          <select
            value={zona}
            onChange={(e) => handleZona(e.target.value)}
            disabled={!provincia}
            className="w-full rounded-xl border border-white-10 bg-black-30 p-2 outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">
              {provincia ? "Selecciona zona…" : "Selecciona provincia primero"}
            </option>
            {zonas.map((z) => (
              <option key={z} value={z} className="bg-zinc-600">
                {z}
              </option>
            ))}
          </select>
        </div>

        {/* Municipio (depende de zona) */}
        <div>
          <label className="mb-1 block text-xs text-white-70">Municipio</label>
          <select
            value={municipio}
            onChange={(e) => handleMunicipio(e.target.value)}
            disabled={!zona}
            className="w-full rounded-xl border border-white-10 bg-black-30 p-2 outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">
              {zona ? "Selecciona municipio…" : "Selecciona zona primero"}
            </option>
            {municipios.map((m) => (
              <option key={m} value={m} className="bg-zinc-600">
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo (Unidad o Caseta), depende de municipio */}
        <div>
          <label className="mb-1 block text-xs text-white-70">Tipo</label>
          <select
            value={tipo}
            onChange={(e) => handleTipo(e.target.value as "unidad" | "caseta" | "")}
            disabled={!municipio}
            className="w-full rounded-xl border border-white-10 bg-black-30 p-2 outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">
              {municipio ? "Selecciona tipo…" : "Selecciona municipio primero"}
            </option>
            <option value="unidad" className="bg-zinc-600">Unidad</option>
            <option value="caseta" className="bg-zinc-600">Caseta</option>
          </select>
        </div>

        {/* Selector final: según el tipo, lista de Unidades o de Casetas */}
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs text-white-70">
            {tipo === "caseta" ? "Caseta" : "Unidad"}
          </label>
          <select
            value={seleccion}
            onChange={(e) => setSeleccion(e.target.value)}
            disabled={!tipo}
            className="w-full rounded-xl border border-white-10 bg-black-30 p-2 outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">
              {tipo
                ? tipo === "caseta"
                  ? "Selecciona caseta…"
                  : "Selecciona unidad…"
                : "Selecciona tipo primero"}
            </option>

            {opcionesFinales.map((opt) => (
              <option key={opt} value={opt} className="bg-zinc-600">
                {opt}
              </option>
            ))}
          </select>

          {tipo && opcionesFinales.length === 0 && (
            <p className="mt-2 text-xs text-amber-400">
              No hay {tipo === "caseta" ? "casetas" : "unidades"} para el municipio seleccionado.
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          disabled={!puedeContinuar}
          onClick={handleContinuar}
          className="rounded-xl bg-lime-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          CONTINUAR
        </button>
      </div>
    </section>
  );
}
