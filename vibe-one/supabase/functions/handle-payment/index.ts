import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')

serve(async (req) => {
    try {
        const url = new URL(req.url)
        const body = await req.json()
        console.log("MP Webhook:", JSON.stringify(body))

        const paymentId = body.data?.id || body.id
        const action = body.action || body.type

        if (action === 'payment.updated' && paymentId) {
            if (!MP_ACCESS_TOKEN) {
                console.error("Missing MP_ACCESS_TOKEN");
                throw new Error("Server Config Error");
            }

            console.log(`Verifying payment ${paymentId} with Mercado Pago...`);

            const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: {
                    Authorization: `Bearer ${MP_ACCESS_TOKEN}`
                }
            });

            if (!res.ok) {
                console.error(`MP API Error: ${res.status} ${res.statusText}`);
                throw new Error("Failed to fetch payment status from MP");
            }

            const paymentData = await res.json();
            console.log(`Payment Status: ${paymentData.status}`);

            if (paymentData.status === 'approved') {
                const externalReference = paymentData.external_reference;

                // If we attached the Order ID as external_reference
                if (externalReference) {
                    const { error: updateError } = await supabase
                        .from('orders')
                        .update({
                            status: 'paid',
                            payment_id: String(paymentId) // Store the MP ID
                        })
                        .eq('id', externalReference);

                    if (updateError) {
                        console.error("Supabase Update Error:", updateError);
                        throw updateError;
                    }
                    console.log(`Order ${externalReference} marked as PAID.`);
                } else {
                    console.warn("Payment approved but missing external_reference (Order ID).");
                }
            }
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 })

    } catch (error) {
        console.error(error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
})
