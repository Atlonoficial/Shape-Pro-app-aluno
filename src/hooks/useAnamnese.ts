
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AnamneseRecord {
  id?: string;
  user_id: string;
  doencas: string[];
  outras_doencas?: string | null;
  alergias: string[];
  outras_alergias?: string | null;
  medicacoes: string[];
  horas_sono?: string | null;
  qualidade_sono?: string | null;
  lesoes?: string | null;
  created_at?: string;
  updated_at?: string;
}

type SaveInput = Omit<AnamneseRecord, "id" | "user_id" | "created_at" | "updated_at">;

export const useAnamnese = (userId?: string) => {
  const [record, setRecord] = useState<AnamneseRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnamnese = useCallback(async () => {
    if (!userId) {
      setRecord(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    console.log("[useAnamnese] fetching for user:", userId);
    const { data, error } = await supabase
      .from("anamneses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[useAnamnese] fetch error:", error);
      setError(error.message);
      setRecord(null);
    } else {
      setRecord(data as AnamneseRecord | null);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchAnamnese();
  }, [fetchAnamnese]);

  const save = useCallback(
    async (input: SaveInput) => {
      console.log("[useAnamnese] save called with:", { userId, input });

      if (!userId) {
        console.error("[useAnamnese] userId is null or undefined");
        throw new Error("Usuário não autenticado - ID do usuário não encontrado");
      }

      // Verificar se o usuário atual está autenticado
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log("[useAnamnese] current user from supabase:", currentUser?.id);

      if (!currentUser) {
        console.error("[useAnamnese] No authenticated user found");
        throw new Error("Sessão expirada - faça login novamente");
      }

      if (currentUser.id !== userId) {
        console.error("[useAnamnese] User ID mismatch:", { currentUser: currentUser.id, userId });
        throw new Error("Erro de autenticação - IDs não coincidem");
      }

      try {
        if (!navigator.onLine) {
          throw new Error("Sem conexão com a internet. Verifique sua rede e tente novamente.");
        }

        if (record?.id) {
          console.log("[useAnamnese] updating existing record:", record.id);
          const { data, error } = await supabase
            .from("anamneses")
            .update({ ...input })
            .eq("id", record.id)
            .select()
            .single();

          if (error) {
            console.error("[useAnamnese] update error:", error);
            throw error;
          }
          console.log("[useAnamnese] update successful:", data);
          setRecord(data as AnamneseRecord);
          return data as AnamneseRecord;
        } else {
          console.log("[useAnamnese] inserting new anamnese for user:", userId);
          const { data, error } = await supabase
            .from("anamneses")
            .insert({ user_id: userId, ...input })
            .select()
            .single();

          if (error) {
            console.error("[useAnamnese] insert error:", error);
            throw error;
          }
          console.log("[useAnamnese] insert successful:", data);
          setRecord(data as AnamneseRecord);
          return data as AnamneseRecord;
        }
      } catch (error: any) {
        console.error("[useAnamnese] save operation failed:", error);

        if (error.message === "Sem conexão com a internet. Verifique sua rede e tente novamente.") {
          throw error;
        }

        if (error.name === 'TypeError' && error.message === 'Load failed') {
          throw new Error("Falha na conexão. Verifique sua internet.");
        }

        if (error.code === 'PGRST116') {
          throw new Error("Erro de permissão - verifique se você está logado");
        } else if (error.message?.includes('row-level security')) {
          throw new Error("Erro de segurança - verifique suas permissões");
        }
        throw error;
      }
    },
    [record?.id, userId]
  );

  return {
    record,
    loading,
    error,
    save,
    refresh: fetchAnamnese,
  };
};
