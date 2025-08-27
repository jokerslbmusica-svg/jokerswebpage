"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getHashtagSuggestions } from "@/app/actions";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wand2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CopyButton } from "@/components/copy-button";

const formSchema = z.object({
  contentDescription: z.string().min(10, "Por favor, proporciona una descripción más detallada.").max(500),
  mediaType: z.enum(["photo", "video"], {
    required_error: "Debes seleccionar un tipo de medio.",
  }),
  bandName: z.string().min(1, "El nombre de la banda es obligatorio.").default("Jokers Live Band"),
});

export function HashtagGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{hashtags: string[]} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contentDescription: "",
      mediaType: "photo",
      bandName: "Jokers Live Band",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);
    const response = await getHashtagSuggestions(values);
    if (response.success) {
      // @ts-ignore
      setResult(response.data);
    } else {
      setError(response.error);
    }
    setIsLoading(false);
  }

  const handleCopyHashtags = () => {
    if (result && result.hashtags.length > 0) {
      const hashtagString = result.hashtags.join(' ');
      navigator.clipboard.writeText(hashtagString).then(() => {
        toast({
          title: "¡Copiados!",
          description: "Todos los hashtags han sido copiados a tu portapapeles.",
        });
      }).catch(err => {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron copiar los hashtags.",
        });
        console.error('Failed to copy hashtags: ', err);
      });
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl md:text-3xl flex items-center gap-2">
          <Wand2 className="w-8 h-8 text-primary" />
          Generador de Hashtags con IA
        </CardTitle>
        <CardDescription>
          Genera hashtags optimizados para tus publicaciones en redes sociales y maximiza su alcance.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="bandName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Banda</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: The Rolling Stones" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contentDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción del Contenido</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe la foto o el video. Ej: 'Una foto llena de energía de nuestro vocalista alcanzando una nota alta durante el final del concierto.'"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mediaType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Tipo de Medio</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="photo" />
                        </FormControl>
                        <FormLabel className="font-normal">Foto</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="video" />
                        </FormControl>
                        <FormLabel className="font-normal">Video</FormLabel>
                      </FormItem>
                    </RadioGroup>
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
                  Generando...
                </>
              ) : (
                "Sugerir Hashtags"
              )}
            </Button>
            {result && (
                <div className="w-full pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">Hashtags Sugeridos:</h4>
                    <Button variant="ghost" size="sm" onClick={handleCopyHashtags}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar Hashtags
                    </Button>
                  </div>
                    <div className="flex flex-wrap gap-2">
                        {result.hashtags.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-base px-3 py-1">{tag}</Badge>
                        ))}
                    </div>
                </div>
            )}
            {error && <p className="text-destructive mt-4">{error}</p>}
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
