/**
 * TestimonialForm Component
 * Form for creating and editing testimonials
 */

'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Textarea, Select } from '@/components/ui';
import { type Testimonial, type TestimonialCreate, type TestimonialUpdate } from '@/lib/api/reseau-testimonials';

interface TestimonialFormProps {
  testimonial?: Testimonial;
  onSubmit: (data: TestimonialCreate | TestimonialUpdate) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  companies: Array<{ id: number; name: string }>;
  contacts: Array<{ id: number; first_name: string; last_name: string }>;
}

export default function TestimonialForm({
  testimonial,
  onSubmit,
  onCancel,
  loading = false,
  companies,
  contacts,
}: TestimonialFormProps) {
  const [formData, setFormData] = useState<TestimonialCreate>({
    contact_id: null,
    company_id: null,
    title: null,
    testimonial_fr: null,
    testimonial_en: null,
    logo_url: null,
    logo_filename: null,
    language: null,
    is_published: 'draft',
    rating: null,
    contact_name: null,
    company_name: null,
  });

  useEffect(() => {
    if (testimonial) {
      setFormData({
        contact_id: testimonial.contact_id || null,
        company_id: testimonial.company_id || null,
        title: testimonial.title || null,
        testimonial_fr: testimonial.testimonial_fr || null,
        testimonial_en: testimonial.testimonial_en || null,
        logo_url: testimonial.logo_url || null,
        logo_filename: testimonial.logo_filename || null,
        language: testimonial.language || null,
        is_published: testimonial.is_published || 'draft',
        rating: testimonial.rating || null,
        contact_name: testimonial.contact_name || null,
        company_name: testimonial.company_name || null,
      });
    }
  }, [testimonial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleChange = (field: keyof TestimonialCreate, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value === '' ? null : value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Company */}
      <div>
        <label htmlFor="company_id" className="block text-sm font-medium mb-2">Entreprise</label>
        <Select
          id="company_id"
          value={formData.company_id?.toString() || ''}
          onChange={(e) => handleChange('company_id', e.target.value ? parseInt(e.target.value) : null)}
          options={[
            { label: 'Sélectionner une entreprise', value: '' },
            ...companies.map((company) => ({
              label: company.name,
              value: company.id.toString(),
            })),
          ]}
        />
      </div>

      {/* Contact */}
      <div>
        <label htmlFor="contact_id" className="block text-sm font-medium mb-2">Contact</label>
        <Select
          id="contact_id"
          value={formData.contact_id?.toString() || ''}
          onChange={(e) => handleChange('contact_id', e.target.value ? parseInt(e.target.value) : null)}
          options={[
            { label: 'Sélectionner un contact', value: '' },
            ...contacts.map((contact) => ({
              label: `${contact.first_name} ${contact.last_name}`,
              value: contact.id.toString(),
            })),
          ]}
        />
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-2">Titre</label>
        <Input
          id="title"
          value={formData.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Titre du témoignage"
        />
      </div>

      {/* Testimonial FR */}
      <div>
        <label htmlFor="testimonial_fr" className="block text-sm font-medium mb-2">Témoignage (Français)</label>
        <Textarea
          id="testimonial_fr"
          value={formData.testimonial_fr || ''}
          onChange={(e) => handleChange('testimonial_fr', e.target.value)}
          placeholder="Témoignage en français"
          rows={5}
        />
      </div>

      {/* Testimonial EN */}
      <div>
        <label htmlFor="testimonial_en" className="block text-sm font-medium mb-2">Témoignage (Anglais)</label>
        <Textarea
          id="testimonial_en"
          value={formData.testimonial_en || ''}
          onChange={(e) => handleChange('testimonial_en', e.target.value)}
          placeholder="Testimonial in English"
          rows={5}
        />
      </div>

      {/* Language */}
      <div>
        <label htmlFor="language" className="block text-sm font-medium mb-2">Langue</label>
        <Select
          id="language"
          value={formData.language || ''}
          onChange={(e) => handleChange('language', e.target.value || null)}
          options={[
            { label: 'Sélectionner une langue', value: '' },
            { label: 'Français', value: 'fr' },
            { label: 'Anglais', value: 'en' },
          ]}
        />
      </div>

      {/* Rating */}
      <div>
        <label htmlFor="rating" className="block text-sm font-medium mb-2">Note (1-5)</label>
        <Select
          id="rating"
          value={formData.rating?.toString() || ''}
          onChange={(e) => handleChange('rating', e.target.value ? parseInt(e.target.value) : null)}
          options={[
            { label: 'Aucune note', value: '' },
            { label: '1', value: '1' },
            { label: '2', value: '2' },
            { label: '3', value: '3' },
            { label: '4', value: '4' },
            { label: '5', value: '5' },
          ]}
        />
      </div>

      {/* Published Status */}
      <div>
        <label htmlFor="is_published" className="block text-sm font-medium mb-2">Statut de publication</label>
        <Select
          id="is_published"
          value={formData.is_published || 'draft'}
          onChange={(e) => handleChange('is_published', e.target.value)}
          options={[
            { label: 'Brouillon', value: 'draft' },
            { label: 'Publié', value: 'published' },
          ]}
        />
      </div>

      {/* Logo URL */}
      <div>
        <label htmlFor="logo_url" className="block text-sm font-medium mb-2">URL du logo</label>
        <Input
          id="logo_url"
          type="url"
          value={formData.logo_url || ''}
          onChange={(e) => handleChange('logo_url', e.target.value)}
          placeholder="https://..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Enregistrement...' : testimonial ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}
