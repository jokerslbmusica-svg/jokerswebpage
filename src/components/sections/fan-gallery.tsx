
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Camera, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getFanMedia, type MediaItem } from "@/app/actions";

export function FanGallery() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    getFanMedia()
      .then(items => setMediaItems(items))
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="relative overflow-hidden rounded-lg shadow-md aspect-square">
                <Skeleton className="w-full h-full" />
              </div>
            ))}
          </div>
        ) : mediaItems.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mediaItems.map((item, index) => (
                <button
                  key={item.id}
                  className="relative group overflow-hidden rounded-lg shadow-md aspect-square block w-full h-full cursor-pointer"
                  onClick={() => {
                    setLightboxIndex(index);
                    setLightboxOpen(true);
                  }}
                >
                  <Image
                    src={item.url}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                </button>
              ))}
            </div>
            <Lightbox 
              open={lightboxOpen} 
              close={() => {
                setLightboxOpen(false);
              }} 
              slides={mediaItems.map((item) => ({ src: item.url, alt: item.name }))} index={lightboxIndex} />
          </>
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
