"use client";

import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';

interface Service {
  icon: React.ReactNode;
  title: string;
  description: string;
  price: string;
  popular: boolean;
}

interface ServicesSectionProps {
  services: Service[];
}

export default function ServicesSection({ services }: ServicesSectionProps) {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Layanan Kami
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Dari tugas kecil sampai project besar, semua bisa kami handle dengan profesional.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card key={index} className={`relative p-6 hover:shadow-lg transition-shadow ${service.popular ? 'border-primary border-2' : ''}`}>
              {service.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                  Paling Populer
                </Badge>
              )}
              <CardContent className="p-0">
                <div className="text-primary mb-4">{service.icon}</div>
                <h3 className="font-semibold text-xl mb-2">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <div className="text-2xl font-bold text-primary mb-4">{service.price}</div>
                <Button className="w-full" variant={service.popular ? "default" : "outline"}>
                  Pesan Sekarang
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}