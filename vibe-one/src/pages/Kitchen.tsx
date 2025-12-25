import { useEffect, useState } from "react";
// import { Order, OrderStatus } from "../types/order";
import { OrderCard } from "../components/OrderCard";
import { supabase } from "../lib/supabase";
import useSound from "use-sound";
import alertSound from "/alert.mp3";

export type OrderStatus =
    | 'pending_payment'
    | 'paid'
    | 'preparing'
    | 'ready'
    | 'delivering'
    | 'completed'
    | 'cancelled';

export interface OrderItem {
    id: string;
    productName: string;
    quantity: number;
    price: number;
    notes?: string;
}

export interface Order {
    id: string;
    customerPhone: string;
    customerName: string;
    status: OrderStatus;
    totalAmount: number;
    paymentId?: string;
    createdAt: Date;
    items: OrderItem[];
}

export function Kitchen() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [playAlert] = useSound(alertSound);

    useEffect(() => {
        fetchOrders();

        const subscription = supabase
            .channel('public:orders:kitchen')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                console.log('Kitchen update:', payload);
                // We need to re-fetch to get the relations (items) correctly mapped
                // Or manually construct the Order object if we trust the payload has everything (it usually doesn't have relations)
                if (payload.new && (payload.new as any).status === 'preparing') {
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
            const formattedOrders: Order[] = data.map((o: any) => ({
                id: o.id,
                customerPhone: o.customer_phone,
                customerName: o.customer_name,
                status: o.status,
                totalAmount: o.total_amount,
                createdAt: new Date(o.created_at),
                items: o.items.map((i: any) => ({
                    id: i.id,
                    productName: i.product_name,
                    quantity: i.quantity,
                    price: i.price,
                    notes: i.notes
                }))
            }));
            setOrders(formattedOrders);
        }
    }

    const handleAdvance = async (orderId: string) => {
        // Kitchen always marks as 'ready'
        await supabase.from('orders').update({ status: 'ready' }).eq('id', orderId);
    };

    return (
        <div className="p-4 bg-background min-h-screen text-foreground">
            <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
                <h1 className="text-4xl font-black tracking-tighter text-primary">COZINHA</h1>
                <div className="text-xl font-bold font-mono text-muted-foreground">
                    {orders.length} PEDIDOS NA FILA
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orders.map(order => (
                    <div key={order.id} className="transform transition-all duration-200 hover:scale-[1.02]">
                        <OrderCard
                            order={order}
                            onAdvance={handleAdvance}
                        />
                    </div>
                ))}
            </div>

            {orders.length === 0 && (
                <div className="flex items-center justify-center h-[50vh] text-muted-foreground/50 text-2xl font-bold animate-pulse">
                    SEM PEDIDOS PENDENTES
                </div>
            )}
        </div>
    );
}
