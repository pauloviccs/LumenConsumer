import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    ChefHat,
    Settings,
    Zap,
    Package,
    LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/kitchen', label: 'Cozinha', icon: ChefHat },
    { path: '/products', label: 'Produtos', icon: Package },
    { path: '/admin', label: 'Admin', icon: Settings },
];

export function Sidebar() {
    const location = useLocation();
    const { signOut } = useAuth();

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-20 flex flex-col bg-sidebar border-r border-sidebar-border">
            {/* Logo */}
            <div className="flex h-20 items-center justify-center border-b border-sidebar-border">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
                        <Zap className="h-6 w-6 text-primary-foreground" />
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 flex flex-col items-center gap-2 py-6">
                {navItems.map(({ path, label, icon: Icon }) => {
                    const isActive = location.pathname === path;

                    return (
                        <NavLink
                            key={path}
                            to={path}
                            className={cn(
                                "group relative flex h-14 w-14 items-center justify-center rounded-xl transition-all duration-200",
                                isActive
                                    ? "bg-primary/10 text-primary shadow-glow"
                                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            )}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                            )}
                            <Icon className={cn(
                                "h-6 w-6 transition-transform duration-200",
                                "group-hover:scale-110"
                            )} />

                            {/* Tooltip */}
                            <div className="absolute left-full ml-3 px-3 py-1.5 bg-popover text-popover-foreground text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap shadow-lg border border-border">
                                {label}
                            </div>
                        </NavLink>
                    );
                })}
            </nav>

            {/* Footer Actions */}
            <div className="flex flex-col items-center gap-4 pb-4">
                {/* Logout Button */}
                <button
                    onClick={signOut}
                    className="group relative flex h-12 w-12 items-center justify-center rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
                    title="Sair"
                >
                    <LogOut className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                </button>

                {/* Status Indicator */}
                <div className="p-4 border-t border-sidebar-border w-full flex justify-center">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="sr-only">Online</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
