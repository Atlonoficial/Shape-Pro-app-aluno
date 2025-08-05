import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

// Tipos para upload de arquivos
export interface UploadResult {
  url: string;
  path: string;
  name: string;
}

// Função para upload de avatar do usuário
export const uploadUserAvatar = async (
  userId: string, 
  file: File
): Promise<UploadResult> => {
  try {
    const fileName = `avatar_${Date.now()}.${file.name.split('.').pop()}`;
    const storageRef = ref(storage, `avatars/${userId}/${fileName}`);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      url: downloadURL,
      path: snapshot.ref.fullPath,
      name: fileName
    };
  } catch (error) {
    console.error('Erro ao fazer upload do avatar:', error);
    throw error;
  }
};

// Função para upload de fotos de progresso
export const uploadProgressPhoto = async (
  userId: string,
  file: File,
  progressType: 'before' | 'after' | 'progress'
): Promise<UploadResult> => {
  try {
    const timestamp = Date.now();
    const fileName = `${progressType}_${timestamp}.${file.name.split('.').pop()}`;
    const storageRef = ref(storage, `progress/${userId}/${fileName}`);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      url: downloadURL,
      path: snapshot.ref.fullPath,
      name: fileName
    };
  } catch (error) {
    console.error('Erro ao fazer upload da foto de progresso:', error);
    throw error;
  }
};

// Função para upload de vídeos de exercícios (para professores)
export const uploadExerciseVideo = async (
  teacherId: string,
  exerciseId: string,
  file: File
): Promise<UploadResult> => {
  try {
    const fileName = `${exerciseId}_${Date.now()}.${file.name.split('.').pop()}`;
    const storageRef = ref(storage, `exercises/${teacherId}/${fileName}`);
    
    // Verificar tamanho do arquivo (máximo 50MB para vídeos)
    if (file.size > 50 * 1024 * 1024) {
      throw new Error('Arquivo muito grande. Máximo 50MB permitido.');
    }
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      url: downloadURL,
      path: snapshot.ref.fullPath,
      name: fileName
    };
  } catch (error) {
    console.error('Erro ao fazer upload do vídeo do exercício:', error);
    throw error;
  }
};

// Função para upload de documentos (exames, laudos, etc.)
export const uploadDocument = async (
  userId: string,
  file: File,
  documentType: 'exam' | 'report' | 'certificate' | 'other'
): Promise<UploadResult> => {
  try {
    const timestamp = Date.now();
    const fileName = `${documentType}_${timestamp}.${file.name.split('.').pop()}`;
    const storageRef = ref(storage, `documents/${userId}/${fileName}`);
    
    // Verificar tipos de arquivo permitidos
    const allowedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
      throw new Error('Tipo de arquivo não permitido. Use: PDF, JPG, PNG, DOC, DOCX');
    }
    
    // Verificar tamanho do arquivo (máximo 10MB para documentos)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Arquivo muito grande. Máximo 10MB permitido.');
    }
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      url: downloadURL,
      path: snapshot.ref.fullPath,
      name: fileName
    };
  } catch (error) {
    console.error('Erro ao fazer upload do documento:', error);
    throw error;
  }
};

// Função para deletar arquivo
export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
    console.log('Arquivo deletado com sucesso:', filePath);
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    throw error;
  }
};

// Função para obter URL de download
export const getFileURL = async (filePath: string): Promise<string> => {
  try {
    const fileRef = ref(storage, filePath);
    return await getDownloadURL(fileRef);
  } catch (error) {
    console.error('Erro ao obter URL do arquivo:', error);
    throw error;
  }
};

// Função para validar tipo de arquivo
export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  return fileExtension ? allowedTypes.includes(fileExtension) : false;
};

// Função para validar tamanho do arquivo
export const validateFileSize = (file: File, maxSizeMB: number): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

// Função para redimensionar imagem antes do upload (opcional)
export const resizeImage = (
  file: File, 
  maxWidth: number = 800, 
  maxHeight: number = 600, 
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calcular novas dimensões mantendo proporção
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(resizedFile);
          }
        },
        file.type,
        quality
      );
    };
    
    img.src = URL.createObjectURL(file);
  });
};