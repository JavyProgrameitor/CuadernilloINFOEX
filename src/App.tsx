import { Routes, Route } from "react-router-dom";
import AppLayout from "./layouts/AppLayouts";
import Page1 from "./pages/Page1";
import Pages2 from "./pages/Pages2";
import Pages3 from "./pages/Pages3";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Page1 />} />
        <Route path="solicitudes" element={<Pages2 />} />
        <Route path="resumen-anual" element={<Pages3 />} />
        <Route path="*" element={<div className="p-6">404 · Página no encontrada</div>} />
      </Route>
    </Routes>
  );
}
