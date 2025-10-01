import { Home, Dumbbell, Apple, User, Users } from "lucide-react";
import { useKeyboardState } from "@/hooks/useKeyboardState";
import { useBottomNavGestures } from "@/hooks/useBottomNavGestures";
import { useIsMobileApp } from "@/hooks/useIsMobileApp";

const navItems = [
  { id: 'home', icon: Home, label: 'Início' },
  { id: 'workouts', icon: Dumbbell, label: 'Treinos' },
  { id: 'nutrition', icon: Apple, label: 'Dieta' },
  { id: 'members', icon: Users, label: 'Membros' },
  { id: 'profile', icon: User, label: 'Perfil' },
];

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNavigation = ({ activeTab, onTabChange }: BottomNavigationProps) => {
  const { isVisible: keyboardVisible } = useKeyboardState();
  const { isMobileApp } = useIsMobileApp();
  const gestures = useBottomNavGestures({ 
    activeTab, 
    tabs: navItems, 
    onTabChange 
  });

  return (
    <nav
      {...(isMobileApp ? gestures : {})}
      className={`
        bottom-nav-container
        fixed left-0 right-0 z-50
        transition-transform duration-300 ease-smooth
        ${keyboardVisible ? 'translate-y-full' : 'translate-y-0'}
      `}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="
        bottom-nav-wrapper
        max-w-sm mx-auto
        bg-card/95 backdrop-blur-lg
        border-t border-border
        safe-area-bottom
      ">
        <div className="
          flex justify-around items-center
          px-2 py-2
          min-h-[60px]
          xs:min-h-[64px]
          sm:min-h-[68px]
        ">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`
                  nav-item 
                  ${isActive ? 'active' : ''} 
                  flex-1 
                  min-w-[48px] max-w-[88px]
                  min-h-[48px]
                  relative
                  focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card
                  active:scale-95
                  transition-all duration-200
                `}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                tabIndex={0}
              >
                <Icon 
                  size={22}
                  className={`
                    transition-all duration-300
                    ${isActive ? 'text-primary scale-110' : 'text-muted-foreground'}
                  `}
                  aria-hidden="true"
                />
                <span 
                  className={`
                    text-[10px] xs:text-[11px] font-medium
                    transition-all duration-300
                    text-center leading-tight
                    ${isActive ? 'text-primary font-semibold' : 'text-muted-foreground'}
                    line-clamp-1
                  `}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
