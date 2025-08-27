
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music as MusicIcon, Play, Pause, Loader2 } from "lucide-react";
import { getSongs, type Song } from "@/app/actions";

export function Music() {
    const [songs, setSongs] = useState<Song[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [nowPlaying, setNowPlaying] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    
    useEffect(() => {
        setIsLoading(true);
        getSongs()
            .then(setSongs)
            .catch(err => console.error("Failed to fetch songs:", err))
            .finally(() => setIsLoading(false));
    }, []);

    const togglePlay = (song: Song) => {
        if (audioRef.current) {
            if (nowPlaying === song.id && !audioRef.current.paused) {
                audioRef.current.pause();
                setNowPlaying(null);
            } else {
                audioRef.current.src = song.audioUrl;
                audioRef.current.play();
                setNowPlaying(song.id);
            }
        }
    };
    
    useEffect(() => {
        const audio = audioRef.current;
        const handleEnded = () => setNowPlaying(null);
        if (audio) {
            audio.addEventListener('ended', handleEnded);
        }
        return () => {
            if (audio) {
                audio.removeEventListener('ended', handleEnded);
            }
        };
    }, []);

    return (
        <Card className="w-full shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-2xl md:text-3xl flex items-center gap-2">
                    <MusicIcon className="w-8 h-8 text-primary" />
                    Nuestra Música
                </CardTitle>
                <CardDescription>Escucha nuestros últimos lanzamientos y grandes éxitos.</CardDescription>
            </CardHeader>
            <CardContent>
                <audio ref={audioRef} className="hidden" />
                {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : songs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {songs.map((song) => (
                            <div key={song.id} className="group flex flex-col items-center text-center p-4 rounded-lg bg-secondary/80 hover:bg-secondary transition-all duration-300">
                                <div className="relative w-40 h-40 mb-4">
                                    <Image 
                                        src={song.coverUrl} 
                                        alt={`Cover for ${song.title}`}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        className="rounded-full object-cover shadow-lg"
                                    />
                                    <button 
                                        onClick={() => togglePlay(song)}
                                        className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        aria-label={nowPlaying === song.id ? "Pause" : "Play"}
                                    >
                                        {nowPlaying === song.id ? <Pause className="w-10 h-10 text-white" /> : <Play className="w-10 h-10 text-white" />}
                                    </button>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-foreground">{song.title}</h3>
                                    <p className="text-sm text-muted-foreground">{song.artist}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-8">
                        Aún no hemos subido música. ¡Vuelve pronto para escuchar nuestros temas!
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
