
import React, { useState, useLayoutEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, List } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardHeader } from './card';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  contentRef?: React.RefObject<HTMLDivElement>;
}

// Utility function to generate slug from text
const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

export function TableOfContents({ content, contentRef }: TableOfContentsProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [tocItems, setTocItems] = useState<TocItem[]>([]);

  useLayoutEffect(() => {
    const processHeadings = () => {
      // Use the passed ref or fallback to querySelector
      const contentContainer = contentRef?.current || document.querySelector('.prose');
      
      if (!contentContainer) {
        setTocItems([]);
        return;
      }

      // Get headings from the actual rendered content container only
      const actualHeadings = contentContainer.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const slugCounter = new Map<string, number>();
      
      const items: TocItem[] = Array.from(actualHeadings).map((heading) => {
        const level = parseInt(heading.tagName.substring(1));
        const text = heading.textContent || '';
        const baseSlug = generateSlug(text);
        
        // Handle duplicate slugs by adding a counter
        const count = slugCounter.get(baseSlug) || 0;
        slugCounter.set(baseSlug, count + 1);
        const id = count === 0 ? `toc-${baseSlug}` : `toc-${baseSlug}-${count}`;
        
        // Only set ID if heading doesn't already have one
        if (!heading.id) {
          heading.id = id;
        } else {
          // Use existing ID but update our item to match
          return { id: heading.id, text, level };
        }
        
        return { id, text, level };
      });

      setTocItems(items);
    };

    // Try immediately
    processHeadings();
    
    // Also try after a short delay in case content is still loading
    const timer = setTimeout(processHeadings, 100);

    return () => clearTimeout(timer);
  }, [content, contentRef]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Account for any fixed headers
      const y = element.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({
        top: y,
        behavior: 'smooth'
      });
    }
  };

  if (tocItems.length === 0) {
    return null;
  }

  return (
    <div className="toc w-full" style={{ textAlign: 'left' }}>
      <Card className="w-full">
        <CardHeader className="pb-3">
          <Button
            variant="ghost"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="justify-between p-0 h-auto font-semibold text-gray-900 hover:bg-transparent w-full text-left"
          >
            <div className="flex items-center">
              <List className="h-5 w-5 mr-2" />
              Daftar Isi
            </div>
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CardHeader>

        {!isCollapsed && (
          <CardContent className="pt-0" style={{ textAlign: 'left' }}>
            <div className="w-full" style={{ textAlign: 'left' }}>
              <ol className="list-none p-0 m-0" style={{ textAlign: 'left' }}>
                {tocItems.map((item, index) => (
                  <li 
                    key={index} 
                    className="m-0 p-0"
                    style={{
                      textAlign: 'left',
                      marginLeft: item.level === 1 ? '0px' : 
                                 item.level === 2 ? '20px' : 
                                 item.level === 3 ? '40px' : 
                                 item.level === 4 ? '60px' : '80px',
                      marginBottom: item.level === 1 ? '8px' : '4px'
                    }}
                  >
                    <button
                      onClick={() => scrollToHeading(item.id)}
                      className="block w-full text-left border-none bg-transparent cursor-pointer rounded transition-colors duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      style={{
                        padding: '8px 12px',
                        fontSize: '14px',
                        lineHeight: '1.4',
                        color: item.level === 1 ? '#111827' : 
                               item.level === 2 ? '#1f2937' : 
                               item.level === 3 ? '#374151' : 
                               item.level === 4 ? '#4b5563' : '#6b7280',
                        fontWeight: item.level === 1 ? '600' : 'normal',
                        textAlign: 'left'
                      }}
                    >
                      {item.level === 1 && (
                        <span style={{ fontWeight: '600' }}>
                          {tocItems.filter((t, i) => i <= index && t.level === 1).length}. 
                        </span>
                      )}
                      {item.text}
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          </CardContent>
        )}
      </Card>
      
    </div>
  );
}
