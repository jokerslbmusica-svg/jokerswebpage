"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getBio, saveBandBio } from "@/app/actions/band-info.actions";
import { tones } from "@/config/band-constants";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Wand2, PlusCircle, Trash2, FileText, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CopyButton } from "@/components/copy-button";

const formSchema = z.object({
  bandName: z.string().min(1, "El nombre de la banda es obligatorio.").default("Jokers Live Band"),
  keyPoints: z.array(z.object({ value: z.string().min(3, "El punto clave debe tener al menos 3 caracteres.") })).min(1, "Debes añadir al menos un punto clave."),
  tone: z.enum(tones, {
    required_error: "Debes seleccionar un tono para la biografía.",
  }),
});

export function BioGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<{biography: string} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bandName: "Jokers Live Band",
      keyPoints: [{ value: "Banda de rock con covers de los 80s y 90s" }],
      tone: "Energetic",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "keyPoints",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsGenerating(true);
    setResult(null);
    setError(null);
    
    const input = {
      ...values,
      keyPoints: values.keyPoints.map(p => p.value),
    };

    const response = await getBio(input);
    if (response.success) {
      // @ts-ignore
      setResult(response.data);
    } else {
      setError(response.error);
      toast({
          variant: "destructive",
          title: "Error de Generación",
          description: response.error,
      });
    }
    setIsGenerating(false);
  }

  async function handleSaveBio() {
    if (!result?.biography) return;
    setIsSaving(true);
    try {
        await saveBandBio(result.biography);
        toast({
            title: "¡Biografía Guardada!",
            description: "La biografía ha sido guardada como la oficial.",
        });
    } catch (e) {
        toast({
            variant: "destructive",
            title: "Error al Guardar",
            description: "No se pudo guardar la biografía. Inténtalo de nuevo.",
        });
    } finally {
        setIsSaving(false);
    }
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl md:text-3xl flex items-center gap-2">
          <FileText className="w-8 h-8 text-primary" />
          Generador de Biografías con IA
        </CardTitle>
        <CardDescription>
          Crea biografías profesionales para la banda y guárdala como la oficial.
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
            
            <div>
              <FormLabel>Puntos Clave</FormLabel>
              <div className="space-y-2 mt-2">
                {fields.map((field, index) => (
                  <FormField
                    key={field.id}
                    control={form.control}
                    name={`keyPoints.${index}.value`}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                           <Input {...field} placeholder={`Punto clave #${index + 1}`} />
                           <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                             <Trash2 className="h-4 w-4" />
                           </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ value: "" })}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Punto Clave
              </Button>
            </div>

            <FormField
              control={form.control}
              name="tone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tono de la Biografía</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tono" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tones.map(tone => (
                        <SelectItem key={tone} value={tone}>{tone}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex-col items-start gap-4">
            <Button type="submit" disabled={isGenerating} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generar Biografía
                </>
              )}
            </Button>
            {result && (
                <div className="w-full pt-4 space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="font-semibold">Biografía Generada:</h4>
                        <CopyButton textToCopy={result.biography} />
                    </div>
                    <div className="p-4 bg-secondary/50 rounded-md whitespace-pre-wrap">
                        <p>{result.biography}</p>
                    </div>
                    <Button onClick={handleSaveBio} disabled={isSaving} variant="outline">
                       {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Guardar como Biografía Oficial
                            </>
                        )}
                    </Button>
                </div>
            )}
            {error && !result && <p className="text-destructive mt-4">{error}</p>}
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
