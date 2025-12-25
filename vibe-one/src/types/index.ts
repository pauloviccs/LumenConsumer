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
    order_id: string;
    product_name: string;
    quantity: number;
    price: number;
    notes?: string;
}

export interface Order {
    id: string;
    customer_phone: string;
    customer_name: string;
    status: OrderStatus;
    total_amount: number;
    payment_id?: string;
    created_at: string;
    items?: OrderItem[]; // Joined view
}

export interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
    is_available: boolean;
}
