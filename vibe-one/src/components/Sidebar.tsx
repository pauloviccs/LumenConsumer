import { LayoutDashboard, Settings, UtensilsCrossed, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function Sidebar() {
    const location = useLocation();
    const { signOut } = useAuth();

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col h-screen fixed left-0 top-0">
            <div className="p-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 text-transparent bg-clip-text">
                    VibeOne
                </h1>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                <Link
                    to="/dashboard"
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/dashboard') ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}
                >
                    <LayoutDashboard className="w-5 h-5" />
                    <span>Painel</span>
                </Link>

                <Link
                    to="/kitchen"
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/kitchen') ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}
                >
                    <UtensilsCrossed className="w-5 h-5" />
                    <span>Cozinha</span>
                </Link>

                <Link
                    to="/admin"
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/admin') ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}
                >
                    <Settings className="w-5 h-5" />
                    <span>Admin</span>
                </Link>
            </nav>

            <div className="p-4 border-t border-zinc-800">
                <button
                    onClick={signOut}
                    className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Sair</span>
                </button>
            </div>
        </div>
    );
}
