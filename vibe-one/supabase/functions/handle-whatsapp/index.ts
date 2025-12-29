// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

serve(async (req: Request) => {
    try {
        const body = await req.json()
        const { instance, data } = body

        // Evolution API Structure: data.data.message... or data.message
        const messageData = data?.message || data?.data?.message || data?.data
        if (!messageData) return new Response("Ok", { status: 200 })

        const phone = messageData.remoteJid?.split('@')[0]
        const text = messageData.conversation || messageData.extendedTextMessage?.text

        console.log(`Received message from ${phone} on instance ${instance}: ${text}`)

        if (!text) return new Response("Ok", { status: 200 })

        // 0. Resolve Tenant
        let tenantId: string | null = null;
        if (instance) {
            const { data: tenant } = await supabase
                .from('tenants')
                .select('id')
                .eq('evolution_instance_name', instance)
                .single();
            if (tenant) tenantId = tenant.id;
        }

        if (!tenantId) {
            console.error(`Tenant not found for instance: ${instance}`);
            // Return 200 to acknowledge webhook but log error
            return new Response("Tenant Not Found", { status: 200 });
        }

        // Simple Logic: If message contains "cardapio" or "pedido", create a new Order
        if (text.toLowerCase().includes('pedido') || text.toLowerCase().includes('lanche')) {
            // 1. Check if there is an open order (pending_payment or preparing)
            const { data: openOrders } = await supabase
                .from('orders')
                .select('*')
                .eq('tenant_id', tenantId) // Filter by tenant
                .eq('customer_phone', phone)
                .in('status', ['pending_payment', 'preparing'])

            if (openOrders && openOrders.length > 0) {
                // Use Evolution API to reply: "Você já tem um pedido aberto!"
                // For MVP, we just log.
                console.log("Customer already has open order")
                return new Response(JSON.stringify({ message: "Open order exists" }), { status: 200 })
            }

            // 2. Create New Order
            const { data: newOrder, error } = await supabase
                .from('orders')
                .insert({
                    tenant_id: tenantId,
                    customer_phone: phone,
                    customer_name: messageData.pushName || "Cliente WhatsApp",
                    status: 'pending_payment',
                    total_amount: 0.00 // Will be updated as items are added
                })
                .select()
                .single()

            if (error) throw error

            // 3. Insert a dummy item for demo
            await supabase
                .from('order_items')
                .insert({
                    tenant_id: tenantId,
                    order_id: newOrder.id,
                    product_name: "Pedido via WhatsApp",
                    quantity: 1,
                    price: 0.00, // Price logic would be here
                    notes: text
                })
        }

        return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } })

    } catch (error: any) {
        console.error(error)
        return new Response(JSON.stringify({ error: error.message || "Unknown error" }), { status: 500, headers: { "Content-Type": "application/json" } })
    }
})
