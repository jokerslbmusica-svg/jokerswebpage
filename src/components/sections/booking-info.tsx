
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '../ui/textarea';
import { CalendarCheck, Loader2, Send } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { sendBookingInquiry } from "@/app/actions";

const bookingSchema = z.object({
  name: z.string().min(2, "El nombre es requerido."),
  email: z.string().email("Por favor, introduce un email válido."),
  phone: z.string().optional(),
  eventType: z.string().min(3, "El tipo de evento es requerido."),
  eventDate: z.string().min(1, "La fecha del evento es requerida."),
  message: z.string().min(10, "Por favor, proporciona más detalles en tu mensaje.").max(1000),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export function BookingInfo() {
  const [isBooking, setIsBooking] = useState(false);
  const { toast } = useToast();
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      name: "", email: "", phone: "", eventType: "", eventDate: "", message: ""
    }
  });

  const onBookingSubmit = async (data: BookingFormValues) => {
    setIsBooking(true);
    const result = await sendBookingInquiry(data);

    if (result.success) {
      toast({
        title: "¡Solicitud Enviada!",
        description: "Gracias por tu interés. Nos pondremos en contacto contigo pronto.",
      });
      form.reset();
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }

    setIsBooking(false);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl md:text-3xl flex items-center gap-2">
          <CalendarCheck className="w-8 h-8 text-primary"/>
          Contrata a la Banda
        </CardTitle>
        <CardDescription>
          Rellena los detalles de tu evento para recibir una cotización.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onBookingSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nombre Completo</Label>
                    <Input id="name" {...form.register("name")} />
                    {form.formState.errors.name && <p className="text-destructive text-sm">{form.formState.errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email de Contacto</Label>
                    <Input id="email" type="email" {...form.register("email")} />
                    {form.formState.errors.email && <p className="text-destructive text-sm">{form.formState.errors.email.message}</p>}
                </div>
                  <div className="space-y-2">
                    <Label htmlFor="eventType">Tipo de Evento (Ej. Boda, Bar, Festival)</Label>
                    <Input id="eventType" {...form.register("eventType")} />
                    {form.formState.errors.eventType && <p className="text-destructive text-sm">{form.formState.errors.eventType.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="eventDate">Fecha del Evento</Label>
                    <Input id="eventDate" type="date" min={today} {...form.register("eventDate")} />
                    {form.formState.errors.eventDate && <p className="text-destructive text-sm">{form.formState.errors.eventDate.message}</p>}
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="message">Mensaje (Lugar, horario, detalles adicionales)</Label>
                <Textarea id="message" {...form.register("message")} />
                {form.formState.errors.message && <p className="text-destructive text-sm">{form.formState.errors.message.message}</p>}
            </div>
            <Button type="submit" disabled={isBooking} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                {isBooking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {isBooking ? "Enviando..." : "Enviar Solicitud"}
            </Button>
        </form>
      </CardContent>
    </Card>
  );
}
