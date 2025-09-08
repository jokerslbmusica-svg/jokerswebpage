
"use client";

import { useState, useEffect } from "react";
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
  addTourDate,
  getTourDates,
  deleteTourDate,
  type TourDate,
} from "@/app/actions";
import { Loader2, Calendar, PlusCircle, Trash2, Link as LinkIcon } from "lucide-react";
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

const dateSchema = z.object({
  postUrl: z.string().url("Por favor, introduce una URL válida."),
});

type DateFormValues = z.infer<typeof dateSchema>;

export function TourDatesManager() {
  const [dates, setDates] = useState<TourDate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DateFormValues>({
    resolver: zodResolver(dateSchema),
    defaultValues: {
        postUrl: "",
    }
  });
  
  async function fetchDates() {
    setIsFetching(true);
    try {
        const tourDates = await getTourDates();
        setDates(tourDates);
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar las publicaciones." });
    } finally {
        setIsFetching(false);
    }
  }
  
  useEffect(() => {
    fetchDates();
  }, []);

  const onSubmit = async (data: DateFormValues) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('postUrl', data.postUrl);
    try {
      await addTourDate(formData);
      toast({ title: "¡Éxito!", description: "Nueva publicación agregada correctamente." });
      reset();
      fetchDates(); // Refresh the list
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo agregar la publicación." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (dateId: string) => {
    setIsDeleting(dateId);
    try {
      await deleteTourDate(dateId);
      toast({ title: "Eliminada", description: "La publicación ha sido eliminada." });
      fetchDates(); // Refresh the list
    } catch (error) {
      toast({ variant: "destructive", title: "Error al eliminar", description: "No se pudo eliminar la publicación." });
    } finally {
        setIsDeleting(null);
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl md:text-3xl flex items-center gap-2">
            <Calendar className="w-8 h-8 text-primary" />
            Gestionar Fechas de Presentaciones
        </CardTitle>
        <CardDescription>
          Añade o elimina las publicaciones de tus próximos eventos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row items-start gap-4 mb-8 p-4 border rounded-lg">
            <div className="w-full space-y-2">
                <Label htmlFor="postUrl">URL de la Publicación (Facebook, Instagram, etc.)</Label>
                <Input id="postUrl" type="url" placeholder="https://www.facebook.com/..." {...register("postUrl")} />
                {errors.postUrl && <p className="text-destructive text-sm">{errors.postUrl.message}</p>}
            </div>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto mt-2 sm:mt-0 self-end">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                {isLoading ? "Agregando..." : "Agregar Publicación"}
            </Button>
        </form>

        <h3 className="font-headline text-xl mb-4">Publicaciones de Eventos</h3>
        {isFetching ? (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : (
        <div className="space-y-2">
          {dates.length > 0 ? dates.map(date => (
            <div key={date.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-md">
                <a href={date.postUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-2 truncate">
                    <LinkIcon className="h-4 w-4" /> 
                    <span className="truncate">{date.postUrl}</span>
                </a>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" disabled={isDeleting === date.id}>
                           {isDeleting === date.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente la publicación.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => date.id && handleDelete(date.id)}>Confirmar</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
          )) : <p className="text-muted-foreground text-center">No hay publicaciones de eventos.</p>}
        </div>
        )}
      </CardContent>
    </Card>
  );
}
