import { useState } from "react";
import { Package, Loader2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export const ProductsShop = () => {
  const { userProfile } = useAuth();
  const { products, loading } = useProducts();
  const navigate = useNavigate();

  const isTeacher = userProfile?.user_type === 'teacher';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-muted-foreground">Carregando loja...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-4">
        {isTeacher ? 'Meus Produtos' : 'Loja de Produtos'}
      </h3>

      {products.length === 0 ? (
        <div className="text-center py-8">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {isTeacher 
              ? 'Você ainda não criou nenhum produto. Acesse o Dashboard Professor para criar.' 
              : 'Nenhum produto disponível no momento'
            }
          </p>
          {isTeacher && (
            <Button 
              onClick={() => navigate('/dashboard-professor')} 
              className="mt-4"
              variant="outline"
            >
              Ir para Dashboard
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-3 transition-all duration-300"
            >
              {/* Product Image */}
              {product.image_url && (
                <div className="mb-3 rounded-xl overflow-hidden bg-muted/30 aspect-square">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
              
              {/* Product Content */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground leading-tight">
                  {product.name}
                </h4>
                
                {product.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                )}
                
                {product.category && (
                  <span className="inline-block text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {product.category}
                  </span>
                )}
                
                {/* Price and Button */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-bold text-foreground">
                    R$ {product.price.toFixed(2)}
                  </span>
                  
                  {!isTeacher && (
                    <Button
                      variant="default"
                      size="sm"
                      className="text-xs px-2 py-1 h-auto"
                    >
                      <ShoppingCart className="w-3 h-3 mr-1" />
                      Comprar
                    </Button>
                  )}
                  
                  {product.stock !== null && (
                    <span className="text-xs text-muted-foreground">
                      {product.stock > 0 ? `${product.stock} unid.` : 'Esgotado'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};