
import { Home, Dumbbell, Apple, User, Users, MessageCircle } from "lucide-react";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

const navItems = [
  { id: 'home', icon: Home, label: 'Início' },
  { id: 'workouts', icon: Dumbbell, label: 'Treinos' },
  { id: 'nutrition', icon: Apple, label: 'Dieta' },
  { id: 'chat', icon: MessageCircle, label: 'Chat' },
  { id: 'members', icon: Users, label: 'Membros' },
  { id: 'profile', icon: User, label: 'Perfil' },
];

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNavigation = ({ activeTab, onTabChange }: BottomNavigationProps) => {
  const unreadCount = useUnreadMessages();
  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-card border-t border-border">
      <div className="flex justify-around items-center px-1 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`nav-item ${isActive ? 'active' : ''} flex-1 max-w-[80px] relative`}
            >
              {item.id === 'chat' && !isActive && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              <Icon 
                size={20} 
                className={`transition-colors duration-300 ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
              <span 
                className={`text-[10px] font-medium transition-colors duration-300 text-center leading-tight ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
