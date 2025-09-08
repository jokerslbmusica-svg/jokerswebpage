
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Users, Trash2, Loader2, PlusCircle, Link, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getFanMedia, deleteFanMedia, addFanMedia, type MediaItem } from "@/app/actions";

const urlSchema = z.object({
  url: z.string().url("Por favor, introduce una URL de imagen válida."),
});

type UrlFormValues = z.infer<typeof urlSchema>;

export function FanGalleryManager() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UrlFormValues>({
    resolver: zodResolver(urlSchema),
  });

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

  const onSubmit = async (data: UrlFormValues) => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("url", data.url);
    try {
      await addFanMedia(formData);
      toast({ title: "¡Imagen añadida!", description: "La imagen ahora se mostrará en la galería de fans." });
      reset();
      fetchMedia();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error al añadir", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    setIsDeleting(itemId);
    try {
      await deleteFanMedia(itemId);
      setMediaItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
      toast({
        title: "Eliminada",
        description: "La imagen ha sido eliminada de la galería de fans.",
      });
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        variant: "destructive",
        title: "Error al eliminar",
        description: "No se pudo eliminar la imagen. Inténtalo de nuevo.",
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
          Gestionar Galería de Fans
        </CardTitle>
        <CardDescription>Añade o elimina imágenes en la galería de fans usando URLs.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row items-start gap-4 mb-8 p-4 border rounded-lg">
          <div className="w-full space-y-2">
            <Label htmlFor="url">URL de la Imagen</Label>
            <Input id="url" placeholder="https://ejemplo.com/imagen.jpg" {...register("url")} />
            {errors.url && <p className="text-destructive text-sm">{errors.url.message}</p>}
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto mt-2 sm:mt-0 self-end">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
            Añadir Imagen
          </Button>
        </form>

        <h3 className="font-headline text-xl mb-4">Imágenes en la Galería</h3>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : mediaItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {mediaItems.map((item) => (
              <div key={item.id} className="relative group">
                <Image 
                  src={item.url} 
                  alt="Imagen de la galería de fans" 
                  width={200}
                  height={200}
                  className="rounded-lg object-cover w-full aspect-square"
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" disabled={isDeleting === item.id}>
                        {isDeleting === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente la imagen de la galería.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(item.id)}>Confirmar</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                    </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            La galería de fans está vacía. Añade una URL de una imagen para empezar.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
