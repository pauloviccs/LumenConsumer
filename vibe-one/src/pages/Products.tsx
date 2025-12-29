import { useState, useEffect } from 'react';
import { Package, Search, Plus, ToggleLeft, ToggleRight, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';

interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
    is_available: boolean; // DB column name assumption
}

export function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // New Product State
    const [isNewProductOpen, setIsNewProductOpen] = useState(false);
    const [newProductName, setNewProductName] = useState('');
    const [newProductPrice, setNewProductPrice] = useState('');
    const [newProductCategory, setNewProductCategory] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Fetch Products ---
    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('category', { ascending: true });

            if (error) throw error;
            if (data) setProducts(data);
        } catch (error) {
            console.error("Erro ao buscar produtos:", error);
            toast.error("Erro ao carregar produtos.");
        } finally {
            setLoading(false);
        }
    };

    // --- Actions ---

    const toggleAvailability = async (productId: string, currentStatus: boolean) => {
        // Optimistic Update
        setProducts(prev =>
            prev.map(p => p.id === productId ? { ...p, is_available: !currentStatus } : p)
        );

        try {
            const { error } = await supabase
                .from('products')
                .update({ is_available: !currentStatus })
                .eq('id', productId);

            if (error) throw error;
        } catch (error) {
            console.error(error);
            toast.error("Erro ao atualizar status");
            // Revert on error
            setProducts(prev =>
                prev.map(p => p.id === productId ? { ...p, is_available: currentStatus } : p)
            );
        }
    };

    const handleAddProduct = async () => {
        if (!newProductName || !newProductPrice || !newProductCategory) {
            return alert("Preencha todos os campos");
        }

        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            // Fetch tenant_id reliably from profiles (metadata might be stale)
            const { data: profile } = await supabase
                .from('profiles')
                .select('tenant_id')
                .eq('id', user.id)
                .single();

            if (!profile?.tenant_id) throw new Error("Tenant ID não encontrado");

            const price = parseFloat(newProductPrice.replace(',', '.'));
            const { data, error } = await supabase
                .from('products')
                .insert([{
                    name: newProductName,
                    price: price,
                    category: newProductCategory,
                    is_available: true,
                    tenant_id: profile.tenant_id
                }])
                .select()
                .single();

            if (error) throw error;

            if (data) {
                setProducts(prev => [...prev, data]);
                setIsNewProductOpen(false);
                setNewProductName('');
                setNewProductPrice('');
                setNewProductCategory('');
                toast.success("Produto adicionado!");
            }
            // Force reload to be safe
            fetchProducts();

        } catch (error: any) {
            console.error(error);
            toast.error("Erro ao adicionar: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProduct = async (productId: string) => {
        if (!confirm("Tem certeza que deseja excluir este produto?")) return;

        // Optimistic remove
        const previousProducts = [...products];
        setProducts(prev => prev.filter(p => p.id !== productId));

        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId);

            if (error) throw error;
            toast.success("Produto removido.");

        } catch (error) {
            console.error(error);
            toast.error("Erro ao remover produto.");
            setProducts(previousProducts);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
    );

    const categories = [...new Set(products.map(p => p.category))];

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-xl">
                <div className="flex h-16 items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                            <Package className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Produtos</h1>
                            <p className="text-sm text-muted-foreground">
                                {products.filter(p => p.is_available).length} disponíveis
                            </p>
                        </div>
                    </div>

                    <Button className="gap-2" onClick={() => setIsNewProductOpen(true)}>
                        <Plus className="h-4 w-4" />
                        Novo Produto
                    </Button>
                </div>
            </header>

            <main className="p-6">
                {/* Search */}
                <div className="relative max-w-md mb-8">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar produtos..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 bg-card border-border"
                    />
                </div>

                {/* Loading State or Empty State */}
                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        Nenhum produto cadastrado.
                    </div>
                ) : (
                    /* Products by Category */
                    <div className="space-y-8">
                        {categories.map(category => {
                            const categoryProducts = filteredProducts.filter(p => p.category === category);
                            if (categoryProducts.length === 0) return null;

                            return (
                                <div key={category}>
                                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                        {category}
                                        <Badge variant="secondary" className="font-mono">
                                            {categoryProducts.length}
                                        </Badge>
                                    </h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {categoryProducts.map(product => (
                                            <div
                                                key={product.id}
                                                className={cn(
                                                    "group relative flex items-center justify-between p-4 rounded-xl border bg-card transition-all duration-200",
                                                    product.is_available
                                                        ? "border-border hover:border-primary/30"
                                                        : "border-red-500/20 bg-red-500/5 opacity-60"
                                                )}
                                            >
                                                {/* Delete Button (Circular X) */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteProduct(product.id);
                                                    }}
                                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center shadow-lg transition-opacity hover:bg-red-600 z-10"
                                                    title="Remover Produto"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>

                                                <div>
                                                    <p className={cn(
                                                        "font-medium",
                                                        !product.is_available && "line-through text-muted-foreground"
                                                    )}>
                                                        {product.name}
                                                    </p>
                                                    <p className="font-mono text-lg font-bold text-primary">
                                                        R$ {product.price.toFixed(2)}
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={() => toggleAvailability(product.id, product.is_available)}
                                                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                                                >
                                                    {product.is_available ? (
                                                        <ToggleRight className="h-8 w-8 text-emerald-500" />
                                                    ) : (
                                                        <ToggleLeft className="h-8 w-8 text-muted-foreground" />
                                                    )}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* New Product Dialog */}
            <Dialog open={isNewProductOpen} onOpenChange={setIsNewProductOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Novo Produto</DialogTitle>
                        <DialogDescription>
                            Adicione um item ao seu cardápio.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nome</label>
                            <Input
                                placeholder="Ex: X-Burger"
                                value={newProductName}
                                onChange={e => setNewProductName(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Preço (R$)</label>
                                <Input
                                    placeholder="0,00"
                                    type="number"
                                    step="0.01"
                                    value={newProductPrice}
                                    onChange={e => setNewProductPrice(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Categoria</label>
                                <Input
                                    placeholder="Ex: Lanches"
                                    value={newProductCategory}
                                    onChange={e => setNewProductCategory(e.target.value)}
                                    list="categories-list"
                                />
                                <datalist id="categories-list">
                                    {categories.map(c => <option key={c} value={c} />)}
                                </datalist>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleAddProduct} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Salvar Produto
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
