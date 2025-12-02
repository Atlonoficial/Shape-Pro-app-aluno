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
    enable_support_button?: boolean;
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
            setLoading(true);
            setError(null);

            try {
                console.log('useCourseModules: 🔍 Buscando módulos e aulas para curso:', courseId);
                console.log('useCourseModules: ===== DIAGNÓSTICO DETALHADO (STUDENT APP) =====');

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

                console.log('useCourseModules: Dados brutos retornados:', data);

                // Sort lessons by order_index
                const modulesWithLessons = (data || []).map((module: any) => {
                    const rawLessons = module.course_lessons || [];
                    console.log(`  🔍 Módulo "${module.title}" - Raw Lessons:`, rawLessons.length, rawLessons);

                    return {
                        ...module,
                        lessons: rawLessons
                            // .filter((l: any) => l.is_published === true) // 🔴 DEBUG: Removendo filtro temporariamente
                            .sort((a: any, b: any) => a.order_index - b.order_index)
                    };
                });

                console.log('useCourseModules: ✅ Módulos processados:', modulesWithLessons.length);
                modulesWithLessons.forEach((m: any, i: number) => {
                    console.log(`  Módulo ${i + 1}: "${m.title}" - ${m.lessons?.length || 0} aulas`);
                    m.lessons?.forEach((l: any) => console.log(`    - Aula: "${l.title}"`));
                });

                setModules(modulesWithLessons as CourseModule[]);
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

        // Realtime Subscription for immediate updates
        const channel = supabase
            .channel('course-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'course_lessons'
                },
                (payload) => {
                    console.log('🔔 Realtime update detected in course_lessons:', payload);
                    // Add a small delay to ensure DB propagation
                    setTimeout(() => {
                        console.log('🔄 Refreshing modules after Realtime update...');
                        fetchModules();
                    }, 500);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [courseId]);

    return {
        modules,
        loading,
        error
    };
};
