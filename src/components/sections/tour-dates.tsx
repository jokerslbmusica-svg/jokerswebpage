
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Clock, Loader2 } from "lucide-react";
import { getTourDates, type TourDate } from "@/app/actions/tour-dates.actions";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function TourDates() {
    const [dates, setDates] = useState<TourDate[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        getTourDates()
            .then(tourDates => {
                // Set all dates first
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Set time to the beginning of the day for consistent comparison
                const upcomingDates = tourDates.filter(d => {
                    const eventDate = new Date(d.date);
                    // Adjust for timezone differences by getting time in UTC
                    const eventDateUTC = new Date(eventDate.getUTCFullYear(), eventDate.getUTCMonth(), eventDate.getUTCDate());
                    return eventDateUTC >= today;
                });
                setDates(upcomingDates);
            })
            .catch(err => console.error("Failed to fetch tour dates:", err))
            .finally(() => setIsLoading(false));
    }, []);

    // Helper to format the month
     const formatMonth = (dateString: string) => {
        const date = new Date(dateString);
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        return format(new Date(date.getTime() + userTimezoneOffset), "MMM", { locale: es });
    };

    // Helper to format the day
    const formatDay = (dateString: string) => {
        const date = new Date(dateString);
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        return format(new Date(date.getTime() + userTimezoneOffset), "dd", { locale: es });
    };

    return (
        <Card className="w-full shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-2xl md:text-3xl flex items-center gap-2">
                    <Calendar className="w-8 h-8 text-primary" />
                    Próximas Fechas
                </CardTitle>
                <CardDescription>¡No te pierdas nuestros próximos shows en vivo!</CardDescription>
            </CardHeader>
            <CardContent>
                 {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : dates.length > 0 ? (
                    <div className="space-y-4">
                        {dates.map((item) => (
                            <div key={item.id} className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg bg-secondary/80 hover:bg-secondary transition-all duration-300">
                                <div className="flex-shrink-0 flex sm:flex-col items-center justify-center text-center bg-primary text-primary-foreground p-3 rounded-md w-full sm:w-24 shadow-lg">
                                    <span className="text-4xl font-bold">{formatDay(item.date)}</span>
                                    <span className="font-semibold uppercase text-xl ml-2 sm:ml-0">{formatMonth(item.date)}</span>
                                </div>
                                <div className="flex-grow">
                                    <h3 className="text-xl font-bold text-foreground">{item.eventName}</h3>
                                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                        <MapPin className="w-4 h-4" />
                                        {item.venueUrl ? (
                                            <a href={item.venueUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">
                                                {item.venue}, {item.city}
                                            </a>
                                        ) : (
                                            <span>{item.venue}, {item.city}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                        <Clock className="w-4 h-4" />
                                        <span>{item.time}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-8">
                        No hay fechas programadas por el momento. ¡Vuelve pronto!
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
