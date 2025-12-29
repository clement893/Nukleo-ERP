'use client';

import Link from 'next/link';
import { Card, Button, Badge } from '@/components/ui';
import { PageHeader, PageContainer, Section } from '@/components/layout';

const designStyles = [
  {
    id: 'modern-minimal',
    title: 'Modern Minimal',
    description: 'Clean, spacious design with subtle colors and ample whitespace',
    preview: 'Minimalist aesthetic with focus on content',
    color: 'bg-gray-100 dark:bg-gray-800',
    accent: 'text-gray-700 dark:text-gray-300',
  },
  {
    id: 'glassmorphism',
    title: 'Glassmorphism',
    description: 'Frosted glass effects with backdrop blur and transparency',
    preview: 'Modern glass-like surfaces with depth',
    color: 'bg-blue-50 dark:bg-blue-900/20',
    accent: 'text-blue-700 dark:text-blue-300',
  },
  {
    id: 'neon-cyberpunk',
    title: 'Neon Cyberpunk',
    description: 'Bold neon colors, glowing effects, and futuristic aesthetics',
    preview: 'Vibrant neon accents with dark backgrounds',
    color: 'bg-purple-900 dark:bg-black',
    accent: 'text-purple-400 dark:text-purple-300',
  },
  {
    id: 'corporate-professional',
    title: 'Corporate Professional',
    description: 'Traditional business design with conservative colors and layouts',
    preview: 'Professional and trustworthy appearance',
    color: 'bg-slate-50 dark:bg-slate-900',
    accent: 'text-slate-700 dark:text-slate-300',
  },
  {
    id: 'playful-colorful',
    title: 'Playful Colorful',
    description: 'Bright, energetic colors with rounded corners and playful elements',
    preview: 'Fun and engaging design with vibrant colors',
    color: 'bg-gradient-to-br from-pink-50 to-yellow-50 dark:from-pink-900/20 dark:to-yellow-900/20',
    accent: 'text-pink-700 dark:text-pink-300',
  },
];

export default function ThemeShowcaseContent() {
  return (
    <PageContainer>
      <PageHeader
        title="Theme Design Showcase"
        description="Explore 5 different design styles showcasing the flexibility of our theme system"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Components', href: '/components' },
          { label: 'Theme Showcase' },
        ]}
      />

      <Section title="Design Styles">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {designStyles.map((style) => (
            <Link
              key={style.id}
              href={`/components/theme-showcase/${style.id}`}
              className="block group"
            >
              <Card className="h-full transition-all duration-300 hover:shadow-lg hover:scale-105">
                <div className={`${style.color} p-6 rounded-t-lg`}>
                  <div className="h-32 flex items-center justify-center">
                    <Badge variant="default" className="text-lg px-4 py-2">
                      {style.title}
                    </Badge>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className={`text-xl font-semibold mb-2 ${style.accent} group-hover:text-primary transition-colors`}>
                    {style.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {style.description}
                  </p>
                  <p className="text-sm text-muted-foreground italic">
                    {style.preview}
                  </p>
                  <div className="mt-4">
                    <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      View Design →
                    </Button>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="About Theme System">
        <Card>
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Our theme system allows you to create completely different visual designs by customizing:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>Colors and color palettes</li>
              <li>Typography (fonts, sizes, weights)</li>
              <li>Spacing and layout systems</li>
              <li>Component sizes and variants</li>
              <li>Visual effects (glassmorphism, shadows, gradients)</li>
              <li>Animations and transitions</li>
            </ul>
            <p className="text-sm text-muted-foreground pt-4 border-t border-border">
              Each design page demonstrates how the same components can look completely different with theme customization.
            </p>
          </div>
        </Card>
      </Section>
    </PageContainer>
  );
}
