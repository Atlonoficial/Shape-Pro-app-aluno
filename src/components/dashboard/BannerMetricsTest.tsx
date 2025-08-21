import React from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const BannerMetricsTest = () => {
  const handleAggregateMetrics = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('aggregate-banner-analytics', {
        body: {
          date: new Date().toISOString().split('T')[0] // Today's date
        }
      });

      if (error) {
        throw error;
      }

      toast.success('Métricas agregadas com sucesso!', {
        description: `Processados: ${data.processed} registros`
      });
    } catch (error) {
      console.error('Error aggregating metrics:', error);
      toast.error('Erro ao agregar métricas', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-muted/10">
      <h3 className="text-sm font-medium mb-2">Teste do Sistema de Métricas</h3>
      <p className="text-xs text-muted-foreground mb-3">
        Execute a agregação manual de métricas para processar interações em dados consolidados.
      </p>
      <Button 
        onClick={handleAggregateMetrics}
        size="sm"
        variant="outline"
      >
        Agregar Métricas Hoje
      </Button>
    </div>
  );
};