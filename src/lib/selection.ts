
// src/lib/selection.ts
export type CurrentSelection = {
  sessionKey: string;
  provincia?: string | null;
  zona?: string | null;
  municipio?: string | null;
  tipo: "unidad" | "caseta";
  seleccion: string; // valor del último selector (unidad o caseta)
  nombreCentro?: string | null;
  fechaISO?: string | null; // YYYY-MM-DD del día elegido en Page1 (si aplica)
};

const KEY = "cuadernillo.currentSelection";

export function getCurrentSelection(): CurrentSelection | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CurrentSelection;
  } catch {
    return null;
  }
}

export function setCurrentSelection(sel: Omit<CurrentSelection, "sessionKey">) {
  const existing = getCurrentSelection();
  const sessionKey = existing?.sessionKey ?? crypto.randomUUID();
  const payload: CurrentSelection = { sessionKey, ...sel };
  localStorage.setItem(KEY, JSON.stringify(payload));
  return payload;
}

export function clearCurrentSelection() {
  localStorage.removeItem(KEY);
}
