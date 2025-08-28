
"use client";

import React from 'react';
import Link from "next/link";
import { Hero } from "@/components/sections/hero";
import { BookingInfo } from "@/components/sections/booking-info";
import { PaymentInfo } from "@/components/sections/payment-info";
import { SocialLinks } from "@/components/sections/social-links";
import { Separator } from "@/components/ui/separator";
import { TourDates } from '@/components/sections/tour-dates';
import { Music } from '@/components/sections/music';
import { BandGallery } from '@/components/sections/band-gallery';
import { BandBio } from '@/components/sections/band-bio';
import { FanGallery } from '@/components/sections/fan-gallery';
import { FanComments } from '@/components/sections/fan-comments';
import { LogoGenerator } from '@/components/sections/logo-generator';
import { PressKit } from '@/components/sections/press-kit';

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
        
        <TourDates />
        
        <Separator className="my-8" />

        <Music />
        
        <Separator className="my-8" />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2">
            <BandGallery readOnly={true} />
          </div>
          <div className="xl:col-span-1">
            <BandBio />
          </div>
        </div>

        <Separator className="my-8" />

        <FanGallery />
        
        <Separator className="my-8" />

        <FanComments readOnly={true} />
        
        <Separator className="my-8" />

        <LogoGenerator />
        
        <Separator className="my-8" />
        
        <PressKit />

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
