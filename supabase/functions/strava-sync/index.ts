import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Buscar conexão ativa do Strava
    const { data: connection, error: connectionError } = await supabase
      .from('wearable_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'strava')
      .eq('is_active', true)
      .single();

    if (connectionError || !connection) {
      throw new Error('No active Strava connection found');
    }

    let accessToken = connection.access_token;

    // Verificar se o token precisa ser renovado
    if (connection.token_expires_at && new Date(connection.token_expires_at) <= new Date()) {
      const clientId = Deno.env.get('STRAVA_CLIENT_ID');
      const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET');

      const refreshResponse = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: connection.refresh_token,
          grant_type: 'refresh_token'
        })
      });

      const refreshData = await refreshResponse.json();
      
      if (refreshResponse.ok) {
        accessToken = refreshData.access_token;
        
        // Atualizar tokens no banco
        await supabase
          .from('wearable_connections')
          .update({
            access_token: refreshData.access_token,
            refresh_token: refreshData.refresh_token,
            token_expires_at: new Date(refreshData.expires_at * 1000).toISOString()
          })
          .eq('id', connection.id);
      }
    }

    // Sincronizar atividades dos últimos 30 dias
    const since = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
    
    const activitiesResponse = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?after=${since}&per_page=50`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );

    if (!activitiesResponse.ok) {
      throw new Error('Failed to fetch Strava activities');
    }

    const activities = await activitiesResponse.json();
    
    // Inserir atividades no banco (evitando duplicatas)
    const workoutActivities = activities.map((activity: any) => ({
      user_id: user.id,
      connection_id: connection.id,
      provider_activity_id: activity.id.toString(),
      activity_type: activity.type,
      name: activity.name,
      description: activity.description,
      distance_meters: activity.distance,
      duration_seconds: activity.moving_time,
      calories_burned: activity.calories,
      avg_heart_rate: activity.average_heartrate,
      max_heart_rate: activity.max_heartrate,
      elevation_gain: activity.total_elevation_gain,
      started_at: activity.start_date,
      metadata: {
        kudos_count: activity.kudos_count,
        achievement_count: activity.achievement_count,
        map_polyline: activity.map?.summary_polyline
      }
    }));

    if (workoutActivities.length > 0) {
      const { error: insertError } = await supabase
        .from('workout_activities')
        .upsert(workoutActivities, {
          onConflict: 'connection_id,provider_activity_id',
          ignoreDuplicates: true
        });

      if (insertError) {
        console.error('Error inserting activities:', insertError);
      }
    }

    // Sincronizar métricas de hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const statsResponse = await fetch(
      `https://www.strava.com/api/v3/athletes/${connection.provider_user_id}/stats`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );

    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      
      const healthMetrics = [
        {
          user_id: user.id,
          connection_id: connection.id,
          metric_type: 'distance',
          value: stats.recent_run_totals?.distance || 0,
          unit: 'meters',
          recorded_at: today.toISOString()
        },
        {
          user_id: user.id,
          connection_id: connection.id,
          metric_type: 'calories',
          value: activities.reduce((sum: number, a: any) => sum + (a.calories || 0), 0),
          unit: 'kcal',
          recorded_at: today.toISOString()
        }
      ];

      await supabase
        .from('health_metrics')
        .upsert(healthMetrics, {
          onConflict: 'user_id,connection_id,metric_type,recorded_at'
        });
    }

    // Atualizar timestamp da última sincronização
    await supabase
      .from('wearable_connections')
      .update({
        last_sync_at: new Date().toISOString(),
        sync_error: null
      })
      .eq('id', connection.id);

    return new Response(JSON.stringify({ 
      success: true,
      synced_activities: activities.length,
      last_sync: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Strava sync error:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});