
"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
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
  updateFanCommentsStatus,
  type FanComment,
} from "@/app/actions"; // getFanComments is now paginated
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
import { Checkbox } from "../ui/checkbox";


const commentSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres.").max(50),
  comment: z.string().min(5, "El comentario debe tener al menos 5 caracteres.").max(500),
});

type CommentFormValues = z.infer<typeof commentSchema>;

interface FanCommentsProps {
    readOnly?: boolean;
}

interface PaginatedComments {
    items: FanComment[];
    cursor?: string;
    hasMore: boolean;
}

export function FanComments({ readOnly = false }: FanCommentsProps) {
  const [comments, setComments] = useState<FanComment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [selectedPending, setSelectedPending] = useState<string[]>([]);
  const [selectedApproved, setSelectedApproved] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [paginatedApproved, setPaginatedApproved] = useState<PaginatedComments>({ items: [], hasMore: true });
  const [paginatedPending, setPaginatedPending] = useState<PaginatedComments>({ items: [], hasMore: true });
  const [isFetchingMoreApproved, setIsFetchingMoreApproved] = useState(false);
  const [isFetchingMorePending, setIsFetchingMorePending] = useState(false);
  const COMMENTS_PER_PAGE = readOnly ? 5 : 10;
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
  });
  
  const pendingComments = useMemo(() => paginatedPending.items, [paginatedPending]);
  const approvedComments = useMemo(() => paginatedApproved.items, [paginatedApproved]);

  const fetchPaginatedComments = async (status: 'approved' | 'pending', cursor?: string) => {
    const isFetchingMore = !!cursor;
    if (status === 'approved') {
        isFetchingMore ? setIsFetchingMoreApproved(true) : setIsFetching(true);
    } else {
        isFetchingMore ? setIsFetchingMorePending(true) : setIsFetching(true);
    }

    try {
      const { comments: newComments, nextCursor, hasMore } = await getFanComments({ limit: COMMENTS_PER_PAGE, startAfter: cursor, status });
      if (status === 'approved') {
        setPaginatedApproved(prev => ({
            items: isFetchingMore ? [...prev.items, ...newComments] : newComments,
            cursor: nextCursor,
            hasMore: hasMore,
        }));
      } else {
        setPaginatedPending(prev => ({
            items: isFetchingMore ? [...prev.items, ...newComments] : newComments,
            cursor: nextCursor,
            hasMore: hasMore,
        }));
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los comentarios." });
    } finally {
        if (status === 'approved') setIsFetchingMoreApproved(false);
        if (status === 'pending') setIsFetchingMorePending(false);
        if (!isFetchingMore) setIsFetching(false);
    }
  }

  useEffect(() => {
    fetchPaginatedComments('approved');
    if (!readOnly) fetchPaginatedComments('pending');
  }, []);

  const onSubmit = async (data: CommentFormValues) => {
    setIsSubmitting(true);
    try {
      await addFanComment(data);
      toast({ title: "¡Gracias!", description: "Tu comentario ha sido enviado y está pendiente de aprobación." });
      reset();
      // No need to fetch comments here on the public page, as it won't be visible yet.
      if (!readOnly) {
        fetchPaginatedComments('pending');
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
      fetchPaginatedComments('pending');
      fetchPaginatedComments('approved');
    } catch (error) {
      toast({ variant: "destructive", title: "Error al Aprobar", description: "No se pudo aprobar el comentario." });
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteFanComment(commentId);
      toast({ title: "Eliminado", description: "El comentario ha sido eliminado." });
      fetchPaginatedComments('pending');
      fetchPaginatedComments('approved');
    } catch (error) {
      toast({ variant: "destructive", title: "Error al eliminar", description: "No se pudo eliminar el comentario." });
    }
  };

  const handleBulkAction = (commentIds: string[], status: 'approved' | 'deleted') => {
    if (commentIds.length === 0) return;
    startTransition(async () => {
      const result = await updateFanCommentsStatus(commentIds, status);
      if (result.success) {
        toast({
          title: "¡Éxito!",
          description: `Se han ${status === 'approved' ? 'aprobado' : 'eliminado'} los comentarios seleccionados.`
        });
        fetchPaginatedComments('pending');
        fetchPaginatedComments('approved');
        if (status === 'approved') setSelectedPending([]);
        setSelectedApproved([]);
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    });
  };

  const CommentList = ({ 
    list, 
    title, 
    emptyMessage, 
    showAdminControls, 
    selectedIds, 
    setSelectedIds,
    hasMore,
    cursor,
    isFetchingMore,
    onLoadMore
  }: { 
    list: FanComment[], title: string, emptyMessage: string, showAdminControls: boolean, selectedIds?: string[], setSelectedIds?: React.Dispatch<React.SetStateAction<string[]>>, hasMore: boolean, cursor?: string, isFetchingMore: boolean, onLoadMore: (cursor?: string) => void 
  }) => {
    const isPendingList = title.includes("Pendientes");

    const handleSelectAll = (checked: boolean) => {
        setSelectedIds?.(checked ? list.map(c => c.id) : []);
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        setSelectedIds?.(prev => checked ? [...prev, id] : prev.filter(pId => pId !== id));
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                    {isPendingList ? <Clock className="w-6 h-6 text-yellow-500" /> : <CheckCircle className="w-6 h-6 text-green-500" />}
                    {title}
                    <Badge variant="secondary">{list.length}</Badge>
                </h3>
                {showAdminControls && selectedIds && selectedIds.length > 0 && (
                    <div className="flex gap-2">
                        {isPendingList && (
                            <Button size="sm" variant="outline" onClick={() => handleBulkAction(selectedIds, 'approved')} disabled={isPending}>
                                <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Aprobar ({selectedIds.length})
                            </Button>
                        )}
                        <Button size="sm" variant="destructive" onClick={() => handleBulkAction(selectedIds, 'deleted')} disabled={isPending}>
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar ({selectedIds.length})
                        </Button>
                    </div>
                )}
            </div>
            {isFetching && readOnly ? (
                <div className="flex justify-center items-center h-20">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : list.length > 0 ? (
                <div className="space-y-2">
                    {showAdminControls && setSelectedIds && (
                        <div className="flex items-center p-2 border-b border-muted">
                            <Checkbox
                                id={`select-all-${isPendingList ? 'pending' : 'approved'}`}
                                checked={selectedIds?.length === list.length && list.length > 0}
                                onCheckedChange={handleSelectAll}
                            />
                            <label htmlFor={`select-all-${isPendingList ? 'pending' : 'approved'}`} className="ml-3 text-sm font-medium">Seleccionar todo</label>
                        </div>
                    )}
                    {list.map(comment => (
                        <div key={comment.id} className="p-4 bg-background/50 rounded-lg shadow-sm flex items-start gap-4">
                            {showAdminControls && setSelectedIds && (
                                <Checkbox id={comment.id} checked={selectedIds?.includes(comment.id)} onCheckedChange={(checked) => handleSelectOne(comment.id, !!checked)} />
                            )}
                            <div className="flex-grow">
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
                    ))}
                </div>
            ) : (
                <p className="text-center text-muted-foreground py-4">{emptyMessage}</p>
            )}
            {hasMore && (
                <div className="mt-4 flex justify-center">
                    <Button variant="outline" onClick={() => onLoadMore(cursor)} disabled={isFetchingMore}>
                        {isFetchingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Cargar más
                    </Button>
                </div>
            )}
        </div>
    );
  };

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
                    hasMore={paginatedApproved.hasMore}
                    cursor={paginatedApproved.cursor}
                    isFetchingMore={isFetchingMoreApproved}
                    onLoadMore={() => fetchPaginatedComments('approved', paginatedApproved.cursor)}
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
                    {isPending && <div className="flex items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Procesando cambios...</div>}
                    <CommentList
                        list={pendingComments}
                        title="Comentarios Pendientes de Aprobación"
                        emptyMessage="No hay comentarios pendientes."
                        showAdminControls={true}
                        selectedIds={selectedPending}
                        setSelectedIds={setSelectedPending}
                        hasMore={paginatedPending.hasMore}
                        cursor={paginatedPending.cursor}
                        isFetchingMore={isFetchingMorePending}
                        onLoadMore={() => fetchPaginatedComments('pending', paginatedPending.cursor)}
                    />
                    <Separator />
                    <CommentList
                        list={approvedComments}
                        title="Comentarios Aprobados"
                        emptyMessage="No hay comentarios aprobados."
                        showAdminControls={true}
                        selectedIds={selectedApproved}
                        setSelectedIds={setSelectedApproved}
                        hasMore={paginatedApproved.hasMore}
                        cursor={paginatedApproved.cursor}
                        isFetchingMore={isFetchingMoreApproved}
                        onLoadMore={() => fetchPaginatedComments('approved', paginatedApproved.cursor)}
                    />
                </div>
            )
        )}
      </CardContent>
    </Card>
  );
}
