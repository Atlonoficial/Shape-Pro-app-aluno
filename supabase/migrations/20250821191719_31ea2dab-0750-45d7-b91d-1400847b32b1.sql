-- Atualizar função de agregação para processar apenas detail_view e redirect_click
CREATE OR REPLACE FUNCTION public.aggregate_banner_metrics_simple(p_banner_id uuid, p_date date DEFAULT CURRENT_DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  total_detail_views INT := 0;
  total_redirect_clicks INT := 0;
  unique_users INT := 0;
  ctr_value NUMERIC := 0;
BEGIN
  -- Count metrics for the banner on the specific date
  SELECT 
    COUNT(*) FILTER (WHERE interaction_type = 'detail_view'),
    COUNT(*) FILTER (WHERE interaction_type = 'redirect_click'),
    COUNT(DISTINCT user_id)
  INTO total_detail_views, total_redirect_clicks, unique_users
  FROM public.banner_interactions 
  WHERE banner_id = p_banner_id 
    AND DATE(created_at) = p_date;

  -- Calculate CTR (redirect_clicks / detail_views * 100)
  IF total_detail_views > 0 THEN
    ctr_value := ROUND((total_redirect_clicks::numeric / total_detail_views) * 100, 2);
  ELSE
    ctr_value := 0;
  END IF;

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
    total_detail_views,  -- detail_views como impressions
    total_redirect_clicks,  -- redirect_clicks como clicks
    0  -- sem conversions no modelo simplificado
  )
  ON CONFLICT (banner_id, user_id, date) 
  DO UPDATE SET
    impressions = EXCLUDED.impressions,
    clicks = EXCLUDED.clicks,
    conversions = EXCLUDED.conversions,
    updated_at = now();
END;
$$;

-- Atualizar trigger para usar a função simplificada
CREATE OR REPLACE FUNCTION public.trigger_aggregate_simple_banner_metrics()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Agregar métricas apenas para detail_view e redirect_click
  IF NEW.interaction_type IN ('detail_view', 'redirect_click') THEN
    PERFORM public.aggregate_banner_metrics_simple(NEW.banner_id, DATE(NEW.created_at));
  END IF;
  RETURN NEW;
END;
$$;