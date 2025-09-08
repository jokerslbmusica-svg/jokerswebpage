
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Loader2, Save } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getBandBio, saveBandBio } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface BandBioProps {
    readOnly?: boolean;
}

export function BandBio({ readOnly = false }: BandBioProps) {
    const [bio, setBio] = useState<string | null>(null);
    const [editedBio, setEditedBio] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        getBandBio()
            .then(data => {
                setBio(data);
                setEditedBio(data || '');
            })
            .catch(err => console.error("Failed to fetch band bio:", err))
            .finally(() => setIsLoading(false));
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await saveBandBio(editedBio);
            setBio(editedBio);
            toast({
                title: "¡Biografía Guardada!",
                description: "La biografía de la banda ha sido actualizada.",
            });
        } catch (error) {
            console.error("Failed to save bio:", error);
            toast({
                variant: "destructive",
                title: "Error al Guardar",
                description: "No se pudo guardar la biografía.",
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isLoading && readOnly) {
        return (
            <Card className="w-full shadow-lg h-full flex flex-col">
                 <CardHeader>
                    <CardTitle className="font-headline text-2xl md:text-3xl flex items-center gap-2">
                        <FileText className="w-8 h-8 text-primary" />
                        Biografía
                    </CardTitle>
                    <CardDescription>Conoce nuestra historia</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex justify-center items-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </CardContent>
            </Card>
        )
    }

    if (readOnly) {
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
                    {bio ? (
                        <ScrollArea className="h-[300px] pr-4">
                            <p className="text-muted-foreground whitespace-pre-wrap">
                                {bio}
                            </p>
                        </ScrollArea>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-8 min-h-[300px]">
                            <FileText className="w-16 h-16 mb-4 text-primary/50" />
                            <p className="font-semibold">Biografía no disponible.</p>
                            <p className="text-sm">La biografía de la banda aún no ha sido escrita.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }
    
    // Admin View
    return (
        <Card className="w-full shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-2xl md:text-3xl flex items-center gap-2">
                    <FileText className="w-8 h-8 text-primary" />
                    Editar Biografía
                </CardTitle>
                <CardDescription>Modifica y guarda la biografía oficial de la banda.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading ? (
                    <div className="flex justify-center items-center h-[300px]">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                 ) : (
                    <>
                        <Textarea 
                            value={editedBio}
                            onChange={(e) => setEditedBio(e.target.value)}
                            className="min-h-[300px] whitespace-pre-wrap"
                            placeholder="Escribe aquí la biografía de la banda..."
                        />
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Guardar Biografía
                                </>
                            )}
                        </Button>
                    </>
                 )}
            </CardContent>
        </Card>
    );
}
