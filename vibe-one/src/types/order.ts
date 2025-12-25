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

export interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
    isAvailable: boolean;
}

export const STATUS_CONFIG: Record<OrderStatus, {
    label: string;
    labelPt: string;
    color: string;
    bgClass: string;
    action?: string;
}> = {
    pending_payment: {
        label: 'Pending Payment',
        labelPt: 'Aguardando Pagamento',
        color: 'text-red-400',
        bgClass: 'status-pending',
        action: undefined,
    },
    paid: {
        label: 'Paid',
        labelPt: 'Pago',
        color: 'text-emerald-400',
        bgClass: 'status-paid',
        action: 'ENVIAR P/ COZINHA',
    },
    preparing: {
        label: 'Preparing',
        labelPt: 'Preparando',
        color: 'text-yellow-400',
        bgClass: 'status-preparing',
        action: 'PRONTO',
    },
    ready: {
        label: 'Ready',
        labelPt: 'Pronto',
        color: 'text-emerald-400',
        bgClass: 'status-ready',
        action: 'DESPACHAR',
    },
    delivering: {
        label: 'Delivering',
        labelPt: 'Em Entrega',
        color: 'text-cyan-400',
        bgClass: 'status-delivering',
        action: 'FINALIZAR',
    },
    completed: {
        label: 'Completed',
        labelPt: 'Finalizado',
        color: 'text-muted-foreground',
        bgClass: 'bg-muted/50',
    },
    cancelled: {
        label: 'Cancelled',
        labelPt: 'Cancelado',
        color: 'text-muted-foreground',
        bgClass: 'bg-muted/50',
    },
};
