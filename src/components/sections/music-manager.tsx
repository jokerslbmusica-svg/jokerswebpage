
"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  addSong,
  getSongs,
  deleteSong,
  updateSongOrder,
  type Song,
} from "@/app/actions";
import { Loader2, Music, PlusCircle, Trash2, GripVertical } from "lucide-react";
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


const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ACCEPTED_AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp3"];
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const songSchema = z.object({
  title: z.string().min(1, "El título es requerido."),
  artist: z.string().min(1, "El artista es requerido."),
  audioFile: z.any()
    .refine((files) => files?.length == 1, "El archivo de audio es requerido.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `El tamaño máximo es de 50MB.`)
    .refine(
      (files) => ACCEPTED_AUDIO_TYPES.includes(files?.[0]?.type),
      "Solo se aceptan formatos .mp3, .wav y .ogg"
    ),
  coverFile: z.any()
    .refine((files) => files?.length == 1, "La carátula es requerida.")
    .refine((files) => files?.[0]?.size <= 5 * 1024 * 1024, `El tamaño máximo es de 5MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Solo se aceptan formatos .jpg, .jpeg, .png y .webp"
    ),
});

type SongFormValues = z.infer<typeof songSchema>;

function SortableSongItem({ song, isDeleting, handleDelete }: { song: Song, isDeleting: string | null, handleDelete: (song: Song) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: song.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between gap-4 p-3 bg-secondary/50 rounded-md">
        <div className="flex items-center gap-4 flex-grow">
            <div {...attributes} {...listeners} className="cursor-grab touch-none p-2">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <Image src={song.coverUrl} alt={`Cover for ${song.title}`} width={64} height={64} className="rounded-md object-cover h-16 w-16" />
            <div>
                <p className="font-bold">{song.title}</p>
                <p className="text-sm text-muted-foreground">{song.artist}</p>
            </div>
        </div>
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon" disabled={isDeleting === song.id}>
                    {isDeleting === song.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente la canción y sus archivos.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(song)}>Confirmar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}

export function MusicManager() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isReordering, startReorderTransition] = useTransition();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);


  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SongFormValues>({
    resolver: zodResolver(songSchema),
  });
  
  async function fetchSongs() {
    setIsFetching(true);
    try {
        const music = await getSongs();
        setSongs(music);
    } catch (error) {
        console.error("Error fetching songs:", error);
        toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar las canciones." });
    } finally {
        setIsFetching(false);
    }
  }
  
  useEffect(() => {
    fetchSongs();
  }, []);

  const onSubmit = async (data: SongFormValues) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("artist", data.artist);
    formData.append("audioFile", data.audioFile[0]);
    formData.append("coverFile", data.coverFile[0]);
    
    try {
      await addSong(formData);
      toast({ title: "¡Éxito!", description: "Nueva canción agregada correctamente." });
      reset();
      formRef.current?.reset();
      fetchSongs(); // Refresh the list
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo agregar la canción." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (song: Song) => {
    setIsDeleting(song.id);
    try {
      await deleteSong(song);
      toast({ title: "Eliminada", description: "La canción ha sido eliminada." });
      fetchSongs(); // Refresh the list
    } catch (error) {
      toast({ variant: "destructive", title: "Error al eliminar", description: "No se pudo eliminar la canción." });
    } finally {
        setIsDeleting(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSongs((currentSongs) => {
        const oldIndex = currentSongs.findIndex((s) => s.id === active.id);
        const newIndex = currentSongs.findIndex((s) => s.id === over.id);
        const newOrderSongs = arrayMove(currentSongs, oldIndex, newIndex);

        // After local state update, call server action
        startReorderTransition(async () => {
            const songsWithNewOrder = newOrderSongs.map((song, index) => ({ id: song.id, order: index }));
            const result = await updateSongOrder(songsWithNewOrder);
            if (!result.success) toast({ variant: "destructive", title: "Error", description: result.error });
        });
        return newOrderSongs;
      });
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl md:text-3xl flex items-center gap-2">
            <Music className="w-8 h-8 text-primary" />
            Gestionar Música
        </CardTitle>
        <CardDescription>
          Añade, o elimina las canciones de la banda.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Form to add new songs */}
        <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 p-4 border rounded-lg">
            <div className="space-y-2 lg:col-span-1">
                <Label htmlFor="title">Título de la canción</Label>
                <Input id="title" {...register("title")} />
                {errors.title && <p className="text-destructive text-sm">{errors.title.message}</p>}
            </div>
            <div className="space-y-2 lg:col-span-1">
                <Label htmlFor="artist">Artista</Label>
                <Input id="artist" {...register("artist")} defaultValue="Jokers Live Band" />
                {errors.artist && <p className="text-destructive text-sm">{errors.artist.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="audioFile">Archivo de Audio (Requerido)</Label>
                <Input id="audioFile" type="file" accept={ACCEPTED_AUDIO_TYPES.join(",")} {...register("audioFile")} />
                {errors.audioFile?.message && <p className="text-destructive text-sm">{String(errors.audioFile.message)}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="coverFile">Imagen de Carátula (Requerida)</Label>
                <Input id="coverFile" type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} {...register("coverFile")} />
                {errors.coverFile?.message && <p className="text-destructive text-sm">{String(errors.coverFile.message)}</p>}
            </div>
            <div className="flex items-end md:col-span-2 lg:col-span-3">
                <Button type="submit" disabled={isLoading} className="w-full lg:w-auto">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                    {isLoading ? "Agregando..." : "Agregar Canción"}
                </Button>
            </div>
        </form>

        {/* List of existing songs */}
        <h3 className="font-headline text-xl mb-4">Canciones Subidas</h3>
        {isFetching ? (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : (
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <div className="space-y-4">
                    {isReordering && <div className="text-sm text-muted-foreground flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando nuevo orden...</div>}
                    <SortableContext items={songs} strategy={verticalListSortingStrategy}>
                        {songs.length > 0 ? songs.map(song => (
                            <SortableSongItem key={song.id} song={song} isDeleting={isDeleting} handleDelete={handleDelete} />
                        )) : <p className="text-muted-foreground text-center">No hay canciones subidas.</p>}
                    </SortableContext>
                </div>
            </DndContext>
        )}
      </CardContent>
    </Card>
  );
}
