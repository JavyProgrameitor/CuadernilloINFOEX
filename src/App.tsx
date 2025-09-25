import Navbar from "./components/Navbar";
import Page1 from "./pages/Page1";
import Page2 from "./pages/Page2";
import Page3 from "./pages/Page3";
import Page4 from "./pages/Page4";
import Page5 from "./pages/Page5";
import Page6 from "./pages/Page6";
import { Routes, Route } from "react-router-dom";


export default function App() {
  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      <Navbar />
      <main className="mx-auto max-w-3xl p-4">
        <Routes>
          <Route path="/" element={<Page1 />} />
          <Route path="/control-diario" element={<Page2 />} />
          <Route path="/componentes" element={<Page3 />} />
           <Route path="/incendios" element={<Page4 />} />
           <Route path="/trabajos" element={<Page5 />} />
           <Route path="/resumen-mensual" element={<Page6 />} />
          <Route path="*" element={<div className="p-6">404 · Página no encontrada</div>} />
        </Routes>
      </main>
    </div>
  );
}
