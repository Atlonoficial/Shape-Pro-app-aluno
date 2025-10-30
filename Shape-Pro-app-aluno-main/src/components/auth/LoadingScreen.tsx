export const LoadingScreen = () => {
  return (
    <div 
      className="min-h-screen flex items-center justify-center" 
      style={{ backgroundColor: '#000000' }} // ✅ FORÇA cor preta (não depende de CSS)
    >
      <div className="text-center">
        <div className="mb-8">
          <img 
            src="/lovable-uploads/11efc078-c8bc-4ac4-9d94-1e18b4e6a54d.png" 
            alt="Shape Pro"
            className="h-20 w-auto mx-auto"
            onError={(e) => {
              // ✅ Esconde imagem se falhar ao carregar
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        {/* ✅ Spinner MAIOR e mais visível */}
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-500 border-t-transparent mx-auto"></div>
        <p className="text-white mt-6 text-lg font-semibold">Carregando...</p>
        <p className="text-gray-400 mt-2 text-sm">Inicializando aplicativo...</p>
      </div>
    </div>
  );
};
