import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

export function ConnectionBanner() {
    // In a real app, this would use SWR or a global context to check health
    // For now, we simulate checking local storage where Admin page saves status
    const [isDisconnected, setIsDisconnected] = useState(false);

    useEffect(() => {
        // Simple mock: if no URL is set, consider disconnected
        const checkConnection = () => {
            const url = localStorage.getItem('evo_url');
            if (!url) {
                setIsDisconnected(true);
            } else {
                // Here we would fetch(`${url}/connection/status`)
                setIsDisconnected(false);
            }
        };

        checkConnection();
        window.addEventListener('storage', checkConnection); // Listen for Admin updates
        return () => window.removeEventListener('storage', checkConnection);
    }, []);

    if (!isDisconnected) return null;

    return (
        <div className="bg-red-600 text-white font-bold text-center py-2 px-4 flex items-center justify-center gap-2 animate-pulse sticky top-0 z-50">
            <AlertTriangle className="w-5 h-5 text-yellow-300" />
            <span>CRÍTICO: WhatsApp Desconectado ou Não Configurado. Vá em /admin para conectar.</span>
        </div>
    );
}
