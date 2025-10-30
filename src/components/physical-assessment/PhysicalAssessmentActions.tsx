import { useCallback } from "react";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const usePhysicalAssessmentActions = () => {
  const { user } = useAuthContext();

  const validateAuthentication = useCallback(() => {
    console.log('🔐 Validating authentication...');
    console.log('User from useAuthContext:', user);
    
    if (!user?.id) {
      console.error('❌ User not authenticated or missing ID');
      toast.error("Usuário não autenticado. Faça login novamente.");
      return false;
    }
    
    console.log('✅ User authenticated:', user.id);
    return true;
  }, [user]);

  const testConnection = useCallback(async () => {
    try {
      console.log('🔗 Testing Supabase connection...');
      const { data, error } = await supabase.from('progress').select('id').limit(1);
      
      if (error) {
        console.error('❌ Connection test failed:', error);
        return false;
      }
      
      console.log('✅ Connection test successful');
      return true;
    } catch (err) {
      console.error('❌ Connection test error:', err);
      return false;
    }
  }, []);

  const insertProgressRecords = useCallback(async (progressRecords: any[], retries = 2) => {
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        const { data, error } = await supabase
          .from("progress")
          .insert(progressRecords)
          .select();

        if (error) {
          // RLS errors - specific handling
          if (error.message?.includes('row-level security') || error.message?.includes('policy')) {
            toast.error("Erro de permissão. Verifique se você está logado corretamente.");
            return { success: false, error };
          }

          // If not last attempt, retry
          if (attempt <= retries) {
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            continue;
          }

          throw error;
        }

        return { success: true, data };

      } catch (err) {
        if (attempt <= retries) {
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          continue;
        }
        
        throw err;
      }
    }
  }, []);

  const savePhysicalAssessment = useCallback(async (formData: any) => {
    console.log('🏥 === STARTING PHYSICAL ASSESSMENT SAVE ===');
    console.log('Form data received:', formData);

    // Step 1: Validate authentication
    if (!validateAuthentication()) {
      return false;
    }

    // Step 2: Test connection
    const connectionOk = await testConnection();
    if (!connectionOk) {
      toast.error("Erro de conexão. Verifique sua internet e tente novamente.");
      return false;
    }

    // Step 3: Validate form data
    const hasData = Object.values(formData).some((value: any) => 
      typeof value === 'string' ? value.trim() !== "" : !!value
    );
    
    console.log('Has form data:', hasData);
    
    if (!hasData) {
      toast.error("Preencha pelo menos uma medida");
      return false;
    }

    try {
      const currentDate = new Date();
      const assessmentDate = currentDate.toISOString();
      
      console.log('📅 Assessment date:', assessmentDate);
      
      // Step 4: Build progress records
      const progressRecords = [];

      // Medidas básicas
      if (formData.weight?.trim()) {
        progressRecords.push({
          user_id: user!.id,
          type: "physical_assessment",
          value: parseFloat(formData.weight),
          unit: "kg",
          date: assessmentDate,
          notes: "weight"
        });
      }

      if (formData.height?.trim()) {
        progressRecords.push({
          user_id: user!.id,
          type: "physical_assessment", 
          value: parseFloat(formData.height),
          unit: "cm",
          date: assessmentDate,
          notes: "height"
        });
      }

      if (formData.body_fat?.trim()) {
        progressRecords.push({
          user_id: user!.id,
          type: "physical_assessment",
          value: parseFloat(formData.body_fat),
          unit: "%",
          date: assessmentDate,
          notes: "body_fat"
        });
      }

      if (formData.muscle_mass?.trim()) {
        progressRecords.push({
          user_id: user!.id,
          type: "physical_assessment",
          value: parseFloat(formData.muscle_mass),
          unit: "kg", 
          date: assessmentDate,
          notes: "muscle_mass"
        });
      }

      // Membros superiores
      const upperLimbFields = {
        relaxed_right_arm: "Braço relaxado direito",
        relaxed_left_arm: "Braço relaxado esquerdo", 
        contracted_right_arm: "Braço contraído direito",
        contracted_left_arm: "Braço contraído esquerdo",
        right_forearm: "Antebraço direito",
        left_forearm: "Antebraço esquerdo"
      };

      Object.entries(upperLimbFields).forEach(([key, label]) => {
        const value = formData[key];
        if (value?.trim()) {
          progressRecords.push({
            user_id: user!.id,
            type: "physical_assessment",
            value: parseFloat(value),
            unit: "cm",
            date: assessmentDate,
            notes: label
          });
        }
      });

      // Tronco
      const torsoFields = {
        neck: "Pescoço",
        shoulder: "Ombro",
        chest: "Peitoral", 
        waist: "Cintura",
        abdomen: "Abdômen",
        hip: "Quadril"
      };

      Object.entries(torsoFields).forEach(([key, label]) => {
        const value = formData[key];
        if (value?.trim()) {
          progressRecords.push({
            user_id: user!.id,
            type: "physical_assessment",
            value: parseFloat(value),
            unit: "cm",
            date: assessmentDate,
            notes: label
          });
        }
      });

      // Membros inferiores
      const lowerLimbFields = {
        right_calf: "Panturrilha direita",
        left_calf: "Panturrilha esquerda",
        right_thigh: "Coxa direita", 
        left_thigh: "Coxa esquerda",
        right_proximal_thigh: "Coxa proximal direita",
        left_proximal_thigh: "Coxa proximal esquerda"
      };

      Object.entries(lowerLimbFields).forEach(([key, label]) => {
        const value = formData[key];
        if (value?.trim()) {
          progressRecords.push({
            user_id: user!.id,
            type: "physical_assessment",
            value: parseFloat(value),
            unit: "cm",
            date: assessmentDate,
            notes: label
          });
        }
      });

      // Protocolo de dobras cutâneas
      if (formData.skinfold_protocol?.trim()) {
        progressRecords.push({
          user_id: user!.id,
          type: "physical_assessment",
          value: 1, // Valor simbólico
          unit: "protocolo",
          date: assessmentDate,
          notes: `Protocolo: ${formData.skinfold_protocol}`
        });
      }

      // Dobras cutâneas específicas
      const skinfoldFields = {
        tricipital: "Dobra tricipital",
        bicipital: "Dobra bicipital",
        subescapular: "Dobra subescapular",
        axilar_media: "Dobra axilar média",
        peitoral: "Dobra peitoral",
        abdominal: "Dobra abdominal",
        supra_iliaca: "Dobra supra ilíaca",
        coxa: "Dobra da coxa",
        panturrilha_medial: "Dobra panturrilha medial"
      };

      Object.entries(skinfoldFields).forEach(([key, label]) => {
        const value = formData[key];
        if (value?.trim()) {
          progressRecords.push({
            user_id: user!.id,
            type: "physical_assessment",
            value: parseFloat(value),
            unit: "mm",
            date: assessmentDate,
            notes: label
          });
        }
      });

      console.log(`📊 Built ${progressRecords.length} progress records`);

      if (progressRecords.length === 0) {
        console.warn('⚠️ No valid records to insert');
        toast.error("Nenhuma medida válida encontrada");
        return false;
      }

      // Step 5: Insert records with retry logic
      const result = await insertProgressRecords(progressRecords);
      
      if (!result.success) {
        throw result.error;
      }

      console.log('✅ Physical assessment saved successfully');
      toast.success("Avaliação física registrada com sucesso! 🎯");
      
      return true;

    } catch (error) {
      console.error("❌ Error saving physical assessment:", error);
      
      let errorMessage = "Erro ao registrar avaliação física";
      
      if (error instanceof Error) {
        if (error.message.includes('network')) {
          errorMessage = "Erro de conexão. Verifique sua internet.";
        } else if (error.message.includes('permission') || error.message.includes('policy')) {
          errorMessage = "Erro de permissão. Faça login novamente.";
        } else if (error.message.includes('validation')) {
          errorMessage = "Dados inválidos. Verifique os valores inseridos.";
        }
      }
      
      toast.error(errorMessage);
      return false;
    }
  }, [user, validateAuthentication, testConnection, insertProgressRecords]);

  return {
    savePhysicalAssessment,
    validateAuthentication,
    testConnection
  };
};