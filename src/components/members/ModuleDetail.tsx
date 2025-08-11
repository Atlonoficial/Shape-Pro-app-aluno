import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ModuleDetailProps {
  courseId?: string;
  moduleId: string;
  onBack: () => void;
}

export const ModuleDetail = ({ courseId, moduleId, onBack }: ModuleDetailProps) => {
  return (
    <div className="p-4 pt-8 pb-24">
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4 -ml-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Módulo não encontrado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Este módulo ainda não está disponível.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};