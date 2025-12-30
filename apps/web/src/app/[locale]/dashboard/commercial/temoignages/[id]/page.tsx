'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { testimonialsAPI, Testimonial } from '@/lib/api/testimonials';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { PageHeader, PageContainer } from '@/components/layout';
import { Loading, Alert, Card, Badge, Button } from '@/components/ui';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import MotionDiv from '@/components/motion/MotionDiv';

export default function TestimonialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [testimonial, setTestimonial] = useState<Testimonial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const testimonialId = params?.id ? parseInt(String(params.id)) : null;

  useEffect(() => {
    if (!testimonialId) {
      setError('ID de témoignage invalide');
      setLoading(false);
      return;
    }

    loadTestimonial();
  }, [testimonialId]);

  const loadTestimonial = async () => {
    if (!testimonialId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await testimonialsAPI.get(testimonialId);
      setTestimonial(data);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement du témoignage');
      showToast({
        message: appError.message || 'Erreur lors du chargement du témoignage',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (testimonial) {
      const locale = params?.locale as string || 'fr';
      router.push(`/${locale}/dashboard/commercial/temoignages/${testimonial.id}/edit`);
    }
  };

  const handleDelete = async () => {
    if (!testimonial || !confirm('Êtes-vous sûr de vouloir supprimer ce témoignage ?')) {
      return;
    }

    try {
      setDeleting(true);
      await testimonialsAPI.delete(testimonial.id);
      showToast({
        message: 'Témoignage supprimé avec succès',
        type: 'success',
      });
      const locale = params?.locale as string || 'fr';
      router.push(`/${locale}/dashboard/commercial/temoignages`);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la suppression');
      showToast({
        message: appError.message || 'Erreur lors de la suppression',
        type: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleBack = () => {
    const locale = params?.locale as string || 'fr';
    router.push(`/${locale}/dashboard/commercial/temoignages`);
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="py-12 text-center">
          <Loading />
        </div>
      </PageContainer>
    );
  }

  if (error || !testimonial) {
    return (
      <PageContainer>
        <Alert variant="error" title="Erreur">
          {error || 'Témoignage non trouvé'}
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la liste
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title={testimonial.title || 'Témoignage'}
        description={`Détails du témoignage${testimonial.company_name ? ` - ${testimonial.company_name}` : ''}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Commercial', href: '/dashboard/commercial' },
          { label: 'Témoignages', href: '/dashboard/commercial/temoignages' },
          { label: testimonial.title || 'Détail' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              <Trash2 className="w-4 h-4 mr-2" />
              {deleting ? 'Suppression...' : 'Supprimer'}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Testimonial content */}
          <Card>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Témoignage</h2>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="uppercase">
                    {testimonial.language || 'fr'}
                  </Badge>
                  <Badge variant={testimonial.is_published === 'true' ? 'default' : 'secondary'}>
                    {testimonial.is_published === 'true' ? 'Publié' : 'Non publié'}
                  </Badge>
                  {testimonial.rating && (
                    <Badge variant="default">
                      {testimonial.rating}/5
                    </Badge>
                  )}
                </div>
              </div>

              {testimonial.testimonial_fr && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Témoignage en français</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{testimonial.testimonial_fr}</p>
                </div>
              )}

              {testimonial.testimonial_en && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Testimonial in English</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{testimonial.testimonial_en}</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Company info */}
          {testimonial.company_name && (
            <Card>
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-semibold">Entreprise</h3>
                <div>
                  <p className="text-sm text-muted-foreground">Nom</p>
                  <p className="font-medium">{testimonial.company_name}</p>
                </div>
                {testimonial.logo_url && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Logo</p>
                    <img
                      src={testimonial.logo_url}
                      alt={testimonial.company_name || 'Logo'}
                      className="w-32 h-32 object-contain"
                    />
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Contact info */}
          {testimonial.contact_name && (
            <Card>
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-semibold">Contact</h3>
                <div>
                  <p className="text-sm text-muted-foreground">Nom</p>
                  <p className="font-medium">{testimonial.contact_name}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-semibold">Informations</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Créé le</p>
                  <p className="font-medium">
                    {new Date(testimonial.created_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Modifié le</p>
                  <p className="font-medium">
                    {new Date(testimonial.updated_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </MotionDiv>
  );
}
