-- Corrigir constraint na tabela banner_interactions para aceitar mais tipos de interação
ALTER TABLE public.banner_interactions 
DROP CONSTRAINT IF EXISTS banner_interactions_interaction_type_check;

-- Adicionar nova constraint com todos os tipos necessários
ALTER TABLE public.banner_interactions 
ADD CONSTRAINT banner_interactions_interaction_type_check 
CHECK (interaction_type IN ('view', 'click', 'expand', 'collapse', 'navigate', 'conversion'));

-- Criar função para agregação automática de métricas mais robusta
CREATE OR REPLACE FUNCTION public.aggregate_daily_banner_metrics(target_date date DEFAULT CURRENT_DATE)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  processed_records int := 0;
  result json;
BEGIN
  -- Limpar dados existentes para o dia específico
  DELETE FROM public.banner_analytics 
  WHERE date = target_date;
  
  -- Inserir métricas agregadas com cálculos avançados
  INSERT INTO public.banner_analytics (
    banner_id, 
    user_id, 
    date, 
    impressions, 
    clicks, 
    conversions,
    metadata
  )
  SELECT 
    bi.banner_id,
    bi.user_id,
    target_date,
    COUNT(*) FILTER (WHERE bi.interaction_type = 'view') as impressions,
    COUNT(*) FILTER (WHERE bi.interaction_type = 'click') as clicks,
    COUNT(*) FILTER (WHERE bi.interaction_type = 'conversion') as conversions,
    jsonb_build_object(
      'expansions', COUNT(*) FILTER (WHERE bi.interaction_type = 'expand'),
      'navigations', COUNT(*) FILTER (WHERE bi.interaction_type = 'navigate'),
      'unique_sessions', COUNT(DISTINCT bi.session_id),
      'ctr', CASE 
        WHEN COUNT(*) FILTER (WHERE bi.interaction_type = 'view') > 0 
        THEN ROUND((COUNT(*) FILTER (WHERE bi.interaction_type = 'click')::numeric / COUNT(*) FILTER (WHERE bi.interaction_type = 'view')) * 100, 2)
        ELSE 0 
      END,
      'conversion_rate', CASE 
        WHEN COUNT(*) FILTER (WHERE bi.interaction_type = 'click') > 0 
        THEN ROUND((COUNT(*) FILTER (WHERE bi.interaction_type = 'conversion')::numeric / COUNT(*) FILTER (WHERE bi.interaction_type = 'click')) * 100, 2)
        ELSE 0 
      END,
      'average_view_duration', AVG(CASE 
        WHEN bi.metadata ? 'view_duration' 
        THEN (bi.metadata->>'view_duration')::numeric 
        ELSE NULL 
      END)
    ) as metadata
  FROM public.banner_interactions bi
  WHERE DATE(bi.created_at) = target_date
  GROUP BY bi.banner_id, bi.user_id;
  
  GET DIAGNOSTICS processed_records = ROW_COUNT;
  
  result := json_build_object(
    'success', true,
    'date', target_date,
    'processed_records', processed_records,
    'message', 'Métricas agregadas com sucesso'
  );
  
  RETURN result;
END;
$$;

-- Criar trigger para agregação automática em tempo real
CREATE OR REPLACE FUNCTION public.trigger_realtime_banner_metrics()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Agregar para o dia da interação
  PERFORM public.aggregate_daily_banner_metrics(DATE(NEW.created_at));
  RETURN NEW;
END;
$$;

-- Aplicar trigger na tabela de interações
DROP TRIGGER IF EXISTS realtime_banner_metrics_trigger ON public.banner_interactions;
CREATE TRIGGER realtime_banner_metrics_trigger
  AFTER INSERT ON public.banner_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_realtime_banner_metrics();