import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Phone, User, ChevronRight } from 'lucide-react';
import { Order, STATUS_CONFIG } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface OrderCardProps {
    order: Order;
    onAdvance?: (orderId: string) => void;
    compact?: boolean;
}

export function OrderCard({ order, onAdvance, compact = false }: OrderCardProps) {
    const config = STATUS_CONFIG[order.status];
    const timeAgo = formatDistanceToNow(order.createdAt, {
        addSuffix: true,
        locale: ptBR
    });

    const minutesElapsed = Math.floor((Date.now() - order.createdAt.getTime()) / 60000);
    const isUrgent = minutesElapsed > 30;

    return (
        <div
            className={cn(
                "group relative rounded-xl border bg-card p-4 transition-all duration-300",
                "hover:border-primary/30 hover:shadow-glow",
                order.status === 'paid' && "pulse-glow border-emerald-500/30",
                order.status === 'pending_payment' && "border-red-500/20",
                order.status === 'preparing' && "border-yellow-500/20",
                compact && "p-3"
            )}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold text-foreground">
                        #{order.id.slice(-4).toUpperCase()}
                    </span>
                    <Badge
                        variant="outline"
                        className={cn("text-xs font-medium border", config.bgClass)}
                    >
                        {config.labelPt}
                    </Badge>
                </div>

                <div className={cn(
                    "flex items-center gap-1 text-xs font-mono",
                    isUrgent ? "text-red-400" : "text-muted-foreground"
                )}>
                    <Clock className="h-3 w-3" />
                    {timeAgo}
                </div>
            </div>

            {/* Customer Info */}
            <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    <span className="font-medium text-foreground">{order.customerName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    <span className="font-mono text-xs">
                        {order.customerPhone.slice(-4)}
                    </span>
                </div>
            </div>

            {/* Items */}
            {!compact && (
                <div className="space-y-1.5 mb-4 border-t border-border/50 pt-3">
                    {order.items.map(item => (
                        <div key={item.id} className="flex items-start justify-between text-sm">
                            <div className="flex-1">
                                <span className="font-mono text-primary mr-1">{item.quantity}x</span>
                                <span className="text-foreground">{item.productName}</span>
                                {item.notes && (
                                    <p className="text-xs text-muted-foreground italic mt-0.5">
                                        → {item.notes}
                                    </p>
                                )}
                            </div>
                            <span className="font-mono text-muted-foreground">
                                R$ {(item.price * item.quantity).toFixed(2)}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="font-mono">
                    <span className="text-xs text-muted-foreground">Total</span>
                    <p className="text-lg font-bold text-foreground">
                        R$ {order.totalAmount.toFixed(2)}
                    </p>
                </div>

                {config.action && onAdvance && (
                    <Button
                        onClick={() => onAdvance(order.id)}
                        className={cn(
                            "font-semibold transition-all duration-200",
                            order.status === 'paid' && "bg-emerald-600 hover:bg-emerald-500",
                            order.status === 'preparing' && "bg-yellow-600 hover:bg-yellow-500 text-background",
                            order.status === 'ready' && "bg-cyan-600 hover:bg-cyan-500",
                            order.status === 'delivering' && "bg-primary hover:bg-primary/90",
                        )}
                    >
                        {config.action}
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                )}
            </div>
        </div>
    );
}
