import { useState, useEffect } from 'react';
import { onSnapshot, collection, query, where, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ChatMessage } from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook para chat em tempo real com Firebase
 * 
 * ONDE USAR:
 * - /pages/aluno/chat/[id].tsx (página de chat com professor)
 * - Componentes de chat em tempo real
 * - Modal de suporte/atendimento
 * 
 * EXEMPLO DE USO:
 * const { messages, loading, sendMessage, error } = useChat('conversation_123');
 * await sendMessage('Olá professor!');
 */

interface UseChatReturn {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  sendMessage: (content: string, type?: 'text' | 'image' | 'file') => Promise<void>;
}

export const useChat = (conversationId: string | undefined): UseChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!conversationId) {
      setLoading(false);
      setMessages([]);
      return;
    }

    try {
      // Query para buscar mensagens da conversa
      // Ordenadas por timestamp (mais antigas primeiro para exibir cronologicamente)
      const messagesQuery = query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId),
        orderBy('createdAt', 'asc')
      );

      const unsubscribe = onSnapshot(
        messagesQuery,
        (snapshot) => {
          const messagesData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              // Converter timestamp do Firestore para Date
              createdAt: data.createdAt?.toDate?.() || data.createdAt
            };
          }) as ChatMessage[];

          setMessages(messagesData);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Erro ao buscar mensagens:', err);
          setError('Erro ao carregar mensagens');
          setLoading(false);
        }
      );

      return () => unsubscribe();

    } catch (err) {
      console.error('Erro no useChat:', err);
      setError('Erro ao configurar chat');
      setLoading(false);
    }
  }, [conversationId]);

  const sendMessage = async (content: string, type: 'text' | 'image' | 'file' = 'text') => {
    if (!conversationId || !user || !content.trim()) {
      return;
    }

    try {
      // Criar nova mensagem no Firestore
      const newMessage = {
        conversationId,
        senderId: user.uid,
        senderType: 'student' as const,
        message: content.trim(),
        messageType: type as 'text' | 'image' | 'file',
        isRead: false,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'messages'), newMessage);

      // Atualizar última atividade da conversa (opcional)
      // await updateDoc(doc(db, 'conversations', conversationId), {
      //   lastMessage: content.trim(),
      //   lastMessageAt: serverTimestamp(),
      //   lastMessageBy: user.uid
      // });

    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setError('Erro ao enviar mensagem');
      throw err;
    }
  };

  return {
    messages,
    loading,
    error,
    sendMessage
  };
};