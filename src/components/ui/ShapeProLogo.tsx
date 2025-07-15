export const ShapeProLogo = ({ className = "h-16 w-auto" }: { className?: string }) => {
  return (
    <div className={`${className} flex flex-col items-center justify-center`}>
      <div className="text-center">
        <div className="text-lg font-bold text-warning mb-1 tracking-wider">
          CONSULTORIA ON-LINE
        </div>
        <div className="flex items-center justify-center gap-1">
          <span className="text-4xl font-black text-muted-foreground tracking-wider">
            SHAPE
          </span>
          <span className="text-4xl font-black text-warning tracking-wider">
            PRO
          </span>
        </div>
      </div>
    </div>
  );
};