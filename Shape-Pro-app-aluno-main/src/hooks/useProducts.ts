import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  is_digital: boolean;
  stock?: number;
  category?: string;
  image_url?: string;
  files?: any[];
  is_published: boolean;
  is_public: boolean;
  instructor_id: string;
  created_at: string;
  updated_at: string;
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userProfile } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchProducts = async () => {
      try {
        console.log('[useProducts] 🔍 Iniciando busca de produtos para:', userProfile?.user_type);

        // ✅ PROFESSORES: Ver apenas seus produtos
        if (userProfile?.user_type === 'teacher') {
          const { data, error } = await supabase
            .from('products' as any)
            .select('*')
            .eq('instructor_id', user.id)
            .eq('is_published', true)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('[useProducts] ❌ Erro ao buscar produtos do professor:', error);
            return;
          }

          console.log('[useProducts] 👨‍🏫 Produtos do professor:', data?.length);
          setProducts((data as unknown as Product[]) || []);
          
        } else {
          // ✅ ALUNOS: Buscar produtos do professor + produtos públicos
          console.log('[useProducts] 👨‍🎓 Buscando produtos para aluno...');
          
          // 1️⃣ Verificar se aluno tem professor
          const { data: studentData, error: studentError } = await supabase
            .from('students')
            .select('teacher_id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (studentError) {
            console.error('[useProducts] ⚠️ Erro ao buscar dados do aluno:', studentError);
          }

          const teacherId = studentData?.teacher_id as string | undefined;

          console.log('[useProducts] 📋 Dados do aluno:', { 
            hasTeacher: !!teacherId,
            teacherId: teacherId 
          });

          let allProducts: Product[] = [];

          // 2️⃣ Se tem professor, buscar produtos dele (públicos e privados)
          if (teacherId) {
            const { data: teacherProducts, error: teacherError } = await supabase
              .from('products' as any)
              .select('*')
              .eq('instructor_id', teacherId)
              .eq('is_published', true)
              .order('created_at', { ascending: false });

            if (teacherError) {
              console.error('[useProducts] ❌ Erro ao buscar produtos do professor:', teacherError);
            } else {
              console.log('[useProducts] 👨‍🏫 Produtos do professor:', teacherProducts?.length);
              allProducts = [...(teacherProducts as unknown as Product[]) || []];
            }
          }

          // 3️⃣ ✅ BUILD 39: Buscar TODOS os produtos públicos de OUTROS professores
          const { data: publicProducts, error: publicError } = await supabase
            .from('products' as any)
            .select('*')
            .eq('is_published', true)
            .eq('is_public', true)
            .neq('instructor_id', teacherId || '00000000-0000-0000-0000-000000000000')
            .order('created_at', { ascending: false });

          if (publicError) {
            console.error('[useProducts] ❌ Erro ao buscar produtos públicos:', publicError);
          } else {
            console.log('[useProducts] 🌍 Produtos públicos de outros professores:', publicProducts?.length);
            allProducts = [...allProducts, ...(publicProducts as unknown as Product[]) || []];
          }

          // 4️⃣ Buscar produtos globais (instructor_id = NULL)
          const { data: globalProducts, error: globalError } = await supabase
            .from('products' as any)
            .select('*')
            .is('instructor_id', null)
            .eq('is_published', true)
            .order('created_at', { ascending: false });

          if (globalError) {
            console.error('[useProducts] ❌ Erro ao buscar produtos globais:', globalError);
          } else {
            console.log('[useProducts] 🌐 Produtos globais:', globalProducts?.length);
            allProducts = [...allProducts, ...(globalProducts as unknown as Product[]) || []];
          }

          // 5️⃣ Remover duplicatas por ID
          const uniqueProducts = Array.from(
            new Map(allProducts.map(p => [p.id, p])).values()
          );

          console.log('[useProducts] ✅ Total de produtos únicos:', uniqueProducts.length);
          setProducts(uniqueProducts);
        }
      } catch (error) {
        console.error('[useProducts] ❌ Erro inesperado:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [user, userProfile]);

  return { products, loading };
};