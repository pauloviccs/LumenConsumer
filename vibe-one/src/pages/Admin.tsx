import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { QrCode, Wifi, WifiOff, Wallet, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function Admin() {
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
    const [loading, setLoading] = useState(false);

    // Pix State
    const [pixKey, setPixKey] = useState('');
    const [pixType, setPixType] = useState('cnpj');
    const [savingPix, setSavingPix] = useState(false);

    useEffect(() => {
        // Load initial Config
        loadTenantConfig();
    }, []);

    const loadTenantConfig = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single();
        if (!profile) return;

        const { data: tenant } = await supabase.from('tenants').select('pix_key, pix_key_type').eq('id', profile.tenant_id).single();

        if (tenant) {
            setPixKey(tenant.pix_key || '');
            setPixType(tenant.pix_key_type || 'cnpj');
        }
    }

    const handleSavePix = async () => {
        setSavingPix(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user!.id).single();

            const { error } = await supabase
                .from('tenants')
                .update({ pix_key: pixKey, pix_key_type: pixType })
                .eq('id', profile!.tenant_id);

            if (error) throw error;
            alert("Configuração PIX Salva!");
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar PIX");
        } finally {
            setSavingPix(false);
        }
    };

    const handleConnect = async () => {
        setLoading(true);
        setStatus('connecting');
        setQrCode(null);

        // DEV MODE DEFAULTS
        const EVO_URL = "http://localhost:8080";
        const EVO_KEY = "vibeone123";

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não logado");

            const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single();
            if (!profile) throw new Error("Perfil não encontrado");

            // 1. Create/Check Instance Locally
            const instanceName = `tenant_${profile.tenant_id.replace(/-/g, '')}`;

            console.log(`Connecting to local Evolution: ${instanceName}`);

            // A. Tentar criar
            const createRes = await fetch(`${EVO_URL}/instance/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': EVO_KEY
                },
                body: JSON.stringify({
                    instanceName: instanceName,
                    token: instanceName,
                    qrcode: true,
                    integration: "WHATSAPP-BAILEYS"
                })
            });

            // Log detailed error if failed
            if (!createRes.ok) {
                const errText = await createRes.text();
                // If it's not "already exists", we stop and alert
                if (!errText.toLowerCase().includes("already exists")) {
                    console.error("Evolution Create Error:", errText);
                    throw new Error(`Erro API Criação (${createRes.status}): ${errText}`);
                }
                console.log("Instance likely already exists, proceeding to connect...");
            }

            // B. Connect (Fetch QR)
            const connectRes = await fetch(`${EVO_URL}/instance/connect/${instanceName}`, {
                headers: { 'apikey': EVO_KEY }
            });

            if (!connectRes.ok) {
                const errText = await connectRes.text();
                throw new Error(`Erro API Conexão (${connectRes.status}): ${errText}`);
            }

            const connectData = await connectRes.json();

            // C. Update Supabase
            const { error: dbError } = await supabase
                .from('tenants')
                .update({
                    evolution_instance_name: instanceName,
                    evolution_api_key: instanceName
                })
                .eq('id', profile.tenant_id);

            if (dbError) console.error("Database Update Error (Non-fatal):", dbError);

            // D. Update UI
            if (connectData?.base64) {
                setQrCode(connectData.base64);
                setStatus('disconnected');
            } else if (connectData?.instance?.state === 'open') {
                setStatus('connected');
                alert("Já conectado!");
            }

        } catch (error: any) {
            console.error(error);
            alert("FALHA: " + error.message);
            setStatus('disconnected');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold mb-8">Administração do Sistema</h1>

            {/* PIX CONFIGURATION */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <Wallet className="w-6 h-6 text-emerald-500" />
                    <h2 className="text-xl font-semibold">Configuração Financeira (PIX)</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium mb-1 text-zinc-400">Tipo de Chave</label>
                        <select
                            value={pixType}
                            onChange={e => setPixType(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        >
                            <option value="cnpj">CNPJ</option>
                            <option value="cpf">CPF</option>
                            <option value="email">E-mail</option>
                            <option value="phone">Telefone</option>
                            <option value="random">Aleatória</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1 text-zinc-400">Chave PIX</label>
                        <input
                            type="text"
                            value={pixKey}
                            onChange={e => setPixKey(e.target.value)}
                            placeholder="Digite sua chave pix..."
                            className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleSavePix}
                        disabled={savingPix}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 px-6 py-2 rounded font-bold transition-colors disabled:opacity-50">
                        <Save className="w-4 h-4" />
                        {savingPix ? 'Salvando...' : 'Salvar Configuração'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Connection Card */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <QrCode className="w-6 h-6 text-primary" />
                        <h2 className="text-xl font-semibold">Conexão WhatsApp</h2>
                        <Badge className={status === 'connected' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}>
                            {status === 'connected' ? 'CONECTADO' : 'DESCONECTADO'}
                        </Badge>
                    </div>

                    <div className="space-y-4">
                        <p className="text-muted-foreground text-sm">
                            Clique abaixo para conectar o WhatsApp da sua loja.
                        </p>

                        <button
                            onClick={handleConnect}
                            disabled={loading || status === 'connected'}
                            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-4 py-4 rounded transition-colors font-bold text-lg">
                            {loading ? <Wifi className="w-6 h-6 animate-pulse" /> : <Wifi className="w-6 h-6" />}
                            {status === 'connected' ? 'Loja Conectada' : 'CONECTAR WHATSAPP'}
                        </button>
                    </div>
                </div>

                {/* QR Display */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center min-h-[300px]">
                    {qrCode ? (
                        <div className="text-center animate-in fade-in zoom-in">
                            <img src={qrCode} alt="QR Code" className="w-64 h-64 bg-white p-2 rounded-lg mb-4" />
                            <p className="text-zinc-400 text-sm animate-pulse">Aponte a câmera do seu WhatsApp</p>
                        </div>
                    ) : (
                        <div className="text-center text-zinc-600">
                            {status === 'connected' ? (
                                <Wifi className="w-16 h-16 mx-auto mb-4 text-green-500" />
                            ) : (
                                <WifiOff className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            )}
                            <p>{status === 'connected' ? 'Tudo pronto!' : 'Aguardando conexão...'}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
