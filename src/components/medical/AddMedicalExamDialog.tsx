import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Upload, X, Droplets, Heart, ScanLine, ClipboardList } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AddMedicalExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AddMedicalExamDialog: React.FC<AddMedicalExamDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState<'blood' | 'cardiology' | 'imaging' | 'others'>('others');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Erro",
          description: "Por favor, selecione apenas arquivos PDF ou imagens (JPG, PNG).",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) {
      toast({
        title: "Erro",
        description: "Título e arquivo são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      if (!navigator.onLine) {
        throw new Error("Sem conexão com a internet. Verifique sua rede e tente novamente.");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('medical-exams')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get signed URL for private files
      const { data: urlData, error: urlError } = await supabase.storage
        .from('medical-exams')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year expiry

      if (urlError) throw urlError;

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('medical_exams')
        .insert({
          user_id: user.id,
          title: title.trim(),
          date,
          notes: notes.trim() || null,
          file_url: urlData.signedUrl,
          category,
        });

      if (dbError) throw dbError;

      toast({
        title: "Sucesso",
        description: "Exame médico adicionado com sucesso!",
      });

      // Reset form
      setTitle('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setNotes('');
      setCategory('others');
      setSelectedFile(null);

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error uploading medical exam:', error);

      let errorMessage = "Erro ao adicionar exame médico. Tente novamente.";

      if (error.message === "Sem conexão com a internet. Verifique sua rede e tente novamente.") {
        errorMessage = error.message;
      } else if (error.name === 'TypeError' && error.message === 'Load failed') {
        errorMessage = "Falha na conexão. Verifique sua internet.";
      }

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Adicionar Exame Médico
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Título do Exame *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Exame de sangue completo"
              disabled={uploading}
            />
          </div>

          <div>
            <Label htmlFor="date">Data do Exame</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={uploading}
            />
          </div>

          <div>
            <Label htmlFor="category">Categoria do Exame</Label>
            <Select value={category} onValueChange={(value: 'blood' | 'cardiology' | 'imaging' | 'others') => setCategory(value)} disabled={uploading}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blood">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-red-500" />
                    Exames de Sangue
                  </div>
                </SelectItem>
                <SelectItem value="cardiology">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-500" />
                    Cardiológicos
                  </div>
                </SelectItem>
                <SelectItem value="imaging">
                  <div className="flex items-center gap-2">
                    <ScanLine className="w-4 h-4 text-blue-500" />
                    Exames de Imagem
                  </div>
                </SelectItem>
                <SelectItem value="others">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-gray-500" />
                    Outros
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações sobre o exame..."
              rows={3}
              disabled={uploading}
            />
          </div>

          <div>
            <Label>Arquivo do Exame *</Label>
            {!selectedFile ? (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Clique para selecionar</span> um arquivo
                  </p>
                  <p className="text-xs text-muted-foreground">PDF, JPG ou PNG (máx. 10MB)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
              </label>
            ) : (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  disabled={uploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !title.trim() || uploading}
              className="flex-1"
            >
              {uploading ? 'Salvando...' : 'Salvar Exame'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};