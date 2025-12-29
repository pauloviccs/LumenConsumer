import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Order, OrderStatus } from '@/types/order';
import { useTenant } from './useTenant';

export function useOrders(filters?: { status?: OrderStatus[], includeHistory?: boolean }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { tenantId } = useTenant();

  const fetchOrders = useCallback(async () => {
    if (!tenantId) return;

    // Helper to format raw DB response
    const formatOrders = (data: any[]): Order[] => {
      return data.map((o: any) => ({
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
    };

    try {
      // Kitchen Mode (Filter by explicit Status)
      if (filters?.status && filters.status.length > 0) {
        const { data, error } = await supabase
          .from('orders')
          .select(`*, items:order_items(*)`)
          .eq('tenant_id', tenantId)
          .in('status', filters.status)
          .order('created_at', { ascending: true }); // Oldest first

        if (error) throw error;
        setOrders(formatOrders(data || []));
      }
      // Dashboard Mode (Active + Optional History)
      else {
        // A. Fetch Active (All non-completed)
        const { data: activeData, error: activeError } = await supabase
          .from('orders')
          .select(`*, items:order_items(*)`)
          .eq('tenant_id', tenantId)
          .neq('status', 'completed')
          .neq('status', 'cancelled')
          .order('created_at', { ascending: true });

        if (activeError) throw activeError;

        let finalData = activeData || [];

        // B. Fetch History (Recent 30)
        if (filters?.includeHistory) {
          const { data: historyData, error: historyError } = await supabase
            .from('orders')
            .select(`*, items:order_items(*)`)
            .eq('tenant_id', tenantId)
            .in('status', ['completed', 'cancelled'])
            .order('created_at', { ascending: false })
            .limit(30);

          if (historyError) throw historyError;
          finalData = [...finalData, ...(historyData || [])];
        }

        // Dedup and set
        const unique = Array.from(new Map(finalData.map(item => [item.id, item])).values());
        setOrders(formatOrders(unique));
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, JSON.stringify(filters)]);

  useEffect(() => {
    if (!tenantId) return;

    fetchOrders();

    // Realtime Subscription
    const channelName = `public:orders:${tenantId}:${filters?.status?.join('_') || 'all'}`;
    const subscription = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `tenant_id=eq.${tenantId}`
      }, (payload) => {
        console.log('Realtime update:', payload);
        // Simple strategy: refetch all on any change
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [tenantId, fetchOrders]);

  return { orders, loading, refresh: fetchOrders };
}
