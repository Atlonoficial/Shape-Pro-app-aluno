import { useEffect, useRef, useCallback } from 'react';

interface UseMessageVisibilityProps {
  onMessageVisible: (messageId: string) => void;
  threshold?: number;
}

export const useMessageVisibility = ({ 
  onMessageVisible, 
  threshold = 0.5 
}: UseMessageVisibilityProps) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observedElementsRef = useRef<Set<string>>(new Set());

  const observeMessage = useCallback((element: HTMLElement, messageId: string) => {
    if (!observerRef.current || observedElementsRef.current.has(messageId)) {
      return;
    }

    element.setAttribute('data-message-id', messageId);
    observerRef.current.observe(element);
    observedElementsRef.current.add(messageId);
  }, []);

  const unobserveMessage = useCallback((messageId: string) => {
    if (!observerRef.current) return;

    const element = document.querySelector(`[data-message-id="${messageId}"]`);
    if (element) {
      observerRef.current.unobserve(element as HTMLElement);
    }
    observedElementsRef.current.delete(messageId);
  }, []);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute('data-message-id');
            if (messageId) {
              onMessageVisible(messageId);
              // Para de observar após marcar como vista
              observerRef.current?.unobserve(entry.target);
              observedElementsRef.current.delete(messageId);
            }
          }
        });
      },
      {
        threshold,
        rootMargin: '0px 0px -50px 0px', // Trigger um pouco antes da mensagem sair da tela
      }
    );

    return () => {
      observerRef.current?.disconnect();
      observedElementsRef.current.clear();
    };
  }, [onMessageVisible, threshold]);

  return { observeMessage, unobserveMessage };
};