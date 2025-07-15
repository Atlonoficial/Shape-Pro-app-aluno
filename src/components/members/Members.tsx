import { useState } from "react";
import { Play, ShoppingCart, Package, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const membershipData = {
  title: "Seca Barriga - Woman",
  modules: [
    {
      id: 1,
      title: "Dieta Inteligente",
      subtitle: "Módulo 2",
      image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=400",
      type: "course"
    },
    {
      id: 2,
      title: "Metabolismo Feminino", 
      subtitle: "Módulo 1",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=400",
      type: "course"
    },
    {
      id: 3,
      title: "Metabolismo Energético",
      subtitle: "Módulo 3",
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&q=80&w=400",
      type: "course"
    },
    {
      id: 4,
      title: "Dieta Detox",
      subtitle: "Módulo 4", 
      image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=400",
      type: "course"
    }
  ]
};

const products = [
  {
    id: 1,
    name: "Pré-Treino Energy",
    description: "Energia explosiva para seus treinos",
    price: 69.9,
    image: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: 2,
    name: "BCAA 2:1:1",
    description: "Aminoácidos essenciais para recuperação",
    price: 39.9,
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: 3,
    name: "Creatina Monohidratada",
    description: "Aumento de força e performance",
    price: 49.9,
    image: "https://images.unsplash.com/photo-1583311624887-932baf98b64b?auto=format&fit=crop&q=80&w=400"
  }
];

export const Members = () => {
  const [activeTab, setActiveTab] = useState<'courses' | 'products'>('courses');

  return (
    <div className="p-4 pt-8 pb-24">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Bem-vindo,</h1>
        <h2 className="text-xl text-foreground mb-4">Área de membros!</h2>
        
        <Button className="btn-accent w-32 h-12 mb-6">
          <Play className="w-4 h-4 mr-2" />
          Assistir
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <Button
          onClick={() => setActiveTab('courses')}
          className={`flex-1 h-12 rounded-xl font-medium transition-all duration-300 ${
            activeTab === 'courses' 
              ? 'btn-accent' 
              : 'btn-secondary'
          }`}
        >
          <Package className="w-4 h-4 mr-2" />
          Cursos
        </Button>
        
        <Button
          onClick={() => setActiveTab('products')}
          className={`flex-1 h-12 rounded-xl font-medium transition-all duration-300 ${
            activeTab === 'products' 
              ? 'btn-accent' 
              : 'btn-secondary'
          }`}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Produtos
        </Button>
      </div>

      {/* Content */}
      {activeTab === 'courses' && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">{membershipData.title}</h3>
          
          <div className="grid grid-cols-2 gap-4">
            {membershipData.modules.map((module) => (
              <div 
                key={module.id}
                className="relative card-gradient overflow-hidden hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                <div 
                  className="aspect-square bg-cover bg-center relative"
                  style={{ backgroundImage: `url(${module.image})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <h4 className="text-sm font-semibold text-white mb-1">{module.title}</h4>
                    <p className="text-xs text-white/70">{module.subtitle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Produtos Físicos</h3>
          
          <div className="space-y-4">
            {products.map((product) => (
              <div 
                key={product.id}
                className="card-gradient p-4 hover:scale-105 transition-all duration-300"
              >
                <div className="flex gap-4">
                  <div 
                    className="w-16 h-16 bg-cover bg-center rounded-lg"
                    style={{ backgroundImage: `url(${product.image})` }}
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">{product.name}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
                    <p className="text-lg font-bold text-accent">R$ {product.price.toFixed(2).replace('.', ',')}</p>
                  </div>
                  <Button 
                    size="sm"
                    className="self-end btn-accent h-9 px-4"
                  >
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    Comprar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};