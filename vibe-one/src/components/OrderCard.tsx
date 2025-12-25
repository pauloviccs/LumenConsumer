import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Order } from "@/types";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { Clock, CheckCircle2, ShoppingBag, QrCode, Printer } from "lucide-react";

interface OrderCardProps {
    order: Order;
    onAction?: (orderId: string) => void;
}

export function OrderCard({ order, onAction }: OrderCardProps) {
    const isLate = new Date(order.created_at).getTime() < Date.now() - 30 * 60 * 1000; // 30 mins

    const getStatusVariant = () => {
        switch (order.status) {
            case 'pending_payment': return 'pending';
            case 'preparing': return 'preparing';
            case 'ready': return 'ready';
            case 'completed': return 'completed';
            default: return 'outline';
        }
    };

    return (
        <div className={cn(
            "w-full bg-card text-card-foreground rounded-xl border border-border shadow-sm p-4 hover:shadow-md transition-all",
            isLate && order.status !== 'completed' && "border-red-900/50 bg-red-950/10"
        )}>
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">#{order.id.slice(-4)}</span>
                        <Badge variant={getStatusVariant()}>
                            {order.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                        <Clock className="w-3 h-3" />
                        <span>
                            {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-semibold text-foreground">{order.customer_name}</p>
                </div>
            </div>

            {/* Items List */}
            <div className="space-y-2 mb-4">
                {order.items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                            <span className="bg-zinc-800 text-zinc-300 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">
                                {item.quantity}x
                            </span>
                            <span className="text-zinc-200">{item.product_name}</span>
                        </div>
                        {item.notes && (
                            <span className="text-xs text-yellow-500/80 italic block ml-8">
                                * {item.notes}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            <div className="pt-4 border-t border-border flex justify-between items-center">
                <div className="flex gap-4 items-center">
                    <div className="font-extrabold text-lg">
                        R$ {order.total_amount.toFixed(2)}
                    </div>
                    <button
                        onClick={() => triggerPrint(order.id)}
                        className="text-zinc-500 hover:text-white transition-colors p-2 rounded-full hover:bg-zinc-800"
                        title="Imprimir Comanda">
                        <Printer className="w-5 h-5" />
                    </button>
                </div>

                {order.status === 'paid' && (
                    <button
                        onClick={() => onAction?.(order.id)}
                        className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors">
                        <ShoppingBag className="w-4 h-4" />
                        ENVIAR P/ COZINHA
                    </button>
                )}

                {order.status === 'preparing' && (
                    <button
                        onClick={() => onAction?.(order.id)}
                        className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors">
                        <CheckCircle2 className="w-4 h-4" />
                        PRONTO
                    </button>
                )}

                {order.status === 'pending_payment' && (
                    <button
                        onClick={() => {
                            // MOCK PIX: In future this comes from order.payment_pix_code or MercadoPago API
                            const mockPix = "00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540510.005802BR5913Lumen Consumer6008Sao Paulo62070503***6304E2CA";
                            navigator.clipboard.writeText(mockPix);
                            alert("Copia e Cola PIX copiado!");
                        }}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors border border-dashed border-zinc-600">
                        <QrCode className="w-4 h-4" />
                        COPIAR PIX
                    </button>
                )}
            </div>

            {/* Hidden Print Structure */}
            <div id={`print-${order.id}`} className="print-area hidden">
                <div className="p-4 font-mono text-sm max-w-[300px] mx-auto border-b-2 border-dashed border-black pb-4 mb-4">
                    <h1 className="text-xl font-black text-center mb-2">LUMEN BURGER</h1>
                    <p className="text-center mb-4 text-xs">Rua da Fome, 123 - Vibe City</p>

                    <div className="flex justify-between font-bold text-lg mb-2">
                        <span>PEDIDO</span>
                        <span>#{order.id.slice(-4)}</span>
                    </div>
                    <div className="mb-4 text-xs">
                        <p>Cliente: {order.customer_name}</p>
                        <p>Data: {new Date(order.created_at).toLocaleString('pt-BR')}</p>
                    </div>

                    <div className="border-t border-b border-black py-2 mb-4 space-y-1">
                        {order.items?.map(item => (
                            <div key={item.id}>
                                <div className="flex justify-between font-bold">
                                    <span>{item.quantity}x {item.product_name}</span>
                                    <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                                {item.notes && <p className="text-xs italic ml-4">({item.notes})</p>}
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between text-xl font-black">
                        <span>TOTAL</span>
                        <span>R$ {order.total_amount.toFixed(2)}</span>
                    </div>

                    <div className="mt-8 text-center text-xs">
                        <p>*** NÃO É DOCUMENTO FISCAL ***</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper to Trigger Print
// We put this outside avoiding clutter, but effectively we just need to isolate the div
// Since we used a class .print-area, we need to toggle 'hidden' on this specific ID before printing
function triggerPrint(orderId: string) {
    const printContent = document.getElementById(`print-${orderId}`);
    if (printContent) {
        // Temporarily make it visible and everything else hidden is handled by @media print
        // Actually, our CSS says body * hidden, .print-area visible.
        // So we just need to make sure this SPECIFIC print-area is the one visible on screen?
        // No, @media print will show ALL .print-area. We need to hide others.
        // Quickest hack: swap class 'hidden' to 'block' then print then swap back.

        printContent.classList.remove('hidden');
        window.print();
        printContent.classList.add('hidden');
    }
}
