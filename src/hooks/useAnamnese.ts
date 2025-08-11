
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
      if (!userId) throw new Error("Usuário não autenticado");

      if (record?.id) {
        console.log("[useAnamnese] updating id:", record.id);
        const { data, error } = await supabase
          .from("anamneses")
          .update({ ...input })
          .eq("id", record.id)
          .select()
          .single();

        if (error) throw error;
        setRecord(data as AnamneseRecord);
        return data as AnamneseRecord;
      } else {
        console.log("[useAnamnese] inserting new anamnese for user:", userId);
        const { data, error } = await supabase
          .from("anamneses")
          .insert({ user_id: userId, ...input })
          .select()
          .single();

        if (error) throw error;
        setRecord(data as AnamneseRecord);
        return data as AnamneseRecord;
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
