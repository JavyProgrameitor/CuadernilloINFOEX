import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-950 text-white">
      <Navbar />
      <main className="mx-auto max-w-7xl p-4">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-7xl px-4 py-6 text-xs text-white/50">
        © {new Date().getFullYear()} · INFOEX · v0.1
      </footer>
    </div>
  );
}
