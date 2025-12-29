import type { OrderStatus } from "../types/order";
import { KanbanColumn } from "../components/KanbanColumn";
import { StatsCard } from "../components/StatsCard";
import { supabase } from "../lib/supabase";
import { useOrders } from "../hooks/useOrders";
import {
    Activity,
    Users,
    DollarSign,
    ShoppingCart,
    Plus
} from "lucide-react";
import { CreateOrderDialog } from "../components/CreateOrderDialog";

const kanbanStatuses: OrderStatus[] = [
    'pending_payment',
    'paid',
    'preparing',
    'ready',
    'delivering'
];

export function Dashboard() {
    const { orders, refresh } = useOrders({ includeHistory: true });

    // Stats Logic (Calculated from fetched orders)
    const activeOrdersCount = orders.filter(o => !['completed', 'cancelled'].includes(o.status)).length;
    const deliveredTodayCount = orders.filter(o => o.status === 'completed').length;
    // Note: 'completed' in list is limited to 30 recent. For accurate "Today" stats we'd need a specific query.
    // For now, using loaded data is acceptable for the MVP migration.

    // Total Revenue (Approximate from loaded data)
    const totalRevenue = orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.totalAmount, 0);

    const handleAction = async (orderId: string) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        let nextStatus: OrderStatus | undefined;
        if (order.status === 'paid') nextStatus = 'preparing';
        else if (order.status === 'preparing') nextStatus = 'ready';
        else if (order.status === 'ready') nextStatus = 'delivering'; // Fixed flow
        else if (order.status === 'delivering') nextStatus = 'completed';

        if (nextStatus) {
            await supabase.from('orders').update({ status: nextStatus }).eq('id', orderId);
            // Realtime will auto-refresh
        }
    };



    const handleCancel = async (orderId: string) => {
        if (!confirm("Tem certeza que deseja cancelar este pedido?")) return;

        const { error } = await supabase
            .from('orders')
            .update({ status: 'cancelled' })
            .eq('id', orderId);

        if (error) {
            console.error(error);
            alert("Erro ao cancelar");
        }
    };

    return (
        <div className="flex bg-background min-h-[calc(100vh-4rem)]">
            <div className="flex-1 p-8 overflow-x-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Painel de Controle</h1>
                        <p className="text-muted-foreground mt-1">Visão geral da operação</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Atualizar
                        </button>
                        <CreateOrderDialog onOrderCreated={refresh}>
                            <button
                                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Novo Pedido
                            </button>
                        </CreateOrderDialog>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatsCard
                        title="Pedidos Ativos"
                        value={activeOrdersCount.toString()}
                        icon={ShoppingCart}
                        description="Na fila de produção"
                    />
                    <StatsCard
                        title="Entregues (Recente)"
                        value={deliveredTodayCount.toString()}
                        icon={Activity}
                        description="Últimos 30 pedidos"
                    />
                    <StatsCard
                        title="Faturamento (Visible)"
                        value={`R$ ${totalRevenue.toFixed(2)}`}
                        icon={DollarSign}
                        description="Baseado nos pedidos em tela"
                    />
                    <StatsCard
                        title="Clientes"
                        value={new Set(orders.map(o => o.customerPhone)).size.toString()}
                        icon={Users}
                        description="Clientes únicos recentes"
                    />
                </div>

                {/* Kanban Board */}
                <div className="flex gap-6 overflow-x-auto pb-8 min-w-full">
                    {kanbanStatuses.map((status) => (
                        <KanbanColumn
                            key={status}
                            status={status}
                            orders={orders.filter(o => o.status === status)}
                            onAdvanceOrder={handleAction}
                            onCancelOrder={handleCancel}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
