import { useEffect, useState } from 'react';
import { collection, doc, limit, onSnapshot, orderBy, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Banner {
  id: string;
  teacher_id: string;
  title: string;
  description?: string;
  image_url?: string;
  image?: string; // compat
  cover_url?: string; // compat
  action_label?: string;
  action?: string; // compat
  link_url?: string;
  url?: string; // compat
  status: 'active' | 'inactive' | string;
  start_date?: Timestamp | null;
  end_date?: Timestamp | null;
  updated_at?: Timestamp | null;
}

interface UseBannersReturn {
  banners: Banner[];
  loading: boolean;
  error: string | null;
}

// Busca banners do professor do aluno autenticado (tempo real)
export const useBanners = (studentUserId?: string): UseBannersReturn => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teacherId, setTeacherId] = useState<string | null>(null);

  useEffect(() => {
    if (!studentUserId) {
      setLoading(false);
      return;
    }

    // 1) Descobre teacher_id do estudante
    const studentRef = doc(db, 'students', studentUserId);
    const unsubStudent = onSnapshot(
      studentRef,
      (snap) => {
        if (snap.exists()) {
          const data: any = snap.data();
          setTeacherId(data.teacher_id || null);
        } else {
          setTeacherId(null);
        }
      },
      (err) => {
        console.error('Erro ao buscar student para banners:', err);
        setError('Erro ao carregar dados');
        setLoading(false);
      }
    );

    return () => unsubStudent();
  }, [studentUserId]);

  useEffect(() => {
    if (!teacherId) return;

    // 2) Banners ativos do professor (ordenados por updated_at)
    const q = query(
      collection(db, 'banners'),
      where('teacher_id', '==', teacherId),
      where('status', '==', 'active'),
      orderBy('updated_at', 'desc'),
      limit(10)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const now = Date.now();
        const items: Banner[] = snapshot.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) }))
          // Filtro de janela de campanha no cliente (evita índices extras)
          .filter((b) => {
            const start = (b.start_date as any)?.toMillis?.() ?? 0;
            const end = (b.end_date as any)?.toMillis?.() ?? Number.MAX_SAFE_INTEGER;
            return start <= now && now <= end;
          });
        setBanners(items);
        setLoading(false);
      },
      (err) => {
        console.error('Erro ao buscar banners:', err);
        setError('Erro ao carregar banners');
        setLoading(false);
      }
    );

    return () => unsub();
  }, [teacherId]);

  return { banners, loading, error };
};
