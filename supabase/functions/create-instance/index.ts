import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const EVOLUTION_URL = Deno.env.get('EVOLUTION_API_URL') || "http://host.docker.internal:8080"
const EVOLUTION_KEY = Deno.env.get('EVOLUTION_API_KEY') || "vibeone123"

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

serve(async (req) => {
    // 1. Authenticate Request
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
        return new Response("Unauthorized", { status: 401 })
    }

    try {
        // 2. Identify Tenant
        const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id, tenants(name, evolution_instance_name)')
            .eq('id', user.id)
            .single()

        if (!profile || !profile.tenant_id) {
            return new Response("No Tenant Found", { status: 404 })
        }

        const tenant = profile.tenants
        let instanceName = tenant.evolution_instance_name

        // 3. If no instance assigned, create one
        if (!instanceName) {
            instanceName = `tenant_${profile.tenant_id.replace(/-/g, '')}`
            console.log(`Creating instance: ${instanceName}`)

            // Call Evolution API
            const res = await fetch(`${EVOLUTION_URL}/instance/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': EVOLUTION_KEY
                },
                body: JSON.stringify({
                    instanceName: instanceName,
                    token: instanceName, // Using instance name as token for simplicity
                    qrcode: true
                })
            })

            if (!res.ok) {
                const err = await res.text()
                console.error("Evolution Create Error:", err)
                throw new Error("Failed to create instance")
            }

            // Save relationship
            await supabase
                .from('tenants')
                .update({ evolution_instance_name: instanceName, evolution_api_key: instanceName })
                .eq('id', profile.tenant_id)
        }

        // 4. Connect (Get QR Code)
        const connectRes = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
            headers: { 'apikey': EVOLUTION_KEY }
        })

        // Ensure we get the JSON with base64/qrcode
        const connectData = await connectRes.json()

        return new Response(JSON.stringify(connectData), {
            headers: { 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error(error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
})
