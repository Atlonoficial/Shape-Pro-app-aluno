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
        // If user is teacher, show products they created
        // If user is student, show products from their teacher
        if (userProfile?.user_type === 'teacher') {
          const { data, error } = await supabase
            .from('products' as any)
            .select('*')
            .eq('instructor_id', user.id)
            .eq('is_published', true)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error fetching teacher products:', error);
            return;
          }

          setProducts((data as unknown as Product[]) || []);
        } else {
          // For students, get products from their teacher
          const { data: studentData, error: studentError } = await supabase
            .from('students' as any)
            .select('teacher_id')
            .eq('user_id', user.id)
            .single();

          if (studentError) {
            console.error('Error fetching student data:', studentError);
            setProducts([]);
            setLoading(false);
            return;
          }

          if ((studentData as any)?.teacher_id) {
            const { data, error } = await supabase
              .from('products' as any)
              .select('*')
              .eq('instructor_id', (studentData as any).teacher_id)
              .eq('is_published', true)
              .order('created_at', { ascending: false });

            if (error) {
              console.error('Error fetching student products:', error);
              return;
            }

            setProducts((data as unknown as Product[]) || []);
          } else {
            // If student has no teacher, show no products
            setProducts([]);
          }
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [user, userProfile]);

  return { products, loading };
};