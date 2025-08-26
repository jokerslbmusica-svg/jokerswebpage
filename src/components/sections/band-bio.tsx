
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Loader2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { getBandBio } from '@/app/actions/band-info.actions';

export function BandBio() {
    const [bio, setBio] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getBandBio()
            .then(setBio)
            .catch(err => console.error("Failed to fetch band bio:", err))
            .finally(() => setIsLoading(false));
    }, []);


    return (
        <Card className="w-full shadow-lg h-full flex flex-col">
            <CardHeader>
                <CardTitle className="font-headline text-2xl md:text-3xl flex items-center gap-2">
                    <FileText className="w-8 h-8 text-primary" />
                    Biografía
                </CardTitle>
                <CardDescription>Conoce nuestra historia</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                {isLoading ? (
                     <div className="flex justify-center items-center h-full min-h-[100px]">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : bio ? (
                    <ScrollArea className="h-[300px] pr-4">
                        <p className="text-muted-foreground whitespace-pre-wrap">
                            {bio}
                        </p>
                    </ScrollArea>
                ) : (
                    <p className="text-center text-muted-foreground py-8">
                        La biografía de la banda aún no ha sido escrita.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
