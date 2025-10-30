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
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 max-w-7xl mx-auto">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-2 sm:p-3 lg:p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:bg-card/80 flex flex-col h-full"
            >
              {/* Product Image */}
              <div className="mb-2 sm:mb-3 rounded-xl overflow-hidden bg-muted/30 aspect-[4/3] sm:aspect-square flex-shrink-0">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={`Imagem do produto ${product.name}`}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted/80">
                    <Package className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground/60" />
                  </div>
                )}
              </div>
              
              {/* Product Content */}
              <div className="flex-1 flex flex-col space-y-2 sm:space-y-3">
                <div className="flex-1">
                  <h4 className="text-xs sm:text-sm font-semibold text-foreground leading-tight line-clamp-2 mb-1.5">
                    {product.name}
                  </h4>
                  
                  {product.description && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground leading-snug line-clamp-2 mb-1.5">
                      {product.description}
                    </p>
                  )}
                  
                  {product.category && (
                    <span className="inline-block text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                      {product.category}
                    </span>
                  )}
                </div>
                
                {/* Price, Stock and Button Section */}
                <div className="space-y-2 mt-auto pt-2 border-t border-border/30">
                  {/* Price and Stock Row */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-base font-bold text-foreground">
                      R$ {product.price.toFixed(2)}
                    </span>
                    
                    {product.stock !== null && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        product.stock > 0 
                          ? 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30' 
                          : 'text-destructive bg-destructive/10'
                      }`}>
                        {product.stock > 0 ? `${product.stock} unid.` : 'Esgotado'}
                      </span>
                    )}
                  </div>
                  
                  {/* Action Button Row */}
                  {!isTeacher && (
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full min-h-[36px] text-xs sm:text-sm font-medium transition-all duration-300 hover:shadow-md disabled:opacity-50"
                      disabled={product.stock !== null && product.stock === 0}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {product.stock !== null && product.stock === 0 ? 'Esgotado' : 'Comprar'}
                    </Button>
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