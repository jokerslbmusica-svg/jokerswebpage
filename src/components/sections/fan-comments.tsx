
"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  addFanComment,
  getFanComments,
  deleteFanComment,
  approveFanComment,
  type FanComment,
} from "@/app/actions/fan-comments.actions";
import { Loader2, MessageSquare, Send, Trash2, CheckCircle, Clock } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";


const commentSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres.").max(50),
  comment: z.string().min(5, "El comentario debe tener al menos 5 caracteres.").max(500),
});

type CommentFormValues = z.infer<typeof commentSchema>;

interface FanCommentsProps {
    readOnly?: boolean;
}

export function FanComments({ readOnly = false }: FanCommentsProps) {
  const [comments, setComments] = useState<FanComment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
  });
  
  const pendingComments = useMemo(() => comments.filter(c => c.status === 'pending'), [comments]);
  const approvedComments = useMemo(() => comments.filter(c => c.status === 'approved'), [comments]);

  async function fetchComments() {
    setIsFetching(true);
    try {
      const fanComments = await getFanComments();
      setComments(fanComments);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los comentarios." });
    } finally {
      setIsFetching(false);
    }
  }

  useEffect(() => {
    fetchComments();
  }, []);

  const onSubmit = async (data: CommentFormValues) => {
    setIsSubmitting(true);
    try {
      await addFanComment(data);
      toast({ title: "¡Gracias!", description: "Tu comentario ha sido enviado y está pendiente de aprobación." });
      reset();
      // No need to fetch comments here on the public page, as it won't be visible yet.
      if (!readOnly) {
        fetchComments();
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo publicar tu comentario." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (commentId: string) => {
    try {
      await approveFanComment(commentId);
      toast({ title: "Aprobado", description: "El comentario ahora es público." });
      fetchComments(); // Refresh comments list
    } catch (error) {
      toast({ variant: "destructive", title: "Error al Aprobar", description: "No se pudo aprobar el comentario." });
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteFanComment(commentId);
      toast({ title: "Eliminado", description: "El comentario ha sido eliminado." });
      fetchComments(); // Refresh comments list
    } catch (error) {
      toast({ variant: "destructive", title: "Error al eliminar", description: "No se pudo eliminar el comentario." });
    }
  };

  const CommentList = ({ list, title, emptyMessage, showAdminControls }: { list: FanComment[], title: string, emptyMessage: string, showAdminControls: boolean }) => (
    <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            {title === "Comentarios Pendientes de Aprobación" ? <Clock className="w-6 h-6 text-yellow-500" /> : <CheckCircle className="w-6 h-6 text-green-500" />}
            {title}
            <Badge variant="secondary">{list.length}</Badge>
        </h3>
        {isFetching && readOnly ? (
             <div className="flex justify-center items-center h-20">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : list.length > 0 ? list.map(comment => (
            <div key={comment.id} className="p-4 mb-2 bg-background/50 rounded-lg shadow-sm flex justify-between items-start">
                <div>
                    <p className="font-bold text-primary">{comment.name}</p>
                    <p className="text-foreground my-1">"{comment.comment}"</p>
                    <p className="text-xs text-muted-foreground">{comment.createdAt}</p>
                </div>
                {showAdminControls && comment.id && (
                    <div className="flex items-center gap-2">
                        {comment.status === 'pending' && (
                            <Button variant="outline" size="sm" onClick={() => handleApprove(comment.id!)}>
                                <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Aprobar
                            </Button>
                        )}
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4"/></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Esto eliminará permanentemente el comentario.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => comment.id && handleDelete(comment.id)}>Confirmar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </div>
        )) : (
            <p className="text-center text-muted-foreground py-4">{emptyMessage}</p>
        )}
    </div>
  );


  return (
    <Card className="w-full shadow-lg bg-secondary text-secondary-foreground">
      <CardHeader>
        <CardTitle className="font-headline text-2xl md:text-3xl flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-primary" />
            {readOnly ? "Libro de Visitas" : "Moderar Comentarios"}
        </CardTitle>
        <CardDescription className="text-secondary-foreground/80">
            {readOnly ? "Mira lo que otros fans dicen de nosotros." : "Aprueba o elimina los comentarios de los fans."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {readOnly && (
            <>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-8 p-4 border border-secondary-foreground/20 rounded-lg">
                    <h3 className="text-lg font-semibold">Deja tu mensaje</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1 space-y-2">
                            <label htmlFor="name">Tu Nombre</label>
                            <Input id="name" {...register("name")} className="text-foreground"/>
                            {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label htmlFor="comment">Tu Comentario</label>
                            <Textarea id="comment" {...register("comment")} className="text-foreground"/>
                            {errors.comment && <p className="text-destructive text-sm">{errors.comment.message}</p>}
                        </div>
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        {isSubmitting ? "Enviando..." : "Enviar Comentario"}
                    </Button>
                </form>
                 <CommentList 
                    list={approvedComments} 
                    title="Comentarios Aprobados"
                    emptyMessage="Todavía no hay comentarios. ¡Sé el primero en dejar un mensaje!"
                    showAdminControls={false}
                />
            </>
        )}
        
        {!readOnly && (
             isFetching ? (
                 <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <div className="space-y-8">
                    <CommentList
                        list={pendingComments}
                        title="Comentarios Pendientes de Aprobación"
                        emptyMessage="No hay comentarios pendientes."
                        showAdminControls={true}
                    />
                    <Separator />
                    <CommentList
                        list={approvedComments}
                        title="Comentarios Aprobados"
                        emptyMessage="No hay comentarios aprobados."
                        showAdminControls={true}
                    />
                </div>
            )
        )}
      </CardContent>
    </Card>
  );
}
