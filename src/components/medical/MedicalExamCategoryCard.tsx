import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Droplets, Heart, ScanLine, ClipboardList } from 'lucide-react';

interface MedicalExamCategoryCardProps {
  category: 'blood' | 'cardiology' | 'imaging' | 'others';
  count: number;
  onViewExams: (category: string) => void;
}

export const MedicalExamCategoryCard: React.FC<MedicalExamCategoryCardProps> = ({
  category,
  count,
  onViewExams,
}) => {
  const getCategoryConfig = (cat: string) => {
    switch (cat) {
      case 'blood':
        return {
          icon: <Droplets className="w-6 h-6 text-red-500" />,
          name: 'Exames de Sangue',
          color: 'text-red-600',
          bgColor: 'bg-red-50 dark:bg-red-950/20',
        };
      case 'cardiology':
        return {
          icon: <Heart className="w-6 h-6 text-pink-500" />,
          name: 'Cardiológicos',
          color: 'text-pink-600',
          bgColor: 'bg-pink-50 dark:bg-pink-950/20',
        };
      case 'imaging':
        return {
          icon: <ScanLine className="w-6 h-6 text-blue-500" />,
          name: 'Exames de Imagem',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-950/20',
        };
      default:
        return {
          icon: <ClipboardList className="w-6 h-6 text-gray-500" />,
          name: 'Outros Exames',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 dark:bg-gray-950/20',
        };
    }
  };

  const config = getCategoryConfig(category);

  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md hover:scale-105"
      onClick={() => onViewExams(category)}
    >
      <CardContent className={`p-4 ${config.bgColor}`}>
        <div className="flex flex-col items-center text-center space-y-2">
          {config.icon}
          <div>
            <h3 className={`font-medium ${config.color} text-sm`}>{config.name}</h3>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {count} exame{count !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};