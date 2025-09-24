// src/lib/db.ts
import supabase from "./supabaseClient";
import type { CurrentSelection } from "./selection";

export type CuadernilloRow = {
  id?: string;
  created_at?: string;
  // Contexto de selección (Page1)
  session_key: string;
  provincia?: string | null;
  zona?: string | null;
  municipio?: string | null;
  tipo: "unidad" | "caseta";
  unidad?: string | null;
  caseta?: string | null;
  nombre_centro?: string | null;
  fecha?: string | null; // YYYY-MM-DD

  // Datos de componente (Page3)
  componente_nombre?: string | null;
  componente_apellidos?: string | null;
  componente_numero?: string | null;

  // Datos de Page2
  codigo: string; // obligatorio
  abono_df?: boolean | null;
  superior_categoria?: boolean | null;
  jornada_ini?: string | null;
  jornada_fin?: string | null;
  horas_extra?: number | null;
};

export async function insertCuadernilloRows(rows: CuadernilloRow[]) {
  if (!supabase) throw new Error("Supabase no configurado");
  const { error } = await supabase.from("cuadernillo").insert(rows);
  if (error) throw error;
}

export async function fetchAllCuadernillo() {
  if (!supabase) throw new Error("Supabase no configurado");
  const { data, error } = await supabase
    .from("cuadernillo")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as CuadernilloRow[];
}

export function selectionToContext(sel: CurrentSelection) {
  return {
    session_key: sel.sessionKey,
    provincia: sel.provincia ?? null,
    zona: sel.zona ?? null,
    municipio: sel.municipio ?? null,
    tipo: sel.tipo,
    unidad: sel.tipo === "unidad" ? sel.seleccion : null,
    caseta: sel.tipo === "caseta" ? sel.seleccion : null,
    nombre_centro: sel.nombreCentro ?? null,
    fecha: sel.fechaISO ?? null,
  };
}