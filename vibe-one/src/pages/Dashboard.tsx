import { useEffect, useState } from "react";
import { Order, OrderStatus } from "../types";
import { KanbanColumn } from "../components/KanbanColumn";
import { StatsCard } from "../components/StatsCard";
import { supabase } from "../lib/supabase";
import useSound from "use-sound";
import alertSound from "/alert.mp3";
import {
    ShoppingBag,
    Clock,
    DollarSign,
    AlertCircle,
    Plus
} from 'lucide-react';

const kanbanStatuses: OrderStatus[] = [
    'pending_payment',
    'paid',
    'preparing',
    'ready',
    'delivering'
];

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
            // Map Supabase data to Order type if necessary, usually matching if keys are snake_case vs camelCase
            // We might need a transformer here if TS assumes camelCase but DB returns snake_case
            // For now assuming we corrected the type or DB returns what we expect. 
            // NOTE: Supabase returns snake_case by default. We need to map it.

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

    const handleAction = async (orderId: string) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        let nextStatus: OrderStatus = order.status;
        if (order.status === 'paid') nextStatus = 'preparing';
        else if (order.status === 'preparing') nextStatus = 'ready';
        else if (order.status === 'ready') nextStatus = 'completed';
        else if (order.status === 'delivering') nextStatus = 'completed';

        if (nextStatus !== order.status) {
            await supabase.from('orders').update({ status: nextStatus }).eq('id', orderId);
        }
    };

    const addMockOrder = async () => {
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

        await supabase.from('order_items').insert({
            order_id: orderData.id,
            product_name: "Item de Teste Lovable",
            quantity: 1,
            price: orderData.total_amount
        });
    };

    // Derived State for Stats
    const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
    const totalRevenue = activeOrders
        .filter(o => o.status !== 'pending_payment')
        .reduce((sum, o) => sum + o.totalAmount, 0);

    const ordersByStatus = (status: OrderStatus) => orders.filter(o => o.status === status);

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-xl">
                <div className="flex h-16 items-center justify-between px-6">
                    <div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                            Lumen Dashboard
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Monitoramento em Tempo Real
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={addMockOrder}
                            className="hidden md:flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-primary/20">
                            <Plus className="w-4 h-4" />
                            Simular Pedido
                        </button>

                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-medium text-emerald-400">
                                Sistema Online
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="p-6 space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                        title="Pedidos Ativos"
                        value={activeOrders.length}
                        icon={ShoppingBag}
                        variant="primary"
                    />
                    <StatsCard
                        title="Aguardando Pagamento"
                        value={ordersByStatus('pending_payment').length}
                        icon={AlertCircle}
                        variant="warning"
                    />
                    <StatsCard
                        title="Tempo Médio"
                        value={`18 min`}
                        icon={Clock}
                        variant="default"
                    />
                    <StatsCard
                        title="Faturamento (Dia)"
                        value={`R$ ${totalRevenue.toFixed(2)}`}
                        icon={DollarSign}
                        trend={{ value: 12, isPositive: true }}
                        variant="success"
                    />
                </div>

                {/* Kanban Board */}
                <div className="overflow-x-auto pb-6">
                    <div className="flex gap-6 min-w-max">
                        {kanbanStatuses.map(status => (
                            <KanbanColumn
                                key={status}
                                status={status}
                                orders={ordersByStatus(status)}
                                onAdvanceOrder={handleAction}
                            />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
