"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getSocialPostSuggestion } from "@/app/actions/social-post.actions";
import { socialPlatforms } from "@/config/band-constants";
import type { GenerateSocialPostOutput } from "@/ai/flows/generate-social-post";

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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Wand2, MessageSquare, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CopyButton } from "@/components/copy-button";

const formSchema = z.object({
  topic: z.string().min(10, "El tema debe tener al menos 10 caracteres.").max(500),
  platform: z.enum(socialPlatforms),
  bandName: z.string().min(1, "El nombre de la banda es obligatorio.").default("Jokers Live Band"),
  flyer: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function SocialPostGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerateSocialPostOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      platform: "Instagram",
      bandName: "Jokers Live Band",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setResult(null);
    setError(null);
    
    const formData = new FormData();
    formData.append("topic", values.topic);
    formData.append("platform", values.platform);
    formData.append("bandName", values.bandName);
    if (values.flyer && values.flyer[0]) {
      formData.append("flyer", values.flyer[0]);
    }

    const response = await getSocialPostSuggestion(formData);

    if (response.success) {
      setResult(response.data);
    } else {
      setError(response.error);
      toast({
          variant: "destructive",
          title: "Error de Generación",
          description: response.error,
      });
    }
    setIsLoading(false);
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl md:text-3xl flex items-center gap-2">
          <MessageSquare className="w-8 h-8 text-primary" />
          Generador de Publicaciones para Redes Sociales
        </CardTitle>
        <CardDescription>
          Crea publicaciones para redes sociales sobre cualquier tema. Sube un flyer para que la IA extraiga los detalles.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
             <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tema Principal</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ej: Anuncio de nuestro próximo concierto en el bar 'El Gato Negro' este sábado."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Plataforma</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona una plataforma" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {socialPlatforms.map(platform => (
                            <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                    control={form.control}
                    name="flyer"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Flyer del Evento (Opcional)</FormLabel>
                            <FormControl>
                                <Input type="file" accept="image/*" {...form.register("flyer")} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                    />
            </div>
             <FormField
              control={form.control}
              name="bandName"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormLabel>Nombre de la Banda</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex-col items-start gap-4">
            <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando Publicación...
                </>
              ) : (
                <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generar Publicación
                </>
              )}
            </Button>
            {result && (
                <div className="w-full pt-4 space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="font-semibold">Publicación Generada:</h4>
                        <CopyButton textToCopy={result.postText} />
                    </div>
                    <div className="p-4 bg-secondary/50 rounded-md whitespace-pre-wrap">
                        <p>{result.postText}</p>
                    </div>
                </div>
            )}
            {error && !result && <p className="text-destructive mt-4">{error}</p>}
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
