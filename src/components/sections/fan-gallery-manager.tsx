
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Users, Download, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getFanMedia, deleteFanMedia, type MediaItem } from "@/app/actions";

export function FanGalleryManager() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  async function fetchMedia() {
    setIsLoading(true);
    try {
      const items = await getFanMedia();
      setMediaItems(items);
    } catch (error) {
      console.error("Error fetching fan media:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar la galería de fans. Inténtalo de nuevo.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleDelete = async (itemId: string) => {
    setIsDeleting(itemId);
    try {
      await deleteFanMedia(itemId);
      setMediaItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
      toast({
        title: "Eliminada",
        description: "La foto ha sido eliminada de la galería de fans.",
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({
        variant: "destructive",
        title: "Error al eliminar",
        description: "No se pudo eliminar la foto. Inténtalo de nuevo.",
      });
    } finally {
      setIsDeleting(null);
    }
  };


  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl md:text-3xl flex items-center gap-2">
          <Users className="w-8 h-8 text-primary" />
          Moderar Galería de Fans
        </CardTitle>
        <CardDescription>Revisa y elimina las fotos subidas por los fans si es necesario.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : mediaItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {mediaItems.map((item) => (
                    <div key={item.id} className="relative group overflow-hidden rounded-lg shadow-md aspect-video">
                        {item.type === 'image' ? (
                            <Image 
                                src={item.url} 
                                alt={item.name}
                                width={600}
                                height={400}
                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                            />
                        ) : (
                            // Fallback for video, though we only allow images for now
                            <div className="w-full h-full bg-black flex items-center justify-center">
                                <p className="text-white">Video no soportado</p>
                            </div>
                        )}
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="outline" size="icon" asChild>
                                <a href={item.url} download={item.name}>
                                    <Download className="h-4 w-4" />
                                </a>
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                <Button 
                                    variant="destructive" 
                                    size="icon" 
                                    disabled={isDeleting === item.id}
                                >
                                    {isDeleting === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Esto eliminará permanentemente la foto de la galería de fans.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(item.id)}>
                                    Confirmar
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <p className="text-center text-muted-foreground py-8">
                La galería de fans está vacía. ¡Anima a tus seguidores a subir sus fotos!
            </p>
        )}
      </CardContent>
    </Card>
  );
}
