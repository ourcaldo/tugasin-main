import { Star } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import type { Testimonial } from '@/lib/utils/types';

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export default function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <Card className="p-6">
      <CardContent className="p-0">
        <div className="flex mb-4">
          {[...Array(testimonial.rating)].map((_, i) => (
            <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
          ))}
        </div>
        <p className="text-gray-600 mb-4 italic">"{testimonial.text}"</p>
        <div>
          <div className="font-semibold">{testimonial.name}</div>
          <div className="text-sm text-gray-500">{testimonial.university}</div>
        </div>
      </CardContent>
    </Card>
  );
}