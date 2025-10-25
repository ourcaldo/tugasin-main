"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface SupplementalContentProps {
  htmlContent: string;
  title?: string;
}

export default function SupplementalContent({ htmlContent, title }: SupplementalContentProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {title && (
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8 text-center">
            {title}
          </h2>
        )}
        
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="relative">
            <div 
              className={`prose prose-lg max-w-none p-8 ${!isExpanded ? 'max-h-[400px] overflow-hidden' : ''}`}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
            
            {!isExpanded && (
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            )}
          </div>
          
          <div className="p-6 bg-gray-50 border-t border-gray-200 text-center">
            <Button
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
              className="gap-2"
            >
              {isExpanded ? (
                <>
                  Tampilkan Lebih Sedikit <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  Baca Selengkapnya <ChevronDown className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
        
        <noscript>
          <div 
            className="prose prose-lg max-w-none p-8 bg-white rounded-lg shadow-sm mt-4"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </noscript>
      </div>
    </section>
  );
}
