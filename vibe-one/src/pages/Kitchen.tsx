import { useEffect, useState } from "react";
import { Order } from "@/types";
import { OrderCard } from "@/components/OrderCard";
import { supabase } from "@/lib/supabase";
import useSound from "use-sound";
import alertSound from "/alert.mp3";

export function Kitchen() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [playAlert] = useSound(alertSound);

    useEffect(() => {
        fetchOrders();

        const subscription = supabase
            .channel('public:orders:kitchen')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                console.log('Kitchen update:', payload);
                const newOrder = payload.new as Order;
                // Alert if it's a new order in 'preparing' state OR if an existing order changed to 'preparing'
                if (newOrder.status === 'preparing') {
                    playAlert();
                }
                fetchOrders();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [playAlert]);

    async function fetchOrders() {
        const { data, error } = await supabase
            .from('orders')
            .select(`
        *,
        items:order_items(*)
      `)
            .eq('status', 'preparing')
            .order('created_at', { ascending: true }); // Oldest first (FIFO)

        if (error) {
            console.error('Error fetching kitchen orders:', error);
        } else {
            setOrders(data as Order[]);
        }
    }

    const handleAction = async (orderId: string) => {
        // Mark as Ready
        await supabase.from('orders').update({ status: 'ready' }).eq('id', orderId);
    };

    return (
        <div className="p-4 bg-zinc-950 min-h-screen">
            <div className="flex items-center justify-between mb-8 border-b border-zinc-800 pb-4">
                <h1 className="text-5xl font-black text-white tracking-tighter">COZINHA</h1>
                <div className="text-zinc-500 text-xl font-bold">{orders.length} PEDIDOS NA FILA</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orders.map(order => (
                    <div key={order.id} className="transform scale-100 hover:scale-105 transition-transform duration-200">
                        {/* Kitchen Override Styles for Card */}
                        <OrderCard order={order} onAction={handleAction} />
                    </div>
                ))}
            </div>

            {orders.length === 0 && (
                <div className="flex items-center justify-center h-[50vh] text-zinc-700 text-3xl font-bold">
                    SEM PEDIDOS PENDENTES
                </div>
            )}
        </div>
    );
}
