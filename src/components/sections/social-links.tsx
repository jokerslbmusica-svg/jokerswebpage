import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Facebook, Instagram } from "lucide-react";

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
);
  
const socialLinks = [
  { name: 'Facebook', icon: Facebook, url: 'https://www.facebook.com/JokersLiveBand' },
  { name: 'Instagram', icon: Instagram, url: 'https://www.instagram.com/Jokers.Live.Band' },
  { name: 'WhatsApp', icon: WhatsAppIcon, url: 'https://wa.me/523315463695' },
];

export function SocialLinks() {
  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl md:text-3xl text-center">Síguenos</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center items-center gap-4 md:gap-8">
        {socialLinks.map((link) => (
          <Button key={link.name} variant="ghost" size="icon" asChild className="transform hover:scale-110 hover:text-primary transition-transform">
            <a href={link.url} target="_blank" rel="noopener noreferrer" aria-label={`Visita nuestra página de ${link.name}`}>
              <link.icon className="w-8 h-8 md:w-10 md:h-10" />
            </a>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
