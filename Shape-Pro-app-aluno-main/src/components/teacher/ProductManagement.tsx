import { useState, useEffect } from "react";
import { Plus, Edit, Package, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RewardItem {
  id: string;
  title: string;
  description?: string;
  points_cost: number;
  image_url?: string;
  stock?: number;
  is_active: boolean;
  created_at: string;
}

export const ProductManagement = () => {
  const [products, setProducts] = useState<RewardItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<RewardItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points_cost: 0,
    stock: 0,
    is_active: true
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  const fetchProducts = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('rewards_items')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return;
    }

    setProducts(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingProduct) {
        // Update product
        const { error } = await supabase
          .from('rewards_items')
          .update(formData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast({ title: "Produto atualizado com sucesso!" });
      } else {
        // Create product
        const { error } = await supabase
          .from('rewards_items')
          .insert({
            ...formData,
            created_by: user.id
          });

        if (error) throw error;
        toast({ title: "Produto criado com sucesso!" });
      }

      setIsDialogOpen(false);
      setEditingProduct(null);
      setFormData({
        title: '',
        description: '',
        points_cost: 0,
        stock: 0,
        is_active: true
      });
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({ 
        title: "Erro ao salvar produto",
        description: "Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const toggleActive = async (product: RewardItem) => {
    const { error } = await supabase
      .from('rewards_items')
      .update({ is_active: !product.is_active })
      .eq('id', product.id);

    if (error) {
      console.error('Error toggling product:', error);
      toast({ 
        title: "Erro ao atualizar produto",
        variant: "destructive"
      });
      return;
    }

    toast({ 
      title: `Produto ${!product.is_active ? 'ativado' : 'desativado'} com sucesso!`
    });
    fetchProducts();
  };

  const openEditDialog = (product: RewardItem) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description || '',
      points_cost: product.points_cost,
      stock: product.stock || 0,
      is_active: product.is_active
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Loja de Produtos</h3>
          <p className="text-sm text-muted-foreground">Gerencie produtos e recompensas</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingProduct(null);
              setFormData({
                title: '',
                description: '',
                points_cost: 0,
                stock: 0,
                is_active: true
              });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Editar Produto' : 'Criar Novo Produto'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Nome do Produto</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="points_cost">Custo em Pontos</Label>
                <Input
                  id="points_cost"
                  type="number"
                  value={formData.points_cost}
                  onChange={(e) => setFormData({...formData, points_cost: parseInt(e.target.value) || 0})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="stock">Estoque (0 = ilimitado)</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                />
                <Label htmlFor="is_active">Produto ativo</Label>
              </div>
              <Button type="submit" className="w-full">
                {editingProduct ? 'Atualizar' : 'Criar'} Produto
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Products List */}
      <div className="grid gap-4">
        {products.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-semibold mb-2">Nenhum produto criado</h4>
              <p className="text-muted-foreground mb-4">Crie seu primeiro produto para a loja</p>
            </CardContent>
          </Card>
        ) : (
          products.map((product) => (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{product.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {product.description || 'Sem descrição'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={product.is_active ? "default" : "secondary"}>
                      {product.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">{product.points_cost} pontos</span>
                    {product.stock !== null && product.stock > 0 && (
                      <span className="ml-2">• Estoque: {product.stock}</span>
                    )}
                    {product.stock === 0 && (
                      <span className="ml-2 text-red-500">• Sem estoque</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog(product)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleActive(product)}
                    >
                      <Package className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};