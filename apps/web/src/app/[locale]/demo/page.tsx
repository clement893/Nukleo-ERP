'use client';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';

export default function DemoPage() {
  return (
    <Container>
      <div className="py-8">
        <Card className="p-6">
          <h1 className="text-3xl font-bold mb-4">Demo Project</h1>
          <p className="text-muted-foreground mb-4">
            Cette page de démonstration publique est accessible à l'URL <code>/fr/demo</code>
          </p>
          <p className="text-muted-foreground mb-4">
            Cette version ne nécessite pas d'authentification, contrairement à la version du dashboard.
          </p>
          <div className="mt-6 p-4 bg-primary/10 rounded-lg">
            <p className="text-sm">
              ✅ La route publique a été créée avec succès dans <code>apps/web/src/app/[locale]/demo/page.tsx</code>
            </p>
            <p className="text-sm mt-2">
              🔓 Cette page est accessible sans authentification
            </p>
          </div>
        </Card>
      </div>
    </Container>
  );
}
