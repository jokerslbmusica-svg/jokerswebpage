// This is a placeholder for the admin page.
// We will add protected content here in the next steps.
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { BandGallery } from '@/components/sections/band-gallery';
import { HashtagGenerator } from '@/components/sections/hashtag-generator';
import { Separator } from '@/components/ui/separator';
import { TourDatesManager } from '@/components/sections/tour-dates-manager';
import { FanComments } from '@/components/sections/fan-comments';
import { MusicManager } from '@/components/sections/music-manager';
import { FanGalleryManager } from '@/components/sections/fan-gallery-manager';
import { SocialPostGenerator } from '@/components/sections/social-post-generator';
import { BandBio } from '@/components/sections/band-bio';

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null; // or a redirect component
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8">
        <div className="w-full max-w-7xl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="font-headline text-3xl md:text-4xl">Panel de Administrador</h1>
                <Button onClick={logout} variant="outline">Cerrar Sesión</Button>
            </div>
            
            <div className="space-y-12">
                <TourDatesManager />
                <Separator />
                <MusicManager />
                <Separator />
                <BandGallery />
                <Separator />
                <FanGalleryManager />
                <Separator />
                <HashtagGenerator />
                <Separator />
                <SocialPostGenerator />
                <Separator />
                <BandBio />
                <Separator />
                <FanComments />
            </div>
        </div>
    </main>
  );
}
