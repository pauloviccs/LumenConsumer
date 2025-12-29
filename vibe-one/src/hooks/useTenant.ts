import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useTenant() {
    const [tenantId, setTenantId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTenant() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setLoading(false);
                    return;
                }

                // Try to get from local storage first to save a query
                const cachedTenant = localStorage.getItem(`tenant_${user.id}`);
                if (cachedTenant) {
                    setTenantId(cachedTenant);
                    setLoading(false);
                    return;
                }

                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('tenant_id')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    console.error("Error fetching tenant:", error);
                } else if (profile) {
                    setTenantId(profile.tenant_id);
                    localStorage.setItem(`tenant_${user.id}`, profile.tenant_id);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchTenant();
    }, []);

    return { tenantId, loading };
}
