
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Camera, Users } from "lucide-react";
import { getFanMedia, type MediaItem } from "@/app/actions";

export function FanGallery() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getFanMedia()
      .then(items => {
        // We only want images added via URL by the admin
        setMediaItems(items.filter(item => item.type === 'image'));
      })
      .catch(err => console.error("Failed to fetch fan media:", err))
      .finally(() => setIsLoading(false));
  }, []);
  
  return (
    <Card className="w-full shadow-lg bg-secondary text-secondary-foreground">
      <CardHeader>
        <CardTitle className="font-headline text-2xl md:text-3xl flex items-center gap-2">
            <Users className="w-8 h-8 text-primary" />
            Galería de Fans
        </CardTitle>
        <CardDescription className="text-secondary-foreground/80">Una colección de momentos especiales curada por la banda.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-40 min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : mediaItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {mediaItems.map((item) => (
              <div key={item.id} className="relative group overflow-hidden rounded-lg shadow-md aspect-square">
                 <Image
                    src={item.url}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-8 min-h-[300px]">
            <Camera className="w-16 h-16 mb-4 text-primary/50" />
            <p className="font-semibold">La galería de fans está vacía.</p>
            <p className="text-sm">El administrador aún no ha añadido ninguna imagen.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
