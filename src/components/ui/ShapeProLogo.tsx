import appLogo from "@/assets/shape-pro-logo-main.png";

export const AppLogo = ({ className = "h-16 w-auto" }: { className?: string }) => {
  return (
    <div className="flex items-center justify-center">
      <img
        src={appLogo}
        alt="PRAS Trainer Logo"
        className={className}
      />
    </div>
  );
};

// Alias para retrocompatibilidade
export const ShapeProLogo = AppLogo;