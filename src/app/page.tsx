
"use client";

import React, { Suspense } from 'react';
import Link from "next/link";
import dynamic from 'next/dynamic';
import { Hero } from "@/components/sections/hero";
import { BookingInfo } from "@/components/sections/booking-info";
import { PaymentInfo } from "@/components/sections/payment-info";
import { SocialLinks } from "@/components/sections/social-links";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from 'lucide-react';

const Spinner = () => (
  <div className="flex justify-center items-center w-full h-64">
    <Loader2 className="h-12 w-12 animate-spin text-primary" />
  </div>
);

// Lazy load components that are below the fold using Next.js dynamic import
const TourDates = dynamic(() => import('@/components/sections/tour-dates').then(module => module.TourDates), { loading: () => <Spinner /> });
const Music = dynamic(() => import('@/components/sections/music').then(module => module.Music), { loading: () => <Spinner /> });
const BandGallery = dynamic(() => import('@/components/sections/band-gallery').then(module => module.BandGallery), { loading: () => <Spinner /> });
const BandBio = dynamic(() => import('@/components/sections/band-bio').then(module => module.BandBio), { loading: () => <Spinner /> });
const FanGallery = dynamic(() => import('@/components/sections/fan-gallery').then(module => module.FanGallery), { loading: () => <Spinner /> });
const FanComments = dynamic(() => import('@/components/sections/fan-comments').then(module => module.FanComments), { loading: () => <Spinner /> });
const LogoGenerator = dynamic(() => import('@/components/sections/logo-generator').then(module => module.LogoGenerator), { loading: () => <Spinner /> });
const PressKit = dynamic(() => import('@/components/sections/press-kit').then(module => module.PressKit), { 
    ssr: false,
    loading: () => <Spinner />,
});

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <Hero />
      <div className="w-full max-w-7xl p-4 md:p-8 space-y-12 bg-background/90 backdrop-blur-sm rounded-t-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
            <BookingInfo />
          </div>
          <div className="space-y-8">
            <PaymentInfo />
            <SocialLinks />
          </div>
        </div>

        <Separator className="my-8" />
        
        <Suspense fallback={<Spinner />}>
          <TourDates />
        </Suspense>
        
        <Separator className="my-8" />

        <Suspense fallback={<Spinner />}>
          <Music />
        </Suspense>
        
        <Separator className="my-8" />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2">
            <Suspense fallback={<Spinner />}>
              <BandGallery readOnly={true} />
            </Suspense>
          </div>
          <div className="xl:col-span-1">
            <Suspense fallback={<Spinner />}>
              <BandBio />
            </Suspense>
          </div>
        </div>

        <Separator className="my-8" />

        <Suspense fallback={<Spinner />}>
          <FanGallery />
        </Suspense>
        
        <Separator className="my-8" />

        <Suspense fallback={<Spinner />}>
          <FanComments readOnly={true} />
        </Suspense>
        
        <Separator className="my-8" />

        <Suspense fallback={<Spinner />}>
          <LogoGenerator />
        </Suspense>
        
        <Separator className="my-8" />
        
        <Suspense fallback={<Spinner />}>
          <PressKit />
        </Suspense>

      </div>
      <footer className="w-full bg-primary/90 backdrop-blur-sm text-primary-foreground text-center p-4">
        <p>&copy; {new Date().getFullYear()} Jokers Live Band. Todos los derechos reservados.</p>
        <div className="mt-2">
            <Link href="/login" className="text-xs text-primary-foreground/70 hover:text-primary-foreground hover:underline transition-colors">
                Admin
            </Link>
        </div>
      </footer>
    </main>
  );
}
