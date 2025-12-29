import { ChefHat, Clock } from 'lucide-react';
import { useOrders } from '../hooks/useOrders';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import useSound from "use-sound";
import alertSound from "/alert.mp3";
import { useEffect, useRef } from 'react';

export function Kitchen() {
    // Fetch only preparing orders
    const { orders } = useOrders({ status: ['preparing'] });
    const [playAlert] = useSound(alertSound);
    const prevCount = useRef(0);

    // Sound Effect Logic
    useEffect(() => {
        if (orders.length > prevCount.current) {
            playAlert();
        }
        prevCount.current = orders.length;
    }, [orders.length, playAlert]);

    const handleAdvance = async (orderId: string) => {
        const { error } = await supabase
            .from('orders')
            .update({ status: 'ready' })
            .eq('id', orderId);

        if (error) {
            alert("Erro ao atualizar pedido");
            console.error(error);
        } else {
            // Realtime will trigger refresh in useOrders
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-xl">
                <div className="flex h-20 items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/10">
                            <ChefHat className="h-6 w-6 text-yellow-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Cozinha</h1>
                            <p className="text-sm text-muted-foreground">
                                {orders.length} pedido(s) em preparo
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                        <div className="h-3 w-3 rounded-full bg-yellow-500 animate-pulse" />
                        <span className="font-mono text-lg font-bold text-yellow-400">
                            {orders.length}
                        </span>
                    </div>
                </div>
            </header>

            <main className="p-6">
                {orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                        <div className="h-24 w-24 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                            <ChefHat className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                            Nenhum pedido em preparo
                        </h2>
                        <p className="text-muted-foreground">
                            Os novos pedidos aparecerão aqui automaticamente
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {orders.map((order, index) => {
                            const minutesElapsed = Math.floor(
                                (Date.now() - order.createdAt.getTime()) / 60000
                            );
                            const isUrgent = minutesElapsed > 20;

                            return (
                                <button
                                    key={order.id}
                                    onClick={() => handleAdvance(order.id)}
                                    className={cn(
                                        "group relative text-left rounded-2xl border-2 p-6 transition-all duration-300",
                                        "hover:scale-[1.02] hover:shadow-glow active:scale-[0.98]",
                                        isUrgent
                                            ? "border-red-500/50 bg-red-500/5"
                                            : "border-yellow-500/30 bg-yellow-500/5",
                                        "animate-slide-in"
                                    )}
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    {/* Pulse indicator for urgent */}
                                    {isUrgent && (
                                        <div className="absolute -top-1 -right-1 h-4 w-4">
                                            {/* Fixed: Removed absolute inset-0 to prevent overlap issues, kept ping */}
                                            <div className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 animate-ping opacity-75" />
                                            <div className="relative h-4 w-4 rounded-full bg-red-500" />
                                        </div>
                                    )}

                                    {/* Order ID */}
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="font-mono text-3xl font-black text-foreground">
                                            #{order.id.slice(-4).toUpperCase()}
                                        </span>
                                        <div className={cn(
                                            "flex items-center gap-1.5 px-2 py-1 rounded-lg font-mono text-sm",
                                            isUrgent
                                                ? "bg-red-500/10 text-red-400"
                                                : "bg-muted text-muted-foreground"
                                        )}>
                                            <Clock className="h-4 w-4" />
                                            {minutesElapsed}m
                                        </div>
                                    </div>

                                    {/* Customer */}
                                    <p className="text-lg font-medium text-foreground mb-4">
                                        {order.customerName}
                                    </p>

                                    {/* Items */}
                                    <div className="space-y-2 mb-6">
                                        {order.items.map(item => (
                                            <div key={item.id} className="flex items-start gap-2">
                                                <span className="font-mono text-xl font-bold text-yellow-400">
                                                    {item.quantity}×
                                                </span>
                                                <div>
                                                    <p className="text-lg font-medium text-foreground">
                                                        {item.productName}
                                                    </p>
                                                    {item.notes && (
                                                        <p className="text-sm text-red-400 font-medium">
                                                            ⚠ {item.notes}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Action hint */}
                                    <div className="text-center py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold transition-colors group-hover:bg-emerald-500 group-hover:text-background">
                                        TOQUE PARA MARCAR PRONTO
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
