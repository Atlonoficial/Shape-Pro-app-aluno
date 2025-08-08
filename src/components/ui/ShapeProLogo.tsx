export const ShapeProLogo = ({ className = "h-16 w-auto" }: { className?: string }) => {
  return (
    <div className={`${className} flex flex-col items-center justify-center`}>
      <div className="text-center">
        <div className="text-warning font-bold tracking-[0.2em] text-sm mb-1">
          CONSULTORIA ON-LINE
        </div>
        <div className="flex items-center justify-center gap-1">
          <span className="font-black tracking-[0.15em] text-4xl text-muted-foreground">
            SHAPE
          </span>
          <span className="font-black tracking-[0.15em] text-4xl bg-gradient-to-r from-primary to-warning bg-clip-text text-transparent">
            PRO
          </span>
        </div>
      </div>
    </div>
  );
};