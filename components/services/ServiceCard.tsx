import { CheckCircle, Clock, MessageCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import type { Service } from '@/lib/utils/types';

interface ServiceCardProps {
  service: Service;
}

export default function ServiceCard({ service }: ServiceCardProps) {
  return (
    <Card className={`relative p-6 hover:shadow-lg transition-shadow ${service.popular ? 'border-primary border-2' : ''}`}>
      {service.popular && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
          Paling Populer
        </Badge>
      )}
      <CardHeader className="p-0 mb-6">
        <div className="text-primary mb-4">{service.icon}</div>
        <CardTitle className="text-2xl">{service.title}</CardTitle>
        <p className="text-gray-600">{service.description}</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="mb-6">
          <div className="text-3xl font-bold text-primary mb-2">{service.price}</div>
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            {service.timeframe}
          </div>
        </div>
        
        <ul className="space-y-2 mb-6">
          {service.features.map((feature: string, idx: number) => (
            <li key={idx} className="flex items-start">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-600">{feature}</span>
            </li>
          ))}
        </ul>
        
        <Button className="w-full" variant={service.popular ? "default" : "outline"} asChild>
          <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer">
            <MessageCircle className="mr-2 h-4 w-4" />
            Konsultasi Sekarang
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}