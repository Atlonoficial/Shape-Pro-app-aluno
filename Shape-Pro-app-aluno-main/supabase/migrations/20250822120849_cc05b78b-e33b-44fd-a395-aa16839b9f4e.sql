-- Atualizar função de agregação para os novos tipos de interação
CREATE OR REPLACE FUNCTION public.aggregate_banner_metrics_simple(p_banner_id uuid, p_date date DEFAULT CURRENT_DATE)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  total_views INT := 0;
  total_clicks INT := 0;
  unique_users INT := 0;
BEGIN
  -- Count metrics for the banner on the specific date
  SELECT 
    COUNT(*) FILTER (WHERE interaction_type = 'view'),
    COUNT(*) FILTER (WHERE interaction_type = 'click'),
    COUNT(DISTINCT user_id)
  INTO total_views, total_clicks, unique_users
  FROM public.banner_interactions 
  WHERE banner_id = p_banner_id 
    AND DATE(created_at) = p_date;

  -- Insert or update analytics record
  INSERT INTO public.banner_analytics (
    banner_id, 
    user_id, 
    date, 
    impressions, 
    clicks, 
    conversions
  ) VALUES (
    p_banner_id, 
    (SELECT created_by FROM banners WHERE id = p_banner_id LIMIT 1), 
    p_date, 
    total_views,  -- views como impressions
    total_clicks,  -- clicks como clicks
    0  -- sem conversions no modelo simplificado
  )
  ON CONFLICT (banner_id, user_id, date) 
  DO UPDATE SET
    impressions = EXCLUDED.impressions,
    clicks = EXCLUDED.clicks,
    conversions = EXCLUDED.conversions,
    updated_at = now();
END;
$function$;

-- Atualizar trigger para os novos tipos
CREATE OR REPLACE FUNCTION public.trigger_aggregate_simple_banner_metrics()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Agregar métricas apenas para view e click
  IF NEW.interaction_type IN ('view', 'click') THEN
    PERFORM public.aggregate_banner_metrics_simple(NEW.banner_id, DATE(NEW.created_at));
  END IF;
  RETURN NEW;
END;
$function$;