/**
 * i18n Components Showcase Page
 */

'use client';

import { PageHeader, PageContainer, Section } from '@/components/layout';
import { Card } from '@/components/ui';
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';
import LocaleSwitcher from '@/components/i18n/LocaleSwitcher';
import RTLProvider from '@/components/i18n/RTLProvider';
import { useLocale } from 'next-intl';
import { isRTL } from '@/i18n/routing';

export default function I18nComponentsContent() {
  const locale = useLocale();
  const rtl = isRTL(locale as 'ar' | 'he' | 'en' | 'fr');

  return (
    <RTLProvider>
      <PageContainer>
        <PageHeader
          title="Composants d'Internationalisation"
          description="Composants pour la gestion des langues, locales et support RTL"
          breadcrumbs={[
            { label: 'Accueil', href: '/' },
            { label: 'Composants', href: '/components' },
            { label: 'Internationalisation' },
          ]}
        />

        <div className="space-y-8 mt-8">
          <Section title="Language Switcher">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-4">
                LanguageSwitcher allows users to switch between available languages. It uses window.location for navigation.
              </p>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Current Language:</span>
                <LanguageSwitcher />
              </div>
            </Card>
          </Section>

          <Section title="Locale Switcher">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-4">
                LocaleSwitcher is an alternative implementation using Next.js router for navigation.
              </p>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Current Locale:</span>
                <LocaleSwitcher />
              </div>
            </Card>
          </Section>

          <Section title="RTL Provider">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-4">
                RTLProvider automatically handles Right-to-Left layout for Arabic and Hebrew languages.
              </p>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Current Locale: {locale}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    RTL Mode: {rtl ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm">
                    {rtl
                      ? 'هذا النص يظهر من اليمين إلى اليسار عندما يكون الوضع RTL مفعلاً'
                      : 'This text appears left-to-right when RTL mode is disabled'}
                  </p>
                </div>
              </div>
            </Card>
          </Section>

          <Section title="Supported Locales">
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">LTR Languages</h4>
                  <ul className="space-y-2 text-sm">
                    <li>🇬🇧 English (en)</li>
                    <li>🇫🇷 French (fr)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">RTL Languages</h4>
                  <ul className="space-y-2 text-sm">
                    <li>🇸🇦 Arabic (ar)</li>
                    <li>🇮🇱 Hebrew (he)</li>
                  </ul>
                </div>
              </div>
            </Card>
          </Section>

          <Section title="Usage Example">
            <Card className="p-6">
              <pre className="bg-foreground text-background p-4 rounded-lg overflow-x-auto text-sm">
                <code>{`import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';
import RTLProvider from '@/components/i18n/RTLProvider';

export default function MyPage() {
  return (
    <RTLProvider>
      <div>
        <LanguageSwitcher />
        {/* Your content */}
      </div>
    </RTLProvider>
  );
}`}</code>
              </pre>
            </Card>
          </Section>
        </div>
      </PageContainer>
    </RTLProvider>
  );
}

