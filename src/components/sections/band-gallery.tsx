
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Upload, Download, Trash2, Loader2, Camera, Youtube, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getBandMedia, uploadBandMedia, deleteBandMedia, type MediaItem } from "@/app/actions";
import { ScrollArea } from "../ui/scroll-area";
import { Label } from "../ui/label";


const imageSchema = z.object({
  imageUrl: z.string().url("Por favor, introduce una URL de imagen válida."),
});

const videoSchema = z.object({
  videoUrl: z.string().url("Por favor, introduce una URL válida de YouTube."),
});

interface BandGalleryProps {
  readOnly?: boolean;
}

const MediaItemComponent = ({ item, readOnly, isDeleting, handleDelete }: { item: MediaItem, readOnly: boolean, isDeleting: string | null, handleDelete: (id: string) => void }) => {
    if (item.type === 'video') {
        return (
            <div className="relative group overflow-hidden rounded-lg shadow-md aspect-video bg-black">
                <iframe
                    src={item.url}
                    title={item.name}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                ></iframe>
                 {!readOnly && (
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon" disabled={isDeleting === item.id}>
                                    {isDeleting === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente el video.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(item.id)}>Confirmar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </div>
        );
    }
    // Default to image
    return (
        <div className="relative group overflow-hidden rounded-lg shadow-md aspect-video">
            <Image
                src={item.url}
                alt={item.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
            />
            {!readOnly && (
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="outline" size="icon" asChild>
                        <a href={item.url} download={item.name}><Download className="h-4 w-4" /></a>
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" disabled={isDeleting === item.id}>
                                {isDeleting === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente el archivo de la galería.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(item.id)}>Confirmar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}
        </div>
    );
};


export function BandGallery({ readOnly = false }: BandGalleryProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const imageForm = useForm<{ imageUrl: string }>({ resolver: zodResolver(imageSchema) });
  const videoForm = useForm<{ videoUrl: string }>({ resolver: zodResolver(videoSchema) });

  const fetchMedia = () => {
    setIsLoading(true);
    getBandMedia()
      .then(items => setMediaItems(items))
      .catch(error => {
        console.error("Error fetching media:", error);
        toast({ variant: "destructive", title: "Error", description: "No se pudo cargar la galería." });
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    fetchMedia();
  }, []);


  const handleUpload = async (formData: FormData) => {
    setIsUploading(true);
    try {
      const newItem = await uploadBandMedia(formData);
      setMediaItems((prevItems) => [newItem, ...prevItems]);
      toast({ title: "¡Éxito!", description: "Tu contenido ha sido añadido." });
      fetchMedia(); // Re-fetch all to ensure order
    } catch (error: any) {
      console.error("Error uploading:", error);
      toast({ variant: "destructive", title: "Error de carga", description: error.message || "No se pudo subir el contenido." });
    } finally {
      setIsUploading(false);
      imageForm.reset();
      videoForm.reset();
    }
  };

  const onImageSubmit = (data: { imageUrl: string }) => {
    const formData = new FormData();
    formData.append("imageUrl", data.imageUrl);
    handleUpload(formData);
  };
  
  const onVideoSubmit = (data: { videoUrl: string }) => {
    const formData = new FormData();
    formData.append("videoUrl", data.videoUrl);
    handleUpload(formData);
  };

  const handleDelete = async (itemId: string) => {
    setIsDeleting(itemId);
    try {
      await deleteBandMedia(itemId);
      setMediaItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
      toast({ title: "Eliminado", description: "El contenido ha sido eliminado." });
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({ variant: "destructive", title: "Error al eliminar", description: "No se pudo eliminar el contenido." });
    } finally {
      setIsDeleting(null);
    }
  };


  return (
    <Card className="w-full shadow-lg h-full flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline text-2xl md:text-3xl flex items-center gap-2">
            <Camera className="w-8 h-8 text-primary" />
            Galería Multimedia
        </CardTitle>
        <CardDescription>Echa un vistazo a nuestras últimas fotos y videos.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <ScrollArea className="flex-grow pr-4 -mr-4">
        {isLoading ? (
            <div className="flex justify-center items-center h-full min-h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mediaItems.map((item) => (
                    <MediaItemComponent key={item.id} item={item} readOnly={readOnly} isDeleting={isDeleting} handleDelete={handleDelete} />
                ))}
            </div>
        )}
        </ScrollArea>
        {!readOnly && (
          <div className="mt-6 pt-6 border-t border-border">
            <Tabs defaultValue="image" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="image"><ImageIcon className="mr-2"/>Añadir Imagen</TabsTrigger>
                    <TabsTrigger value="video"><Youtube className="mr-2"/>Añadir Video</TabsTrigger>
                </TabsList>
                <TabsContent value="image">
                    <form onSubmit={imageForm.handleSubmit(onImageSubmit)} className="mt-4 p-4 border-dashed border-2 border-border rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex flex-col gap-1 w-full">
                           <Label htmlFor="image-url" className="text-muted-foreground">Pega la URL de la imagen:</Label>
                            <Input
                                id="image-url"
                                type="text"
                                placeholder="https://ejemplo.com/foto.jpg"
                                {...imageForm.register("imageUrl")}
                                disabled={isUploading}
                            />
                            {imageForm.formState.errors.imageUrl && <p className="text-destructive text-sm">{imageForm.formState.errors.imageUrl.message}</p>}
                        </div>
                        <Button type="submit" variant="outline" disabled={isUploading}>
                            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LinkIcon className="mr-2 h-4 w-4" />}
                            {isUploading ? "Añadiendo..." : "Añadir Imagen"}
                        </Button>
                    </form>
                </TabsContent>
                <TabsContent value="video">
                    <form onSubmit={videoForm.handleSubmit(onVideoSubmit)} className="mt-4 p-4 border-dashed border-2 border-border rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex flex-col gap-1 w-full">
                            <Label htmlFor="video-url" className="text-muted-foreground">Pega la URL del video de YouTube:</Label>
                            <Input
                                id="video-url"
                                type="text"
                                placeholder="https://www.youtube.com/watch?v=..."
                                {...videoForm.register("videoUrl")}
                                disabled={isUploading}
                            />
                             {videoForm.formState.errors.videoUrl && <p className="text-destructive text-sm">{videoForm.formState.errors.videoUrl.message}</p>}
                        </div>
                         <Button type="submit" variant="outline" disabled={isUploading}>
                            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LinkIcon className="mr-2 h-4 w-4" />}
                            {isUploading ? "Añadiendo..." : "Añadir Video"}
                        </Button>
                    </form>
                </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

