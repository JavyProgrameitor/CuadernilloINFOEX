import Navbar from "./components/Navbar";
import Page1 from "./pages/Page1";
import Page2 from "./pages/Pages2";
import Page3 from "./pages/Pages3";
import { Routes, Route } from "react-router-dom";

export default function App() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="mx-auto max-w-3xl p-4">
        <Routes>
          <Route path="/" element={<Page1 />} />
          <Route path="/solicitudes" element={<Page2 />} />
          <Route path="/componentes" element={<Page3 />} />
          <Route path="*" element={<div className="p-6">404 · Página no encontrada</div>} />
        </Routes>
      </main>
    </div>
  );
}
