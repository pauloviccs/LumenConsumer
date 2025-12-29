import { useState, useEffect } from 'react';
import {
    Settings,
    Lock,
    DollarSign,
    TrendingUp,
    MessageSquare,
    Smartphone,
    CheckCircle2,
    XCircle,
    Wifi,
    QrCode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatsCard } from '@/components/StatsCard';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";

export function Admin() {

    // Lock State
    const [isLocked, setIsLocked] = useState(true);
    const [pin, setPin] = useState('');
    const [storedPin, setStoredPin] = useState<string | null>(null);
    const [isChangePinOpen, setIsChangePinOpen] = useState(false);
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [currentInputPin, setCurrentInputPin] = useState('');

    // Data State


    // Config State
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [pixKey, setPixKey] = useState('');
    const [pixType, setPixType] = useState('cnpj');
    const [savingPix, setSavingPix] = useState(false);

    // WhatsApp State
    const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
    const [loading, setLoading] = useState(false);

    // --- Stats State ---
    const [stats, setStats] = useState({
        revenueToday: 0,
        ordersToday: 0,
        ticketAvg: 0
    });

    // --- Effects ---
    useEffect(() => {
        loadTenantConfig();
        fetchRealtimeStats();
    }, []);

    // --- Stats Logic ---
    const fetchRealtimeStats = async () => {
        try {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayISO = todayStart.toISOString();

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Robust Tenant Fetch
            const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single();
            if (!profile) return;

            // Fetch Orders for Today
            const { data: ordersData, error } = await supabase
                .from('orders')
                .select('total_amount') // Use snake_case column
                .eq('tenant_id', profile.tenant_id)
                .gte('created_at', todayISO) // Use snake_case column
                .neq('status', 'cancelled');

            if (error) throw error;

            if (ordersData) {
                // Map from DB column (total_amount) to logic
                const revenue = ordersData.reduce((acc, curr: any) => acc + (curr.total_amount || 0), 0);
                const count = ordersData.length;
                const avg = count > 0 ? revenue / count : 0;

                setStats({
                    revenueToday: revenue,
                    ordersToday: count,
                    ticketAvg: avg
                });
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    // --- Config Logic ---
    const loadTenantConfig = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single();
            if (!profile) return;

            const { data: tenant } = await supabase.from('tenants').select('pix_key, pix_key_type').eq('id', profile.tenant_id).single();

            if (tenant) {
                setPixKey(tenant.pix_key || '');
                setPixType(tenant.pix_key_type || 'cnpj');
            }

            // Separate fetch for admin_pin
            const { data: pinData, error: pinError } = await supabase.from('tenants').select('admin_pin').eq('id', profile.tenant_id).single();

            if (pinData && !pinError && pinData.admin_pin) {
                setStoredPin(pinData.admin_pin);
            } else {
                // If null, we default to 1234 but DON'T warn noisily if default behavior is expected
                console.log("Admin Pin not set or column missing. Using default.");
                setStoredPin(null);
            }

        } catch (e) {
            console.error("Error loading config", e);
        }
    }

    const handleSaveNewPin = async () => {
        if (newPin.length !== 4) return alert("O PIN deve ter 4 dígitos");
        if (newPin !== confirmPin) return alert("Os PINs não conferem");

        // Verify Current PIN if strictly changing (not first access force)
        const currentCorrectPin = storedPin || '1234';
        if (storedPin && currentInputPin !== currentCorrectPin) {
            return alert("A senha atual está incorreta.");
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            // Robust Tenant Fetch
            const { data: profile } = await supabase
                .from('profiles')
                .select('tenant_id')
                .eq('id', user!.id)
                .single();

            if (!profile?.tenant_id) throw new Error("Tenant ID não encontrado.");

            const { data: updateData, error } = await supabase
                .from('tenants')
                .update({ admin_pin: newPin })
                .eq('id', profile.tenant_id)
                .select(); // Select back to verify

            if (error) throw error;

            // Check if row was actually updated
            if (!updateData || updateData.length === 0) {
                throw new Error("Nenhum dado foi atualizado via RLS. Verifique permissões.");
            }

            alert("Novo PIN cadastrado com sucesso!");
            setStoredPin(newPin); // Immediate local update
            setIsChangePinOpen(false);
            setNewPin('');
            setConfirmPin('');
            setCurrentInputPin('');

            if (isLocked) setIsLocked(false);

        } catch (error: any) {
            console.error(error);
            if (error.code === '42703') {
                alert("ERRO CRÍTICO: Coluna 'admin_pin' não existe no banco de dados.");
            } else {
                alert("Erro ao salvar senha: " + error.message);
            }
        }
    };

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
            setIsConfigOpen(false);
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar PIX");
        } finally {
            setSavingPix(false);
        }
    };

    // --- WhatsApp Logic ---
    const handleConnect = async () => {
        console.log("--- STARTING HANDLE CONNECT ---"); // Debug 1
        setLoading(true);
        setStatus('connecting');
        setQrCode(null);

        const EVO_URL = import.meta.env.VITE_EVOLUTION_API_URL || "http://localhost:8080";
        const EVO_KEY = import.meta.env.VITE_EVOLUTION_API_KEY || "vibeone123";

        console.log("Config:", { EVO_URL, EVO_KEY }); // Debug 2

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não logado");

            console.log("User found:", user.id); // Debug 3

            const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single();
            if (!profile) throw new Error("Perfil não encontrado");

            const instanceName = `tenant_${profile.tenant_id.replace(/-/g, '')}`;
            console.log("Instance Name:", instanceName); // Debug 4

            // 1. Check State First
            console.log("Checking existence...");
            let instanceState = null;
            try {
                // Add validation for Environment Variables
                if (EVO_URL.includes("localhost")) {
                    console.warn("Using localhost for API. Ensure backend is reachable.");
                }

                const checkRes = await fetch(`${EVO_URL}/instance/connectionState/${instanceName}`, {
                    headers: { 'apikey': EVO_KEY }
                });

                if (checkRes.ok) {
                    const checkData = await checkRes.json();
                    console.log("Check Data:", checkData);
                    instanceState = checkData?.instance?.state;
                }
            } catch (e) {
                console.log("Check failed", e);
            }

            // 2. Decide Action
            if (instanceState === 'open') {
                console.log("Instance is OPEN (Connected)");
                setStatus('connected');
                alert("Esta instância já está conectada!");
                setLoading(false);
                return; // Stop here
            }

            // 3. Force Delete (Cleanup) to ensure fresh start
            if (instanceState) { // If it exists but not open (close, connecting, etc)
                console.log("Instance exists but not open. Deleting...", instanceState);
                try {
                    await fetch(`${EVO_URL}/instance/delete/${instanceName}`, {
                        method: 'DELETE',
                        headers: { 'apikey': EVO_KEY }
                    });
                    // Small delay to ensure deletion processes
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } catch (e) {
                    console.error("Delete failed", e);
                }
            }

            // 4. Create Fresh Instance
            console.log("Creating Fresh Instance...");
            const createRes = await fetch(`${EVO_URL}/instance/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': EVO_KEY },
                body: JSON.stringify({
                    instanceName: instanceName,
                    token: instanceName,
                    qrcode: true,
                    integration: "WHATSAPP-BAILEYS"
                })
            });

            if (!createRes.ok) {
                const err = await createRes.text();
                // If "already exists", ignore
                if (!err.includes("already exists") && createRes.status !== 403) {
                    throw new Error("Falha ao criar instância: " + err);
                }
            }

            // CHECK: Did creation return the QR Code?
            const createData = await createRes.json().catch(() => null);
            console.log("Creation Data:", createData);

            let qrData = createData?.qrcode?.base64 || createData?.base64; // Check typical paths

            if (qrData) {
                console.log("QR Code received directly from Creation!");
                setQrCode(qrData);
                setStatus('disconnected');
            } else {
                // Only fetch if we didn't get it from creation
                console.log("Fetching QR (Fallback Strategy)...");

                let attempts = 0;
                let maxAttempts = 3;
                let success = false;

                while (attempts < maxAttempts && !success) {
                    attempts++;
                    console.log(`Attempt ${attempts}/${maxAttempts} fetching QR...`);

                    // Wait increasing time: 2s, then 3s, then 4s
                    await new Promise(resolve => setTimeout(resolve, 1000 + (attempts * 1000)));

                    try {
                        const connectRes = await fetch(`${EVO_URL}/instance/connect/${instanceName}`, {
                            headers: { 'apikey': EVO_KEY }
                        });

                        if (connectRes.ok) {
                            const connectData = await connectRes.json();
                            console.log("Connect Loop Data:", connectData);

                            if (connectData?.base64 || connectData?.qrcode?.base64) {
                                setQrCode(connectData.base64 || connectData.qrcode.base64);
                                setStatus('disconnected');
                                success = true;
                            } else if (connectData?.instance?.state === 'open') {
                                setStatus('connected');
                                alert("Conectado automaticamente!");
                                success = true;
                            }
                            // If count: 0, it just loops again
                        }
                    } catch (e) {
                        console.log("Connect attempt failed", e);
                    }
                }

                if (!success) {
                    throw new Error("Não foi possível obter o QR Code após várias tentativas. Verifique o console da Evolution API.");
                }
            }

            // Update Supabase
            await supabase.from('tenants').update({
                evolution_instance_name: instanceName,
                evolution_api_key: instanceName
            }).eq('id', profile.tenant_id);

        } catch (error: any) {
            console.error("CRITICAL ERROR:", error);
            alert("FALHA: " + error.message);
            setStatus('disconnected');
        } finally {
            setLoading(false);
            console.log("--- END HANDLE CONNECT ---");
        }
    };

    // --- Lock Logic ---
    const handlePinInput = (digit: string) => {
        if (pin.length < 4) {
            const newPin = pin + digit;
            setPin(newPin);

            if (newPin.length === 4) {
                const currentCorrectPin = storedPin || '1234';

                if (newPin === currentCorrectPin) {
                    // Force change if default pin is used (and storedPin is null or explicit 1234)
                    if (newPin === '1234' && (!storedPin || storedPin === '1234')) {
                        setPin('');
                        setIsChangePinOpen(true);
                        setIsLocked(false); // <--- CRITICAL FIX: Unlock so Dialog can be seen!
                    } else {
                        setIsLocked(false);
                        setPin('');
                    }
                } else {
                    // Wrong PIN
                    setTimeout(() => setPin(''), 300);
                }
            }
        }
    };




    if (isLocked) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-background">
                <div className="w-full max-w-sm animate-in fade-in zoom-in duration-300">
                    <div className="text-center mb-8">
                        <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                            <Lock className="h-10 w-10 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground mb-2">Área Restrita</h1>
                        <p className="text-muted-foreground">Digite o PIN para acessar</p>
                    </div>

                    {/* PIN Display */}
                    <div className="flex justify-center gap-3 mb-8">
                        {[0, 1, 2, 3].map(i => (
                            <div
                                key={i}
                                className={cn(
                                    "h-4 w-4 rounded-full transition-all duration-200",
                                    i < pin.length ? "bg-primary scale-110" : "bg-muted"
                                )}
                            />
                        ))}
                    </div>

                    {/* PIN Pad */}
                    <div className="grid grid-cols-3 gap-3">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '←'].map((digit, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    if (digit === '←') {
                                        setPin(prev => prev.slice(0, -1));
                                    } else if (digit) {
                                        handlePinInput(digit);
                                    }
                                }}
                                disabled={!digit}
                                className={cn(
                                    "h-16 rounded-xl font-mono text-2xl font-bold transition-all duration-200",
                                    digit
                                        ? "bg-card border border-border hover:bg-muted hover:scale-105 active:scale-95 text-foreground"
                                        : "invisible",
                                    digit === '←' && "text-muted-foreground text-xl"
                                )}
                            >
                                {digit}
                            </button>
                        ))}
                    </div>

                    <p className="text-center text-xs text-muted-foreground mt-6">
                        PIN padrão: 1234
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-xl">
                <div className="flex h-16 items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                            <Settings className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Administração</h1>
                            <p className="text-sm text-muted-foreground">
                                Configurações e relatórios
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => setIsLocked(true)}
                        className="gap-2"
                    >
                        <Lock className="h-4 w-4" />
                        Bloquear
                    </Button>
                </div>
            </header>

            <main className="p-6">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <StatsCard
                        title="Faturamento Hoje"
                        value={`R$ ${stats.revenueToday.toFixed(2)}`}
                        icon={DollarSign}
                        trend={{ value: 0, isPositive: true }} // Mock trend for now
                        variant="success"
                    />
                    <StatsCard
                        title="Pedidos Hoje"
                        value={stats.ordersToday.toString()}
                        icon={TrendingUp}
                        variant="primary"
                    />
                    <StatsCard
                        title="Ticket Médio"
                        value={`R$ ${stats.ticketAvg.toFixed(2)}`}
                        icon={DollarSign}
                        variant="default"
                    />
                </div>

                {/* Integrations Status */}
                <div className="rounded-xl border bg-card p-6 mb-8">
                    <h2 className="text-lg font-semibold text-foreground mb-4">
                        Status das Integrações
                    </h2>

                    <div className="space-y-4">
                        {/* WhatsApp Item - Click to Configure */}
                        <div
                            onClick={() => setIsWhatsAppOpen(true)}
                            className="flex items-center justify-between p-4 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted/80 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                    <MessageSquare className="h-5 w-5 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">WhatsApp (Evolution API)</p>
                                    <p className="text-sm text-muted-foreground">
                                        {status === 'connected' ? 'Recebendo mensagens' : 'Clique para conectar'}
                                    </p>
                                </div>
                            </div>
                            <div className={cn("flex items-center gap-2", status === 'connected' ? "text-emerald-500" : "text-amber-500")}>
                                <CheckCircle2 className="h-5 w-5" />
                                <span className="font-medium">{status === 'connected' ? 'Conectado' : 'Conectar'}</span>
                            </div>
                        </div>

                        {/* Mercado Pago Item */}
                        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                                    <DollarSign className="h-5 w-5 text-cyan-500" />
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">Mercado Pago</p>
                                    <p className="text-sm text-muted-foreground">Processando pagamentos</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-500">
                                <CheckCircle2 className="h-5 w-5" />
                                <span className="font-medium">Ativo</span>
                            </div>
                        </div>

                        {/* Printer Item */}
                        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">Impressora Térmica</p>
                                    <p className="text-sm text-muted-foreground">Não configurada</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <XCircle className="h-5 w-5" />
                                <span className="font-medium">Offline</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="rounded-xl border bg-card p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">
                        Ações Rápidas
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                            <DollarSign className="h-5 w-5" />
                            <span>Fechar Caixa</span>
                        </Button>
                        <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                            <TrendingUp className="h-5 w-5" />
                            <span>Relatório</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="h-auto py-4 flex-col gap-2"
                            onClick={() => setIsWhatsAppOpen(true)}
                        >
                            <MessageSquare className="h-5 w-5" />
                            <span>Reconectar WA</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="h-auto py-4 flex-col gap-2"
                            onClick={() => {
                                setCurrentInputPin('');
                                setNewPin('');
                                setConfirmPin('');
                                setIsChangePinOpen(true);
                            }}
                        >
                            <Lock className="h-5 w-5" />
                            <span>Alterar Senha</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="h-auto py-4 flex-col gap-2"
                            onClick={() => setIsConfigOpen(true)}
                        >
                            <Settings className="h-5 w-5" />
                            <span>Configurações</span>
                        </Button>
                    </div>
                </div>
            </main>

            {/* --- Dialogs --- */}

            {/* Config Dialog */}
            <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Configurações do Sistema</DialogTitle>
                        <DialogDescription>
                            Configure os dados da sua loja e pagamentos.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="gap-4 py-4 space-y-4">
                        <div className="space-y-2">
                            <h3 className="font-medium">Chave PIX</h3>
                            <div className="flex gap-2">
                                <select
                                    value={pixType}
                                    onChange={e => setPixType(e.target.value)}
                                    className="bg-background border border-input rounded px-3 py-2 text-sm"
                                >
                                    <option value="cnpj">CNPJ</option>
                                    <option value="cpf">CPF</option>
                                    <option value="email">E-mail</option>
                                    <option value="phone">Telefone</option>
                                    <option value="random">Aleatória</option>
                                </select>
                                <Input
                                    value={pixKey}
                                    onChange={e => setPixKey(e.target.value)}
                                    placeholder="Digite sua chave pix..."
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={handleSavePix} disabled={savingPix}>
                            {savingPix ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* WhatsApp Dialog */}
            <Dialog open={isWhatsAppOpen} onOpenChange={setIsWhatsAppOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Conexão WhatsApp</DialogTitle>
                        <DialogDescription>
                            Escaneie o QR Code para conectar seu WhatsApp.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col items-center justify-center p-4">
                        {qrCode ? (
                            <div className="text-center animate-in fade-in zoom-in">
                                <img src={qrCode} alt="QR Code" className="w-64 h-64 bg-white p-2 rounded-lg mb-4" />
                                <p className="text-sm text-muted-foreground animate-pulse">
                                    Aponte a câmera do seu WhatsApp
                                </p>
                            </div>
                        ) : (
                            <div className="text-center">
                                {status === 'connected' ? (
                                    <>
                                        <div className="h-20 w-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Wifi className="w-10 h-10 text-emerald-500" />
                                        </div>
                                        <p className="text-emerald-500 font-bold mb-2">Conectado com Sucesso!</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                            <QrCode className="w-10 h-10 text-muted-foreground" />
                                        </div>
                                        <p className="text-muted-foreground mb-4">Clique abaixo para gerar o QR Code</p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="sm:justify-center">
                        <Button
                            onClick={handleConnect}
                            disabled={loading || status === 'connected'}
                            className="w-full"
                        >
                            {loading ? 'Gerando QR Code...' : status === 'connected' ? 'Desconectar (TBD)' : 'Gerar QR Code'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* ZIP Dialog (Change PIN) */}
            <Dialog open={isChangePinOpen} onOpenChange={(open) => {
                if (!open && !storedPin) {
                    // Prevent closing if forced change (first access)
                    alert("Você deve definir uma senha segura para continuar.");
                    return;
                }
                setIsChangePinOpen(open);
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Definir Senha de Administrador</DialogTitle>
                        <DialogDescription>
                            {storedPin ? "Para alterar, confirme a senha atual." : "Primeiro acesso: Defina sua senha."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {storedPin && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Senha Atual ({storedPin ? '****' : 'Defina'})</label>
                                <Input
                                    type="password"
                                    maxLength={4}
                                    value={currentInputPin}
                                    onChange={e => setCurrentInputPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                    placeholder="Senha Atual"
                                    className="text-center text-2xl tracking-[1em]"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nova Senha</label>
                            <Input
                                type="password"
                                maxLength={4}
                                value={newPin}
                                onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                placeholder="4 dígitos"
                                className="text-center text-2xl tracking-[1em]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Confirmar Nova Senha</label>
                            <Input
                                type="password"
                                maxLength={4}
                                value={confirmPin}
                                onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                placeholder="Repita a senha"
                                className="text-center text-2xl tracking-[1em]"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={handleSaveNewPin} className="w-full">
                            {storedPin ? "Alterar Senha" : "Definir Senha"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
