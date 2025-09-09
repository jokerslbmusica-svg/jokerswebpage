
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { CalendarCheck } from 'lucide-react';

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
  </svg>
);

const eventTypes = ["Boda", "Fiesta Privada", "Evento Corporativo", "Bar o Club", "Otro"];

export function BookingInfo() {
  const [eventType, setEventType] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventVenue, setEventVenue] = useState('');
  const [eventNotes, setEventNotes] = useState('');

  const handleSendWhatsApp = () => {
    const bandPhoneNumber = "523315463695"; // Número de la banda

    let message = "¡Hola, Jokers! Quisiera cotizar un evento.\n\n";
    if (eventType) message += `*Tipo de evento:* ${eventType}\n`;
    if (eventDate) message += `*Fecha:* ${eventDate}\n`;
    if (eventVenue) message += `*Lugar:* ${eventVenue}\n`;
    if (eventNotes) message += `*Notas adicionales:* ${eventNotes}\n`;

    message += "\n¡Quedo a la espera de su respuesta!";
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${bandPhoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl md:text-3xl flex items-center gap-2">
          <CalendarCheck className="w-8 h-8 text-primary"/>
          Contrata a la Banda
        </CardTitle>
        <CardDescription>
          Rellena los detalles de tu evento y te enviaremos una cotización por WhatsApp.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="event-type">Tipo de Evento</Label>
             <Select onValueChange={setEventType} value={eventType}>
                <SelectTrigger id="event-type">
                    <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                    {eventTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-date">Fecha del Evento</Label>
            <Input 
              id="event-date" 
              type="date" 
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="event-venue">Lugar del Evento (Ej: Terraza Andares, Guadalajara)</Label>
          <Input 
            id="event-venue" 
            type="text" 
            placeholder="Nombre del lugar y ciudad"
            value={eventVenue}
            onChange={(e) => setEventVenue(e.target.value)}
          />
        </div>
        <div className="space-y-2">
            <Label htmlFor="event-notes">Notas Adicionales (Opcional)</Label>
            <Textarea 
                id="event-notes"
                placeholder="¿Hay algo más que debamos saber? Horarios, equipo necesario, etc."
                value={eventNotes}
                onChange={(e) => setEventNotes(e.target.value)}
            />
        </div>
        <Button
            size="lg"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
            onClick={handleSendWhatsApp}
            disabled={!eventType || !eventDate || !eventVenue}
        >
          <WhatsAppIcon className="w-6 h-6"/>
          Solicitar Cotización por WhatsApp
        </Button>
      </CardContent>
    </Card>
  );
}
