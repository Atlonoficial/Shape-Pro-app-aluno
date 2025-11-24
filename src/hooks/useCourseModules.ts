import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface CourseLesson {
    id: string;
    module_id: string;
    title: string;
    description?: string;
    video_url?: string;
    video_duration_minutes: number;
    content?: string;
    order_index: number;
    is_free: boolean;
    is_published: boolean;
}

export interface CourseModule {
    id: string;
    course_id: string;
    title: string;
    description?: string;
    order_index: number;
    is_published: boolean;
    release_mode: 'immediate' | 'days_after_enrollment';
    release_after_days?: number;
    cover_image_url?: string;
    created_at: string;
    updated_at: string;
    lessons?: CourseLesson[];
}

import { getCache, setCache } from '@/lib/cache';

export const useCourseModules = (courseId: string | null) => {
    const [modules, setModules] = useState<CourseModule[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (!courseId) {
            setModules([]);
            return;
        }

        const fetchModules = async () => {
            const cacheKey = `modules_${courseId}`;
            const cachedData = getCache(cacheKey);

            if (cachedData) {
                console.log('useCourseModules: ⚡ Usando cache');
                setModules(cachedData);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                console.log('useCourseModules: 🔍 Buscando módulos e aulas para curso:', courseId);

                // Use !inner to only return modules that have published lessons (or use left join and filter client side if we want empty modules)
                // For now, we keep client side filtering to ensure we see modules even if they have no lessons (if that's desired), 
                // but to optimize we can use !inner if we want to hide empty modules.
                // Let's stick to the robust client-side filtering for now but cache the result.

                const { data, error } = await supabase
                    .from('course_modules')
                    .select(`
                        *,
                        course_lessons (
                            *
                        )
                    `)
                    .eq('course_id', courseId)
                    .eq('is_published', true)
                    .order('order_index', { ascending: true });

                if (error) throw error;

                // Sort lessons by order_index and filter published
                const modulesWithLessons = (data || []).map((module: any) => ({
                    ...module,
                    lessons: (module.course_lessons || [])
                        .filter((l: any) => l.is_published === true) // Ensure only published lessons are shown to students
                        .sort((a: any, b: any) => a.order_index - b.order_index)
                }));

                console.log('useCourseModules: ✅ Módulos carregados:', modulesWithLessons.length);
                setModules(modulesWithLessons as CourseModule[]);
                setCache(cacheKey, modulesWithLessons);
            } catch (err) {
                console.error('Erro ao carregar módulos:', err);
                setError('Erro ao carregar módulos');
                toast({
                    title: "Erro",
                    description: "Não foi possível carregar os módulos do curso",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchModules();
    }, [courseId]);

    return {
        modules,
        loading,
        error
    };
};
