import shapeProLogo from "@/assets/shape-pro-logo-main.png";

export const ShapeProLogo = ({ className = "h-16 w-auto" }: { className?: string }) => {
  return (
    <div className="flex items-center justify-center">
      <img 
        src={shapeProLogo} 
        alt="Shape Pro Logo" 
        className={className}
      />
    </div>
  );
};