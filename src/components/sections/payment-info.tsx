import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/copy-button";

const paymentDetails = [
    { label: "Entidad", value: "NU MEXICO" },
    { label: "Titular de la Cuenta", value: "Javier Eusebio Melendez Garcia" },
    { label: "Número de Cuenta", value: "00016046664" },
    { label: "CLABE", value: "638180000160466643" },
];

export function PaymentInfo() {
  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl md:text-3xl">Pagos y Transferencias</CardTitle>
        <CardDescription>Envía pagos por nuestros servicios de forma segura.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4 text-sm">
            {paymentDetails.map(detail => (
                 <li key={detail.label} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-secondary/50 rounded-md">
                    <span className="font-semibold text-muted-foreground">{detail.label}</span>
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-foreground">{detail.value}</span>
                        <CopyButton textToCopy={detail.value} />
                    </div>
                </li>
            ))}
        </ul>
      </CardContent>
    </Card>
  );
}
