"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wand2, Sparkles, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getLogoSuggestion } from "@/app/actions/logo.actions";

const formSchema = z.object({
  prompt: z
    .string()
    .min(10, "Describe con más detalle tu idea, al menos 10 caracteres.")
    .max(200, "La descripción no puede exceder los 200 caracteres."),
});

type FormValues = z.infer<typeof formSchema>;

export function LogoGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{imageDataUri: string} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setResult(null);
    setError(null);

    const response = await getLogoSuggestion(values);

    if (response.success && response.data) {
      // @ts-ignore
      setResult(response.data);
    } else {
      setError(response.error ?? "Ocurrió un error desconocido.");
      toast({
        variant: "destructive",
        title: "Error de Generación",
        description: response.error,
      });
    }
    setIsLoading(false);
  }

  return (
    <Card className="w-full shadow-lg bg-secondary text-secondary-foreground">
      <CardHeader className="text-center">
        <CardTitle className="font-headline text-2xl md:text-3xl flex items-center justify-center gap-2">
          <Sparkles className="w-8 h-8 text-primary" />
          ¡Crea un Logo para la Banda!
        </CardTitle>
        <CardDescription className="text-secondary-foreground/80">
          Usa la IA para diseñar un logo único. ¿Cómo te imaginas nuestro emblema?
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Describe tu idea de logo</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ej: Un logo con estilo de neón de los 80s..."
                      {...field}
                      className="text-center text-lg"
                    />
                  </FormControl>
                  <FormMessage className="text-center" />
                </FormItem>
              )}
            />
            <div className="flex justify-center">
              <Button type="submit" disabled={isLoading} size="lg">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando Magia...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generar Logo
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </form>
        <CardFooter className="flex-col items-center justify-center gap-4 pt-6">
            {isLoading && (
                 <div className="flex flex-col items-center justify-center p-8 rounded-lg bg-background/50 w-full min-h-[320px]">
                    <Loader2 className="h-16 w-16 animate-spin text-primary mb-4"/>
                    <p className="text-muted-foreground">La IA está dibujando, esto puede tardar un momento...</p>
                </div>
            )}
            {error && !isLoading && (
                <p className="text-destructive text-center">{error}</p>
            )}
            {result?.imageDataUri && !isLoading && (
              <div className="text-center space-y-4">
                <h4 className="font-semibold text-lg">¡Aquí está tu creación!</h4>
                <div className="relative w-80 h-80 mx-auto border-4 border-primary rounded-lg shadow-2xl">
                   <Image
                      src={result.imageDataUri}
                      alt="Logo generado por IA"
                      fill
                      sizes="320px"
                      className="rounded-md object-cover"
                    />
                </div>
                 <Button asChild>
                    <a href={result.imageDataUri} download="JokersLiveBand-Logo.png">
                        <Download className="mr-2" />
                        Descargar Logo
                    </a>
                </Button>
              </div>
            )}
        </CardFooter>
      </Form>
    </Card>
  );
}
