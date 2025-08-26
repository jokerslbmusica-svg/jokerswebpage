
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UploadCloud, Download, Loader2, Facebook, Instagram } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { getFanMedia, uploadFanMedia } from "@/app/actions/fan-gallery.actions";

interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video';
}

export function FanGallery() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    getFanMedia()
        .then(setMediaItems)
        .catch(err => console.error("Failed to fetch fan media:", err))
        .finally(() => setIsLoading(false));
  }, []);


  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "Tipo de archivo no soportado",
          description: "Por ahora, solo se pueden subir imágenes.",
        });
        event.target.value = "";
        return;
      }
      setSelectedFile(file);
    }
  }

  const handleFileUpload = async () => {
    if (!selectedFile) {
        toast({
            variant: "destructive",
            title: "Ningún archivo seleccionado",
            description: "Por favor, selecciona un archivo para subir.",
        });
        return;
    };

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const newItem = await uploadFanMedia(formData);
      setMediaItems((prevItems) => [newItem, ...prevItems]);
      toast({
        title: "¡Gracias por compartir!",
        description: "Tu foto ha sido subida y ahora es parte de la galería.",
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        variant: "destructive",
        title: "Error de carga",
        description: "No se pudo subir el archivo. Inténtalo de nuevo.",
      });
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      // Find a way to reset the input field
      const input = document.getElementById('fan-media') as HTMLInputElement;
      if (input) {
          input.value = "";
      }
    }
  };
  
  return (
    <Card className="w-full shadow-lg bg-secondary text-secondary-foreground">
      <CardHeader>
        <CardTitle className="font-headline text-2xl md:text-3xl">Zona de Fans: Comparte Tus Momentos</CardTitle>
        <CardDescription className="text-secondary-foreground/80">¿Tienes una foto o video con nosotros? ¡Súbelo aquí y sé parte de nuestra historia!</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-6 border-dashed border-2 border-secondary-foreground/50 rounded-lg flex flex-col items-center text-center gap-4 mb-8">
            <UploadCloud className="w-16 h-16 text-primary" />
            <h3 className="text-xl font-semibold">Sube Tus Fotos</h3>
            <p>Arrastra y suelta tus imágenes o haz clic para seleccionar.</p>
            <div className="flex items-center gap-2 mt-4">
              <Input id="fan-media" type="file" className="text-foreground" accept="image/*" onChange={handleFileSelect} disabled={isUploading}/>
              <Button variant="secondary" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleFileUpload} disabled={isUploading || !selectedFile}>
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isUploading ? 'Enviando...' : 'Enviar Foto'}
              </Button>
            </div>
        </div>

        <Separator className="my-8 bg-secondary-foreground/20" />

        <div className="p-6 border-dashed border-2 border-secondary-foreground/50 rounded-lg flex flex-col items-center text-center gap-4 mb-8">
            <h3 className="text-xl font-semibold">¿Tienes videos? ¡Compártelos en Redes!</h3>
            <p>Sube tu video y etiquétanos. Búscanos como <span className="text-primary font-semibold">@JokersLiveBand</span> en Facebook y como <span className="text-primary font-semibold">@Jokers.Live.Band</span> en Instagram.</p>
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
              <Button asChild className="w-full sm:w-auto">
                <a href="https://www.facebook.com/JokersLiveBand" target="_blank" rel="noopener noreferrer">
                  <Facebook className="mr-2" /> Subir a Facebook
                </a>
              </Button>
              <Button asChild className="w-full sm:w-auto">
                <a href="https://www.instagram.com/Jokers.Live.Band" target="_blank" rel="noopener noreferrer">
                  <Instagram className="mr-2" /> Subir a Instagram
                </a>
              </Button>
            </div>
        </div>
        
        <Separator className="my-8 bg-secondary-foreground/20" />

        <h3 className="text-xl font-semibold text-center mb-4">Galería de Fotos de Fans</h3>
         {isLoading ? (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : mediaItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {mediaItems.map((item) => (
                  <div key={item.id} className="relative group overflow-hidden rounded-lg shadow-md aspect-video">
                      <Image 
                          src={item.url} 
                          alt={item.name}
                          width={600}
                          height={400}
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button variant="outline" size="icon" asChild>
                          <a href={item.url} download={item.name}>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                  </div>
              ))}
          </div>
        ) : (
             <p className="text-center text-muted-foreground py-8">
                La galería de fans está vacía. ¡Anima a tus seguidores a subir sus fotos!
            </p>
        )}
      </CardContent>
    </Card>
  );
}
