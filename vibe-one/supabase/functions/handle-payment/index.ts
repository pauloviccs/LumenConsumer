import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

// Mock Mercado Pago Access Token for now
const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')

serve(async (req) => {
    try {
        const url = new URL(req.url)
        // Mercado Pago sends topic/id in query params or body depending on version
        // We will assume V1 Webhook: receiving { action: 'payment.updated', data: { id: '...' } }

        const body = await req.json()
        console.log("MP Webhook:", body)

        const paymentId = body.data?.id || body.id
        const action = body.action || body.type

        if (action === 'payment.updated' && paymentId) {
            // In real world: Fetch Payment Status from MP API to ensure it's approved
            // const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } })
            // const paymentData = await res.json()
            // if (paymentData.status === 'approved') ...

            // For MVP/Demo: We trust the webhook (or simulate approval)
            console.log(`Processing payment ${paymentId}`)

            // Find order with this payment_id (we need to save payment_id in order first)
            // OR, for the MVP, we assume the 'external_reference' in MP was the Order ID.

            // Let's assume we pass the Order ID as external_reference when generating PIX.
            // For this handler, we will try to find the order by matching the ID if we had stored it.

            // MVP SHORTCUT: We will not actually query MP because we don't have a valid token yet.
            // We will just log that if we HAD the reference, we would update it.

            /* 
            await supabase
              .from('orders')
              .update({ status: 'paid' })
              .eq('id', external_reference) 
            */

            console.log("Payment Logic Ready. Need MP Credentials to finalize.")
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 })

    } catch (error) {
        console.error(error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
})
