import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, DollarSign } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ServiceCardProps {
  service: {
    name: string;
    duration: string;
    price: string;
    description?: string;
  };
  primaryColor?: string;
  onBook?: () => void;
}

export const ServiceCard = ({ service, primaryColor, onBook }: ServiceCardProps) => {
  const { t } = useTranslation();
  return (
    <Card className="group hover:shadow-elevated transition-all duration-300 border-2 hover:border-primary/20">
      <CardHeader>
        <CardTitle className="text-xl">{service.name}</CardTitle>
        {service.description && (
          <CardDescription className="text-sm">{service.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">{service.duration}</span>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="text-2xl font-bold text-foreground">{service.price}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          style={primaryColor ? { backgroundColor: primaryColor } : {}}
          onClick={onBook}
        >
          {t('booking.services.book_btn')}
        </Button>
      </CardFooter>
    </Card>
  );
};
