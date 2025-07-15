import { Home, Dumbbell, Apple, User, Trophy } from "lucide-react";
import { useState } from "react";

const navItems = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'workouts', icon: Dumbbell, label: 'Treinos' },
  { id: 'nutrition', icon: Apple, label: 'Dieta' },
  { id: 'rewards', icon: Trophy, label: 'Prêmios' },
  { id: 'profile', icon: User, label: 'Perfil' },
];

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNavigation = ({ activeTab, onTabChange }: BottomNavigationProps) => {
  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-card border-t border-border">
      <div className="flex justify-around items-center px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon 
                size={22} 
                className={`transition-colors duration-300 ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
              <span 
                className={`text-xs font-medium transition-colors duration-300 ${
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