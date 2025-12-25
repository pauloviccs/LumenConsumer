import { useEffect, useState } from "react";
import { Order } from "@/types";
import { OrderCard } from "@/components/OrderCard";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import useSound from "use-sound";
import alertSound from "/alert.mp3";

export function Dashboard() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [playAlert] = useSound(alertSound);

    useEffect(() => {
        fetchOrders();

        const subscription = supabase
            .channel('public:orders')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
                console.log('Change received!', payload);
                playAlert(); // Sound on new order
                fetchOrders();
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => {
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
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching orders:', error);
        } else {
            setOrders(data as Order[]);
        }
    }

    const handleAction = async (orderId: string) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        let nextStatus = order.status;
        if (order.status === 'paid') nextStatus = 'preparing';
        else if (order.status === 'preparing') nextStatus = 'ready';
        else if (order.status === 'ready') nextStatus = 'completed';

        if (nextStatus !== order.status) {
            await supabase.from('orders').update({ status: nextStatus }).eq('id', orderId);
        }
    };

    const addMockOrder = async () => {
        // Create Order
        const { data: orderData, error: orderError } = await supabase.from('orders').insert({
            customer_phone: "5511999999999",
            customer_name: `Cliente #${Math.floor(Math.random() * 1000)}`,
            status: 'pending_payment',
            total_amount: Math.floor(Math.random() * 100) + 20
        }).select().single();

        if (orderError) {
            console.error("Error creating order:", orderError);
            return;
        }

        // Create Item
        await supabase.from('order_items').insert({
            order_id: orderData.id,
            product_name: "Item de Teste Supabase",
            quantity: 1,
            price: orderData.total_amount
        });
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Painel de Controle</h1>
                    <p className="text-muted-foreground">Gerencie os pedidos em tempo real.</p>
                </div>
                <button
                    onClick={addMockOrder}
                    className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
                    <Plus className="w-4 h-4" />
                    Simular Pedido Real
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {orders.map(order => (
                    <OrderCard key={order.id} order={order} onAction={handleAction} />
                ))}
                {orders.length === 0 && (
                    <div className="col-span-full text-center py-20 text-muted-foreground">
                        Nenhum pedido encontrado no banco de dados.
                    </div>
                )}
            </div>
        </div>
    );
}
