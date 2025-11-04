# 📐 Especificação de Capas de Planos de Treino

## Dimensões Recomendadas

### 🎯 Formato Principal (16:9) - **RECOMENDADO**
- **Dimensões:** `800x450px`
- **Proporção:** 16:9 (widescreen)
- **Tamanho máximo:** < 100KB
- **Formato:** JPG (qualidade 80-85%)
- **Uso ideal:** Capas de treinos, fotos de exercícios em ação

**Por que 16:9?**
- Proporção nativa de smartphones modernos
- Preenche a tela sem cortes
- Ideal para fotos horizontais de academias e treinos

---

### 📱 Formato Alternativo (3:2)
- **Dimensões:** `600x400px`
- **Proporção:** 3:2
- **Tamanho máximo:** < 80KB
- **Formato:** JPG (qualidade 80-85%)
- **Uso ideal:** Fotos tipo portrait, comparações antes/depois

---

## 🎨 Diretrizes de Design

### ✅ Boas Práticas
- **Contraste:** Use imagens com boa iluminação e contraste
- **Foco central:** Elemento principal no centro (regra dos terços)
- **Texto legível:** Se adicionar texto, use fontes grandes (mínimo 48px) e com sombra
- **Cores vibrantes:** Evite imagens muito escuras ou desbotadas
- **Espaço para título:** Deixe área superior/inferior livre para overlay de texto

### ❌ Evitar
- Imagens borradas ou com baixa resolução
- Excesso de texto na imagem
- Fotos muito escuras (dificultam leitura de títulos)
- Arquivos PNG (muito pesados para mobile)
- Tamanhos superiores a 150KB (degradam performance)

---

## 💻 Exemplo de Implementação

### Upload e Validação
```typescript
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const handleCoverUpload = async (file: File) => {
  // ✅ Validar tamanho
  const maxSize = 100 * 1024; // 100KB
  if (file.size > maxSize) {
    toast.error('Imagem muito grande', {
      description: `Tamanho máximo: 100KB. Sua imagem: ${(file.size / 1024).toFixed(1)}KB`
    });
    return;
  }
  
  // ✅ Validar tipo
  if (!['image/jpeg', 'image/jpg'].includes(file.type)) {
    toast.error('Formato inválido', {
      description: 'Use arquivos JPG para melhor performance'
    });
    return;
  }
  
  // ✅ Upload para Supabase Storage
  const fileName = `cover-${Date.now()}.jpg`;
  const { data, error } = await supabase.storage
    .from('workout-covers')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    toast.error('Erro ao fazer upload');
    return;
  }
  
  // ✅ Obter URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('workout-covers')
    .getPublicUrl(fileName);
  
  toast.success('Capa enviada com sucesso! 🎉');
  return publicUrl;
};
```

### Exibição Responsiva
```tsx
<div className="relative w-full aspect-video overflow-hidden rounded-lg">
  <img 
    src={coverUrl} 
    alt="Capa do treino"
    className="w-full h-full object-cover"
    loading="lazy"
  />
  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
  <h2 className="absolute bottom-4 left-4 text-white text-2xl font-bold">
    Treino Full Body
  </h2>
</div>
```

---

## 🔧 Otimização Automática

O Supabase Storage pode ser configurado para redimensionar automaticamente:

```sql
-- Exemplo de transformação na URL
https://seu-projeto.supabase.co/storage/v1/render/image/public/workout-covers/cover.jpg?width=800&height=450&quality=85
```

---

## 📊 Comparação de Tamanhos

| Dimensão | Proporção | Tamanho (JPG 85%) | Uso |
|----------|-----------|-------------------|-----|
| 800x450px | 16:9 | ~70-100KB | ✅ **Recomendado** |
| 600x400px | 3:2 | ~50-80KB | Alternativa compacta |
| 1200x675px | 16:9 | ~150-200KB | ❌ Muito pesado |
| 400x300px | 4:3 | ~30KB | ❌ Baixa qualidade |

---

## 🎯 Resumo Rápido

**Para 95% dos casos, use:**
- **800x450px (16:9)**
- **JPG com qualidade 80-85%**
- **< 100KB**

Isso garante:
- ✅ Carregamento rápido em 3G/4G
- ✅ Visual profissional em qualquer celular
- ✅ Baixo consumo de dados do usuário
- ✅ Compatibilidade universal

---

**Última atualização:** BUILD 54  
**Responsável:** Shape Pro Dev Team
