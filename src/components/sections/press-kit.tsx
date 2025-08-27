"use client";

import { useState } from 'react';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Image as ImageIcon, Briefcase, Mail, Phone, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getBandBio, getBandMedia } from '@/app/actions';

// Helper function to trigger file download in the browser
const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
};


export function PressKit() {
    const [isPdfLoading, setIsPdfLoading] = useState(false);
    const [isZipLoading, setIsZipLoading] = useState(false);
    const { toast } = useToast();

    const handleDownloadPdf = async () => {
        setIsPdfLoading(true);
        try {
            const bioText = await getBandBio();

            if (!bioText) {
                throw new Error('La biografía de la banda no está disponible.');
            }

            const doc = new jsPDF();

            // Add header
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text("Jokers Live Band", 105, 20, { align: 'center' });
            doc.setFontSize(14);
            doc.setFont('helvetica', 'normal');
            doc.text("Biografía Oficial", 105, 30, { align: 'center' });

            // Add content
            doc.setFontSize(12);
            const splitText = doc.splitTextToSize(bioText, 180); // 180mm width
            doc.text(splitText, 15, 45);
            
            // Add footer
            doc.setFontSize(10);
            doc.setTextColor(150);
            const pageCount = doc.internal.getNumberOfPages();
            for(let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.text(`Página ${i} de ${pageCount}`, 105, 287, { align: 'center' });
                doc.text("www.jokersliveband.com", 15, 287);
            }

            doc.save("JokersLiveBand-Bio.pdf");

            toast({
                title: "¡Éxito!",
                description: "La biografía en PDF se está descargando.",
            });

        } catch (e: any) {
            console.error("Error downloading PDF:", e);
            toast({
                variant: 'destructive',
                title: "Error de Descarga",
                description: e.message || 'Hubo un problema al generar el PDF. Inténtalo de nuevo.',
            });
        } finally {
            setIsPdfLoading(false);
        }
    };

    const handleDownloadZip = async () => {
        setIsZipLoading(true);
        try {
            const mediaItems = await getBandMedia();
            const imageItems = mediaItems.filter(item => item.type === 'image');
    
            if (imageItems.length === 0) {
                throw new Error('No hay imágenes en la galería para incluir en el ZIP.');
            }
    
            const zip = new JSZip();
            
            // Note: This fetches images via proxy which might be slow or fail for large galleries.
            // A more robust solution for large galleries would direct Storage URLs.
            const imagePromises = imageItems.map(async (image) => {
                try {
                    // Fetch the image data from its URL. This might be a data URL or a gs:// URL.
                    // We need to handle both cases if necessary, but here we assume base64 data URLs.
                    if (!image.url.startsWith('data:image')) {
                         console.warn(`Skipping non-data-URL image: ${image.id}`);
                         return;
                    }
                    const base64Data = image.url.split(',')[1];
                    const fileName = `JokersLiveBand_${image.id}.jpg`;
                    zip.file(fileName, base64Data, { base64: true });
                } catch (fetchError) {
                    console.error(`Failed to process image ${image.id}:`, fetchError);
                    // Optionally, you can decide to not fail the whole zip process for one failed image.
                }
            });
    
            await Promise.all(imagePromises);
            
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            downloadFile(zipBlob, "JokersLiveBand-Fotos.zip");

            toast({
                title: "¡Éxito!",
                description: "El archivo ZIP con las fotos se está descargando.",
            });

        } catch (e: any) {
            console.error("Error downloading ZIP:", e);
             toast({
                variant: 'destructive',
                title: "Error de Descarga",
                description: e.message || 'Hubo un problema al generar el ZIP. Inténtalo de nuevo.',
            });
        } finally {
            setIsZipLoading(false);
        }
    };


    return (
        <Card className="w-full shadow-lg bg-secondary text-secondary-foreground">
            <CardHeader>
                <CardTitle className="font-headline text-2xl md:text-3xl flex items-center gap-2">
                    <Briefcase className="w-8 h-8 text-primary" />
                    Press Kit
                </CardTitle>
                <CardDescription className="text-secondary-foreground/80">
                    Recursos y contacto para medios, promotores y colaboradores.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Recursos Descargables</h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                         <Button onClick={handleDownloadPdf} disabled={isPdfLoading} className="w-full sm:w-auto">
                            {isPdfLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2" />}
                            {isPdfLoading ? 'Generando...' : 'Biografía (PDF)'}
                        </Button>
                        <Button onClick={handleDownloadZip} disabled={isZipLoading} className="w-full sm:w-auto">
                            {isZipLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2" />}
                           {isZipLoading ? 'Comprimiendo...' : 'Fotos (ZIP)'}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Descarga nuestra biografía oficial y un paquete con fotos de alta resolución para uso en medios.
                    </p>
                </div>
                 <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Contacto de Prensa</h3>
                     <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-primary" />
                        <a href="mailto:jokerslbmusica@gmail.com" className="hover:underline">jokerslbmusica@gmail.com</a>
                    </div>
                     <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-primary" />
                        <span>+52 33 1546 3695</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
