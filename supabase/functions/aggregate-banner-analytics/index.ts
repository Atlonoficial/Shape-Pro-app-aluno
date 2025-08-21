import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting banner analytics aggregation...');

    // Get target date (yesterday by default, or from request body)
    const { date: targetDate } = await req.json().catch(() => ({}));
    const aggregationDate = targetDate || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    console.log(`Aggregating data for date: ${aggregationDate}`);

    // Query banner interactions for the target date
    const { data: interactions, error: interactionsError } = await supabaseClient
      .from('banner_interactions')
      .select('*')
      .gte('created_at', `${aggregationDate}T00:00:00.000Z`)
      .lt('created_at', `${aggregationDate}T23:59:59.999Z`);

    if (interactionsError) {
      console.error('Error fetching interactions:', interactionsError);
      throw interactionsError;
    }

    console.log(`Found ${interactions?.length || 0} interactions for ${aggregationDate}`);

    if (!interactions || interactions.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No interactions found for the specified date',
          date: aggregationDate,
          processed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Group interactions by banner_id and user_id
    const aggregationMap = new Map();
    
    for (const interaction of interactions) {
      const key = `${interaction.banner_id}-${interaction.user_id}`;
      
      if (!aggregationMap.has(key)) {
        aggregationMap.set(key, {
          banner_id: interaction.banner_id,
          user_id: interaction.user_id,
          date: aggregationDate,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          expansions: 0,
          navigations: 0,
          total_view_duration: 0,
          session_count: new Set()
        });
      }
      
      const agg = aggregationMap.get(key);
      
      // Count interactions by type
      switch (interaction.interaction_type) {
        case 'view':
          agg.impressions++;
          // Sum view duration from metadata
          if (interaction.metadata?.view_duration) {
            agg.total_view_duration += interaction.metadata.view_duration;
          }
          break;
        case 'click':
          agg.clicks++;
          break;
        case 'conversion':
          agg.conversions++;
          break;
        case 'expand':
          agg.expansions++;
          break;
        case 'navigate':
          agg.navigations++;
          break;
      }
      
      // Track unique sessions
      if (interaction.session_id) {
        agg.session_count.add(interaction.session_id);
      }
    }

    // Prepare aggregated records for insertion
    const aggregatedRecords = Array.from(aggregationMap.values()).map(agg => ({
      banner_id: agg.banner_id,
      user_id: agg.user_id,
      date: agg.date,
      impressions: agg.impressions,
      clicks: agg.clicks,
      conversions: agg.conversions,
      // Store additional metrics in metadata
      metadata: {
        expansions: agg.expansions,
        navigations: agg.navigations,
        total_view_duration: agg.total_view_duration,
        average_view_duration: agg.impressions > 0 ? Math.round(agg.total_view_duration / agg.impressions) : 0,
        unique_sessions: agg.session_count.size,
        ctr: agg.impressions > 0 ? Number((agg.clicks / agg.impressions * 100).toFixed(2)) : 0,
        conversion_rate: agg.clicks > 0 ? Number((agg.conversions / agg.clicks * 100).toFixed(2)) : 0
      }
    }));

    console.log(`Prepared ${aggregatedRecords.length} aggregated records`);

    // Delete existing aggregations for the date (to avoid duplicates on re-run)
    const { error: deleteError } = await supabaseClient
      .from('banner_analytics')
      .delete()
      .eq('date', aggregationDate);

    if (deleteError) {
      console.error('Error deleting existing aggregations:', deleteError);
    }

    // Insert new aggregated data
    const { error: insertError } = await supabaseClient
      .from('banner_analytics')
      .insert(aggregatedRecords);

    if (insertError) {
      console.error('Error inserting aggregations:', insertError);
      throw insertError;
    }

    console.log(`Successfully aggregated banner analytics for ${aggregationDate}`);

    return new Response(
      JSON.stringify({
        message: 'Banner analytics aggregated successfully',
        date: aggregationDate,
        processed: aggregatedRecords.length,
        total_interactions: interactions.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in aggregate-banner-analytics function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to aggregate banner analytics'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});