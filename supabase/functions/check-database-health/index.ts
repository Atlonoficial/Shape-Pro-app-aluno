import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthAlert {
  level: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  tablename?: string;
  metric_value?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const alerts: HealthAlert[] = [];

    // 1. Verificar dead rows usando a função criada na migration
    const { data: deadRows, error: deadRowsError } = await supabase
      .rpc('check_dead_rows');

    if (deadRowsError) {
      console.error('❌ Erro ao verificar dead rows:', deadRowsError);
      alerts.push({
        level: 'warning',
        category: 'monitoring',
        message: 'Não foi possível verificar dead rows no banco de dados'
      });
    } else {
      deadRows?.forEach((row: any) => {
        const deadRatio = parseFloat(row.dead_ratio) || 0;
        
        if (deadRatio > 20) {
          alerts.push({
            level: 'critical',
            category: 'dead_rows',
            message: `Tabela ${row.tablename} com ${deadRatio}% dead rows (${row.dead_rows} linhas). Execute VACUUM FULL.`,
            tablename: row.tablename,
            metric_value: deadRatio
          });
        } else if (deadRatio > 10) {
          alerts.push({
            level: 'warning',
            category: 'dead_rows',
            message: `Tabela ${row.tablename} com ${deadRatio}% dead rows (${row.dead_rows} linhas). Execute VACUUM em breve.`,
            tablename: row.tablename,
            metric_value: deadRatio
          });
        }
      });
    }

    // 2. Verificar uso de índices vs sequential scans
    const { data: tableStats, error: statsError } = await supabase
      .from('pg_stat_user_tables')
      .select('relname, seq_scan, idx_scan, n_live_tup')
      .gte('seq_scan', 100);

    if (!statsError && tableStats) {
      tableStats.forEach((table: any) => {
        const totalScans = (table.seq_scan || 0) + (table.idx_scan || 0);
        const seqScanRatio = totalScans > 0 ? (table.seq_scan / totalScans) * 100 : 0;
        
        if (seqScanRatio > 50 && table.n_live_tup > 1000) {
          alerts.push({
            level: 'warning',
            category: 'missing_index',
            message: `Tabela ${table.relname} com ${seqScanRatio.toFixed(1)}% sequential scans. Considere adicionar índices.`,
            tablename: table.relname,
            metric_value: seqScanRatio
          });
        }
      });
    }

    // 3. Verificar tamanho de tabelas (opcional - alerta se > 100MB)
    const { data: tableSizes, error: sizeError } = await supabase
      .rpc('get_table_sizes');

    if (!sizeError && tableSizes) {
      tableSizes?.forEach((table: any) => {
        const sizeMB = table.size_mb || 0;
        if (sizeMB > 100) {
          alerts.push({
            level: 'info',
            category: 'table_size',
            message: `Tabela ${table.tablename} com ${sizeMB.toFixed(2)}MB. Considere arquivamento ou particionamento.`,
            tablename: table.tablename,
            metric_value: sizeMB
          });
        }
      });
    }

    // Preparar resposta
    const response = {
      timestamp: new Date().toISOString(),
      status: alerts.length === 0 ? 'healthy' : 'needs_attention',
      alerts_count: alerts.length,
      critical_count: alerts.filter(a => a.level === 'critical').length,
      warning_count: alerts.filter(a => a.level === 'warning').length,
      info_count: alerts.filter(a => a.level === 'info').length,
      alerts: alerts
    };

    // Log para facilitar debug
    console.log('✅ Health check completed:', {
      status: response.status,
      alerts: response.alerts_count
    });

    if (response.critical_count > 0) {
      console.error('🔴 ALERTAS CRÍTICOS:', 
        alerts.filter(a => a.level === 'critical')
      );
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('❌ Erro no health check:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
