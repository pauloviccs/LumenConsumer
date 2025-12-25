import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

serve(async (req) => {
    try {
        const body = await req.json()

        // 1. Identify the Instance Name from the Webhook
        // Evolution API sends "instance" in the body
        const instanceName = body.instance

        if (!instanceName) {
            console.log("Ignored: No instance name in webhook")
            return new Response("No Instance Name", { status: 200 })
        }

        // 2. Find the Tenant associated with this Instance
        const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .select('id')
            .eq('evolution_instance_name', instanceName)
            .single()

        if (tenantError || !tenant) {
            console.error(`Unknown Instance: ${instanceName}`)
            return new Response("Unknown Instance", { status: 200 }) // Return 200 to stop retries
        }

        const tenantId = tenant.id
        console.log(`Routing message for Tenant: ${tenantId}`)

        // 3. Process the Message (Only "UPSERT" events)
        const eventType = body.event
        if (eventType === "MESSAGES_UPSERT") {
            const messageData = body.data
            const remoteJid = messageData.key.remoteJid
            const fromMe = messageData.key.fromMe

            if (fromMe) return new Response("Ignored: From Me", { status: 200 })

            // Extract text body
            const text = messageData.message?.conversation || messageData.message?.extendedTextMessage?.text

            if (!text) return new Response("Ignored: No Text", { status: 200 })

            console.log(`Received: ${text} from ${remoteJid}`)

            // Simple Logic: If message contains "pedido", create a new Order
            // In a real app, this would be an AI Agent or Menu flow
            if (text.toLowerCase().includes('pedido') || text.toLowerCase().includes('lanche')) {
                // Check if there is an open order for this customer
                // We assume customer_id = phone number for now.
                // In a real app we would have a 'customers' table.

                // Create Order
                const { data: order, error: orderError } = await supabase
                    .from('orders')
                    .insert({
                        customer_name: messageData.pushName || "Cliente WhatsApp",
                        status: 'pending_payment',
                        total: 25.00, // Hardcoded for demo
                        tenant_id: tenantId // <--- CRITICAL: Assign to correct tenant
                    })
                    .select()
                    .single()

                if (orderError) throw orderError

                // Add Dummy Item
                await supabase
                    .from('order_items')
                    .insert({
                        order_id: order.id,
                        product_id: 'd290f1ee-6c54-4b01-90e6-d701748f0851', // Use a real ID or handle dynamic
                        quantity: 1,
                        price: 25.00,
                        tenant_id: tenantId // <--- CRITICAL
                    })

                console.log("Order Created:", order.id)
            }
        }

        return new Response("OK", { status: 200 })

    } catch (error) {
        console.error(error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
})
