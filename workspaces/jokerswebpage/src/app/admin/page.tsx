"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

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
        // Render nothing or a redirect component while waiting for the redirect to happen
        return null;
    }

    return (
        <main className="flex min-h-screen flex-col items-center p-4 md:p-8">
            <div className="w-full max-w-7xl">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="font-headline text-3xl md:text-4xl">Panel de Administrador</h1>
                     <Button onClick={logout} variant="outline">Cerrar Sesión</Button>
                </div>
                <div className="text-center py-16 text-muted-foreground">
                    <p>El panel de administración ha sido desactivado para evitar costos de servicios.</p>
                    <p className="mt-4">Toda la funcionalidad de gestión ha sido eliminada.</p>
                </div>
            </div>
        </main>
    );
}
