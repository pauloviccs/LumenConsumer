import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

serve(async (req) => {
    try {
        const { data } = await req.json()

        // Evolution API Structure: data.data.message...
        const messageData = data?.data?.message || data?.data
        if (!messageData) return new Response("Ok", { status: 200 })

        const phone = messageData.remoteJid?.split('@')[0]
        const text = messageData.conversation || messageData.extendedTextMessage?.text

        console.log(`Received message from ${phone}: ${text}`)

        if (!text) return new Response("Ok", { status: 200 })

        // Simple Logic: If message contains "cardapio" or "pedido", create a new Order
        if (text.toLowerCase().includes('pedido') || text.toLowerCase().includes('lanche')) {
            // 1. Check if there is an open order (pending_payment or preparing)
            const { data: openOrders } = await supabase
                .from('orders')
                .select('*')
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
                    order_id: newOrder.id,
                    product_name: "Pedido via WhatsApp",
                    quantity: 1,
                    price: 0.00,
                    notes: text
                })
        }

        return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } })

    } catch (error) {
        console.error(error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } })
    }
})
