import Link from 'next/link';
import Button from '../ui/Button';

export default function CTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Prêt à démarrer votre projet ?
          </h2>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Rejoignez des milliers de développeurs qui utilisent ce template 
            pour créer des applications modernes et performantes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" variant="primary">
                Créer un compte gratuit
              </Button>
            </Link>
            <Link href="https://github.com/clement893/MODELE-NEXTJS-FULLSTACK" target="_blank">
              <Button size="lg" variant="outline">
                Voir sur GitHub
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

