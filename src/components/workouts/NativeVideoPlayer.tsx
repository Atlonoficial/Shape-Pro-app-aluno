import React, { useRef, useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

interface NativeVideoPlayerProps {
    videoUrl: string | null;
    posterUrl?: string | null;
    autoPlay?: boolean;
}

export default function NativeVideoPlayer({ videoUrl, posterUrl, autoPlay = false }: NativeVideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Detectar se é um GIF pelo URL
    const isGif = videoUrl?.toLowerCase().includes('.gif');

    useEffect(() => {
        if (videoUrl) {
            console.log('🎬 Tentando carregar mídia:', videoUrl, isGif ? '(GIF)' : '(Vídeo)');
            setLoading(true);
            setError(null);
        }
    }, [videoUrl, isGif]);

    const handleLoadedData = () => {
        console.log('✅ Mídia carregada com sucesso:', videoUrl);
        setLoading(false);
        setError(null);
    };

    const handleError = () => {
        console.error('❌ Erro ao carregar mídia:', videoUrl);
        setLoading(false);
        setError('Erro ao carregar');
    };

    if (!videoUrl) {
        return (
            <div className="w-full aspect-video bg-muted rounded-lg flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">Nenhum vídeo disponível para este exercício.</p>
                <p className="text-xs mt-1 opacity-70">O professor ainda não adicionou um vídeo demonstrativo.</p>
            </div>
        );
    }

    // Renderizar GIF como imagem animada
    if (isGif) {
        return (
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
                {loading && !error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                )}

                {error ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted z-10 text-center p-4">
                        <AlertCircle className="w-8 h-8 text-destructive mb-2" />
                        <p className="text-sm font-medium text-foreground">Erro ao carregar animação</p>
                    </div>
                ) : (
                    <img
                        src={videoUrl}
                        alt="Demonstração do exercício"
                        className="w-full h-full object-contain"
                        onLoad={handleLoadedData}
                        onError={handleError}
                    />
                )}
            </div>
        );
    }

    // Renderizar vídeo normal
    return (
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg group">
            {loading && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
            )}

            {error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted z-10 text-center p-4">
                    <AlertCircle className="w-8 h-8 text-destructive mb-2" />
                    <p className="text-sm font-medium text-foreground">Erro ao carregar o vídeo</p>
                    <button
                        onClick={() => {
                            setError(null);
                            setLoading(true);
                            if (videoRef.current) {
                                videoRef.current.load();
                            }
                        }}
                        className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
                    >
                        Tentar Novamente
                    </button>
                </div>
            ) : (
                <video
                    ref={videoRef}
                    src={videoUrl}
                    poster={posterUrl || undefined}
                    className="w-full h-full object-contain"
                    controls
                    playsInline
                    autoPlay={autoPlay}
                    onLoadedData={handleLoadedData}
                    onError={handleError}
                    controlsList="nodownload"
                >
                    Seu dispositivo não suporta a reprodução de vídeos.
                </video>
            )}
        </div>
    );
}
