import ButtonLink from '../ui/ButtonLink';

export default function CTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Prêt à démarrer votre projet ?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
            Rejoignez des milliers de développeurs qui utilisent ce template 
            pour créer des applications modernes et performantes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ButtonLink href="/components" size="lg" variant="primary">
              Explorer les composants
            </ButtonLink>
            <ButtonLink href="/auth/register" size="lg" variant="secondary">
              Créer un compte gratuit
            </ButtonLink>
            <ButtonLink href="https://github.com/clement893/MODELE-NEXTJS-FULLSTACK" target="_blank" size="lg" variant="outline">
              Voir sur GitHub
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

