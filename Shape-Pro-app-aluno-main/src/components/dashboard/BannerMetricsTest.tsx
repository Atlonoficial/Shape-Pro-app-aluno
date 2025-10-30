import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const BannerMetricsTest = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const handleAggregateMetrics = async () => {
    try {
      setIsProcessing(true);
      console.log('[BannerMetricsTest] Starting aggregation...');
      
      const { data, error } = await supabase.functions.invoke('aggregate-banner-analytics', {
        body: {
          date: new Date().toISOString().split('T')[0]
        }
      });

      if (error) {
        console.error('[BannerMetricsTest] Edge function error:', error);
        throw error;
      }

      console.log('[BannerMetricsTest] Aggregation result:', data);
      setLastResult(data);

      toast.success('Métricas agregadas com sucesso!', {
        description: `Processados: ${data?.processed || 0} registros`
      });
    } catch (error) {
      console.error('[BannerMetricsTest] Error aggregating metrics:', error);
      toast.error('Erro ao agregar métricas', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTestInteraction = async () => {
    try {
      // Primeiro, buscar um usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      const { data: banners } = await supabase
        .from('banners')
        .select('id')
        .eq('is_active', true)
        .limit(1);

      if (banners && banners.length > 0) {
        const { error } = await supabase
          .from('banner_interactions')
          .insert({
            banner_id: banners[0].id,
            user_id: user.id,
            interaction_type: 'view',
            session_id: `test-${user.id}-${Date.now()}`,
            metadata: {
              test: true,
              timestamp: new Date().toISOString()
            }
          });

        if (error) {
          throw error;
        }

        toast.success('Interação teste criada!');
      } else {
        toast.error('Nenhum banner ativo encontrado');
      }
    } catch (error) {
      console.error('[BannerMetricsTest] Error creating test interaction:', error);
      toast.error('Erro ao criar interação teste');
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-muted/10 space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Sistema de Métricas de Banner</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Teste e monitore o sistema de tracking e agregação de métricas.
        </p>
      </div>

      <div className="flex gap-2">
        <Button 
          onClick={handleTestInteraction}
          size="sm"
          variant="outline"
          disabled={isProcessing}
        >
          Criar Teste de Interação
        </Button>
        
        <Button 
          onClick={handleAggregateMetrics}
          size="sm"
          variant="default"
          disabled={isProcessing}
        >
          {isProcessing ? 'Processando...' : 'Agregar Métricas Hoje'}
        </Button>
      </div>

      {lastResult && (
        <div className="p-3 bg-green-50 border border-green-200 rounded text-xs">
          <strong>Último resultado:</strong>
          <pre className="mt-1 text-green-800">
            {JSON.stringify(lastResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};