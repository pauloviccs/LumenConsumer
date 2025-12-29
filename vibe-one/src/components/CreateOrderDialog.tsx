import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/hooks/useTenant";

interface Product {
    id: string;
    name: string;
    price: number;
}

export function CreateOrderDialog({ children, onOrderCreated }: { children: React.ReactNode, onOrderCreated?: () => void }) {
    const [open, setOpen] = useState(false);
    const { tenantId } = useTenant();

    // Form State
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [items, setItems] = useState<{ productId: string; quantity: number }[]>([]);

    // Data State
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && tenantId) {
            loadProducts();
        }
    }, [open, tenantId]);

    const loadProducts = async () => {
        const { data } = await supabase.from('products').select('id, name, price').eq('tenant_id', tenantId);
        if (data) setProducts(data);
    };

    const addItem = () => {
        setItems([...items, { productId: "", quantity: 1 }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: 'productId' | 'quantity', value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!tenantId) throw new Error("No tenant");

            // Calculate Total
            let total = 0;
            const orderItemsData = items.map(item => {
                const product = products.find(p => p.id === item.productId);
                if (!product) return null;
                total += product.price * item.quantity;
                return {
                    tenant_id: tenantId,
                    product_name: product.name,
                    quantity: item.quantity,
                    price: product.price
                };
            }).filter(Boolean);

            if (orderItemsData.length === 0) throw new Error("Adicione produtos");

            // 1. Create Order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    tenant_id: tenantId,
                    customer_name: customerName,
                    customer_phone: customerPhone,
                    status: 'pending_payment', // Default for manual orders
                    total_amount: total
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Create Items
            const itemsToInsert = orderItemsData.map(i => ({
                ...i,
                order_id: order.id
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(itemsToInsert);

            if (itemsError) throw itemsError;

            setOpen(false);
            if (onOrderCreated) onOrderCreated();

            // Reset
            setCustomerName("");
            setCustomerPhone("");
            setItems([]);

        } catch (error) {
            console.error(error);
            alert("Erro ao criar pedido");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Novo Pedido Manual</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Nome do Cliente</Label>
                            <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Ex: João" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Telefone</Label>
                            <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="11999999999" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label>Itens</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                <Plus className="w-4 h-4 mr-1" /> Adicionar
                            </Button>
                        </div>

                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                            {items.map((item, index) => (
                                <div key={index} className="flex gap-2 items-end">
                                    <div className="flex-1">
                                        <Select
                                            value={item.productId}
                                            onValueChange={(val) => updateItem(index, 'productId', val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {products.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.name} (R$ {p.price.toFixed(2)})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-20">
                                        <Input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={e => updateItem(index, 'quantity', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                                        <X className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Criando...' : 'Confirmar Pedido'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
