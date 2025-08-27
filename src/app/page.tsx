
"use client";

import React, { Suspense } from 'react';
import Link from "next/link";
import { Hero } from "@/components/sections/hero";
import { BookingInfo } from "@/components/sections/booking-info";
import { PaymentInfo } from "@/components/sections/payment-info";
import { SocialLinks } from "@/components/sections/social-links";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from 'lucide-react';

// Lazy load components that are below the fold
const TourDates = React.lazy(() => import('@/components/sections/tour-dates').then(module => ({ default: module.TourDates })));
const Music = React.lazy(() => import('@/components/sections/music').then(module => ({ default: module.Music })));
const BandGallery = React.lazy(() => import('@/components/sections/band-gallery').then(module => ({ default: module.BandGallery })));
const BandBio = React.lazy(() => import('@/components/sections/band-bio').then(module => ({ default: module.BandBio })));
const FanGallery = React.lazy(() => import('@/components/sections/fan-gallery').then(module => ({ default: module.FanGallery })));
const FanComments = React.lazy(() => import('@/components/sections/fan-comments').then(module => ({ default: module.FanComments })));
const LogoGenerator = React.lazy(() => import('@/components/sections/logo-generator').then(module => ({ default: module.LogoGenerator })));
const PressKit = React.lazy(() => import('@/components/sections/press-kit').then(module => ({ default: module.PressKit })));


const Spinner = () => (
  <div className="flex justify-center items-center w-full h-64">
    <Loader2 className="h-12 w-12 animate-spin text-primary" />
  </div>
);

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
