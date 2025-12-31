'use client';

/**
 * Widget : Témoignages Clients
 */

import { MessageSquare, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import type { WidgetProps } from '@/lib/dashboard/types';
import { SkeletonWidget } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { testimonialsAPI } from '@/lib/api/testimonials';
import { useEffect, useState } from 'react';

export function TestimonialsCarouselWidget({ }: WidgetProps) {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await testimonialsAPI.list();
        setTestimonials(data || []);
      } catch (error) {
        console.error('Error loading testimonials:', error);
        setTestimonials([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  useEffect(() => {
    if (testimonials.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
      }, 5000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [testimonials.length]);

  if (isLoading) {
    return <SkeletonWidget />;
  }

  if (testimonials.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Aucun témoignage"
        description="Les témoignages clients apparaîtront ici."
        variant="compact"
      />
    );
  }

  const currentTestimonial = testimonials[currentIndex];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center relative">
        {/* Previous button */}
        {testimonials.length > 1 && (
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
            className="absolute left-0 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors z-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Testimonial content */}
        <div className="flex-1 text-center px-8">
          {currentTestimonial.rating && (
            <div className="flex items-center justify-center gap-1 mb-3">
              {renderStars(currentTestimonial.rating)}
            </div>
          )}
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 italic line-clamp-4">
            "{(currentTestimonial.testimonial_fr || currentTestimonial.testimonial_en || currentTestimonial.testimonial || 'Aucun contenu')}"
          </p>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {currentTestimonial.contact_name || currentTestimonial.title || 'Client anonyme'}
            </p>
            {currentTestimonial.company_name && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {currentTestimonial.company_name}
              </p>
            )}
          </div>
        </div>

        {/* Next button */}
        {testimonials.length > 1 && (
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % testimonials.length)}
            className="absolute right-0 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors z-10"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Indicators */}
      {testimonials.length > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-blue-600 dark:bg-blue-400 w-6'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
