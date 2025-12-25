import { Order, OrderStatus, STATUS_CONFIG } from '@/types/order';
import { OrderCard } from './OrderCard';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
    status: OrderStatus;
    orders: Order[];
    onAdvanceOrder: (orderId: string) => void;
}

export function KanbanColumn({ status, orders, onAdvanceOrder }: KanbanColumnProps) {
    const config = STATUS_CONFIG[status];

    return (
        <div className="flex flex-col min-w-[340px] max-w-[380px]">
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "h-3 w-3 rounded-full",
                        status === 'pending_payment' && "bg-red-500",
                        status === 'paid' && "bg-emerald-500 animate-pulse",
                        status === 'preparing' && "bg-yellow-500",
                        status === 'ready' && "bg-emerald-500",
                        status === 'delivering' && "bg-cyan-500",
                    )} />
                    <h3 className={cn("font-semibold text-lg", config.color)}>
                        {config.labelPt}
                    </h3>
                </div>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted font-mono text-sm font-bold text-muted-foreground">
                    {orders.length}
                </span>
            </div>

            {/* Cards Container */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-2 pb-4">
                {orders.length === 0 ? (
                    <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border/50 text-muted-foreground text-sm">
                        Nenhum pedido
                    </div>
                ) : (
                    orders.map((order, index) => (
                        <div
                            key={order.id}
                            className="animate-slide-in"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <OrderCard
                                order={order}
                                onAdvance={onAdvanceOrder}
                            />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
