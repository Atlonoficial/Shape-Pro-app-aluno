import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Conversation {
  id: string;
  student_id?: string;
  teacher_id?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count_student?: number;
  unread_count_teacher?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ChatHeaderProps {
  conversation?: Conversation | null;
  onlineUsers: string[];
  typingUsers: string[];
}

export const ChatHeader = ({ 
  conversation, 
  onlineUsers, 
  typingUsers 
}: ChatHeaderProps) => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [teacherName, setTeacherName] = useState<string>('Professor');
  
  const isStudent = userProfile?.user_type === 'student';
  const chatPartner = isStudent ? teacherName : 'Aluno';
  const chatPartnerId = isStudent ? conversation?.teacher_id : conversation?.student_id;

  // Buscar nome real do professor
  useEffect(() => {
    const fetchTeacherName = async () => {
      if (!conversation?.teacher_id) return;
      
      try {
        const { data, error } = await supabase.rpc('get_teacher_name', {
          teacher_id_param: conversation.teacher_id
        });
        
        if (data && !error) {
          setTeacherName(data);
        }
      } catch (error) {
        console.error('Erro ao buscar nome do professor:', error);
      }
    };

    if (isStudent && conversation?.teacher_id) {
      fetchTeacherName();
    }
  }, [conversation?.teacher_id, isStudent]);
  
  const isOnline = chatPartnerId ? onlineUsers.includes(chatPartnerId) : false;
  const isTyping = chatPartnerId ? typingUsers.includes(chatPartnerId) : false;

  const getStatusText = () => {
    if (isTyping) return 'digitando...';
    if (isOnline) return 'online';
    return 'offline';
  };

  const getStatusColor = () => {
    if (isTyping) return 'text-primary';
    if (isOnline) return 'text-success';
    return 'text-muted-foreground';
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-card">
      <div className="flex items-center gap-3">
        {/* Botão voltar */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="text-foreground hover:bg-muted"
        >
          <ArrowLeft size={20} />
        </Button>
        
        {/* Avatar e info */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="w-10 h-10">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                {chatPartner.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            {/* Indicador online */}
            {isOnline && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success border-2 border-card rounded-full" />
            )}
          </div>
          
          <div>
            <h3 className="font-semibold text-foreground">{chatPartner}</h3>
            <p className={`text-xs ${getStatusColor()}`}>
              {getStatusText()}
            </p>
          </div>
        </div>
      </div>
      
      {/* Status do Professor */}
      <div className="flex items-center gap-2">
        {isStudent && (
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
            isOnline ? 'border-success/20 bg-success/10' : 'border-muted'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-success animate-pulse' : 'bg-muted-foreground'
            }`} />
            <span className={`text-xs font-medium ${
              isTyping ? 'text-primary' : isOnline ? 'text-success' : 'text-muted-foreground'
            }`}>
              {getStatusText()}
            </span>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
        >
          <MoreVertical size={18} />
        </Button>
      </div>
    </div>
  );
};