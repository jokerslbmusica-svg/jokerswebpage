
'use client';

import { useState, useEffect, FC } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Loader2, Link as LinkIcon } from "lucide-react";
import { getTourDates, type TourDate } from "@/app/actions";
import { Button } from '../ui/button';

export const TourDates: FC = () => {
    const [dates, setDates] = useState<TourDate[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        getTourDates()
            .then(setDates)
            .catch(err => console.error("Failed to fetch tour dates:", err))
            .finally(() => setIsLoading(false));
    }, []);

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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dates.map((item: TourDate) => (
                            <div key={item.id} className="bg-secondary/80 p-4 rounded-lg flex flex-col items-center justify-center text-center">
                                <p className='mb-4 text-muted-foreground'>Tenemos un evento próximo. Haz clic para ver los detalles:</p>
                                <Button asChild>
                                    <a href={item.postUrl} target="_blank" rel="noopener noreferrer">
                                        <LinkIcon className="mr-2 h-4 w-4" />
                                        Ver Publicación del Evento
                                    </a>
                                </Button>
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
