export const ShapeProLogo = ({ className = "h-16 w-auto" }: { className?: string }) => {
  return (
    <div className={`${className} flex flex-col items-center justify-center`}>
      <div className="text-center">
        <div className="consultoria-online mb-1">
          CONSULTORIA ON-LINE
        </div>
        <div className="flex items-center justify-center gap-1">
          <span className="shape-pro-title text-muted-foreground">
            SHAPE
          </span>
          <span className="shape-pro-title text-gradient-primary">
            PRO
          </span>
        </div>
      </div>
    </div>
  );
};