import { useState, useCallback } from 'react';
import { Order, OrderStatus } from '@/types/order';

// Mock data for development
const mockOrders: Order[] = [
  {
    id: 'a1b2c3d4',
    customerPhone: '+5511999999999',
    customerName: 'João Silva',
    status: 'paid',
    totalAmount: 45.90,
    paymentId: 'mp_12345',
    createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
    items: [
      { id: '1', productName: 'X-Burger', quantity: 2, price: 18.90 },
      { id: '2', productName: 'Batata Frita G', quantity: 1, price: 8.10, notes: 'Bem crocante' },
    ],
  },
  {
    id: 'e5f6g7h8',
    customerPhone: '+5511988888888',
    customerName: 'Maria Santos',
    status: 'preparing',
    totalAmount: 32.50,
    paymentId: 'mp_12346',
    createdAt: new Date(Date.now() - 12 * 60 * 1000), // 12 min ago
    items: [
      { id: '3', productName: 'Pizza Margherita', quantity: 1, price: 32.50, notes: 'Sem azeitona' },
    ],
  },
  {
    id: 'i9j0k1l2',
    customerPhone: '+5511977777777',
    customerName: 'Pedro Costa',
    status: 'pending_payment',
    totalAmount: 67.80,
    createdAt: new Date(Date.now() - 2 * 60 * 1000), // 2 min ago
    items: [
      { id: '4', productName: 'Combo Família', quantity: 1, price: 67.80 },
    ],
  },
  {
    id: 'm3n4o5p6',
    customerPhone: '+5511966666666',
    customerName: 'Ana Oliveira',
    status: 'ready',
    totalAmount: 28.90,
    paymentId: 'mp_12347',
    createdAt: new Date(Date.now() - 25 * 60 * 1000), // 25 min ago
    items: [
      { id: '5', productName: 'Açaí 500ml', quantity: 1, price: 18.90 },
      { id: '6', productName: 'Água Mineral', quantity: 2, price: 5.00 },
    ],
  },
  {
    id: 'q7r8s9t0',
    customerPhone: '+5511955555555',
    customerName: 'Carlos Lima',
    status: 'delivering',
    totalAmount: 89.90,
    paymentId: 'mp_12348',
    createdAt: new Date(Date.now() - 35 * 60 * 1000), // 35 min ago
    items: [
      { id: '7', productName: 'Rodízio Pizza', quantity: 2, price: 44.95 },
    ],
  },
];

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);

  const updateOrderStatus = useCallback((orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => 
      prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      )
    );
  }, []);

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const statusFlow: Partial<Record<OrderStatus, OrderStatus>> = {
      paid: 'preparing',
      preparing: 'ready',
      ready: 'delivering',
      delivering: 'completed',
    };
    return statusFlow[currentStatus] || null;
  };

  const advanceOrder = useCallback((orderId: string) => {
    setOrders(prev => 
      prev.map(order => {
        if (order.id !== orderId) return order;
        const nextStatus = getNextStatus(order.status);
        return nextStatus ? { ...order, status: nextStatus } : order;
      })
    );
  }, []);

  const addOrder = useCallback((order: Order) => {
    setOrders(prev => [order, ...prev]);
  }, []);

  const activeOrders = orders.filter(o => 
    !['completed', 'cancelled'].includes(o.status)
  );

  const ordersByStatus = (status: OrderStatus) => 
    orders.filter(o => o.status === status);

  return {
    orders,
    activeOrders,
    ordersByStatus,
    updateOrderStatus,
    advanceOrder,
    addOrder,
  };
}
