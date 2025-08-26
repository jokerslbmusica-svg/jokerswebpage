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
} from "@/app/actions/tour-dates.actions";
import { Loader2, Calendar, PlusCircle, Trash2, Link } from "lucide-react";
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
import { format } from "date-fns";
import { es } from "date-fns/locale";

const dateSchema = z.object({
  eventName: z.string().min(1, "El nombre del evento es requerido."),
  venue: z.string().min(1, "El lugar es requerido."),
  city: z.string().min(1, "La ciudad es requerida."),
  date: z.string().min(1, "La fecha es requerida."),
  time: z.string().min(1, "La hora es requerida."),
  venueUrl: z.string().url("Por favor, introduce una URL válida.").optional().or(z.literal('')),
});

type DateFormValues = z.infer<typeof dateSchema>;

export function TourDatesManager() {
  const [dates, setDates] = useState<TourDate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DateFormValues>({
    resolver: zodResolver(dateSchema),
    defaultValues: {
        eventName: "",
        venue: "",
        city: "",
        date: "",
        time: "",
        venueUrl: "",
    }
  });
  
  async function fetchDates() {
    setIsFetching(true);
    try {
        const tourDates = await getTourDates();
        setDates(tourDates);
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar las fechas." });
    } finally {
        setIsFetching(false);
    }
  }
  
  useEffect(() => {
    fetchDates();
  }, []);

  const onSubmit = async (data: DateFormValues) => {
    setIsLoading(true);
    try {
      await addTourDate(data);
      toast({ title: "¡Éxito!", description: "Nueva fecha agregada correctamente." });
      reset();
      fetchDates(); // Refresh the list
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo agregar la fecha." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (dateId: string) => {
    try {
      await deleteTourDate(dateId);
      toast({ title: "Eliminado", description: "La fecha ha sido eliminada." });
      fetchDates(); // Refresh the list
    } catch (error) {
      toast({ variant: "destructive", title: "Error al eliminar", description: "No se pudo eliminar la fecha." });
    }
  };

  // Helper to format date string
  const formatDate = (dateString: string) => {
    try {
        const date = new Date(dateString);
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        return format(new Date(date.getTime() + userTimezoneOffset), "d 'de' MMMM, yyyy", { locale: es });
    } catch (error) {
        return "Fecha inválida";
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
          Añade, edita o elimina las próximas fechas de conciertos de la banda.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Form to add new dates */}
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 p-4 border rounded-lg">
            <div className="space-y-2">
                <Label htmlFor="eventName">Nombre del Evento</Label>
                <Input id="eventName" {...register("eventName")} />
                {errors.eventName && <p className="text-destructive text-sm">{errors.eventName.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="venue">Lugar (Venue)</Label>
                <Input id="venue" {...register("venue")} />
                {errors.venue && <p className="text-destructive text-sm">{errors.venue.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input id="city" {...register("city")} />
                {errors.city && <p className="text-destructive text-sm">{errors.city.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input id="date" type="date" {...register("date")} />
                {errors.date && <p className="text-destructive text-sm">{errors.date.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="time">Hora</Label>
                <Input id="time" type="time" {...register("time")} />
                {errors.time && <p className="text-destructive text-sm">{errors.time.message}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="venueUrl">URL del Lugar (Opcional)</Label>
                <Input id="venueUrl" type="url" placeholder="https://ejemplo.com" {...register("venueUrl")} />
                {errors.venueUrl && <p className="text-destructive text-sm">{errors.venueUrl.message}</p>}
            </div>
            <div className="flex items-end md:col-span-2 lg:col-span-3">
                <Button type="submit" disabled={isLoading} className="w-full lg:w-auto">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                    {isLoading ? "Agregando..." : "Agregar Fecha"}
                </Button>
            </div>
        </form>

        {/* List of existing dates */}
        <h3 className="font-headline text-xl mb-4">Fechas Programadas</h3>
        {isFetching ? (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : (
        <div className="space-y-2">
          {dates.length > 0 ? dates.map(date => (
            <div key={date.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-md">
                <div>
                    <p className="font-bold">{date.eventName} - {date.venue}, {date.city}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(date.date)} a las {date.time}</p>
                    {date.venueUrl && (
                        <a href={date.venueUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                           <Link className="h-3 w-3" /> Ver página del lugar
                        </a>
                    )}
                </div>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4"/></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente la fecha.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => date.id && handleDelete(date.id)}>Confirmar</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
          )) : <p className="text-muted-foreground text-center">No hay fechas programadas.</p>}
        </div>
        )}
      </CardContent>
    </Card>
  );
}
