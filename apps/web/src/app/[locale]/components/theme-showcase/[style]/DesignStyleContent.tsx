'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Button,
  Card,
  Input,
  Badge,
  Alert,
  Modal,
  Dropdown,
  Stack,
  Grid,
} from '@/components/ui';
import { PageHeader, PageContainer, Section, ExampleCard } from '@/components/layout';

const styleConfigs = {
  'modern-minimal': {
    title: 'Modern Minimal',
    description: 'Clean, spacious design with subtle colors and generous whitespace.',
    className: 'minimal-style',
    cardClass: 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800',
    buttonClass: 'bg-gray-900 dark:bg-white text-white dark:text-gray-900',
  },
  'glassmorphism': {
    title: 'Glassmorphism',
    description: 'Frosted glass effects with backdrop blur and transparency.',
    className: 'glassmorphism-style',
    cardClass: 'bg-white/10 dark:bg-gray-900/10 backdrop-blur-lg border-white/20',
    buttonClass: 'bg-white/20 dark:bg-white/10 backdrop-blur-sm border-white/30',
  },
  'neon-cyberpunk': {
    title: 'Neon Cyberpunk',
    description: 'Bold neon colors, glowing effects, and futuristic aesthetics.',
    className: 'neon-style',
    cardClass: 'bg-gray-900 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.5)]',
    buttonClass: 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.8)]',
  },
  'corporate-professional': {
    title: 'Corporate Professional',
    description: 'Traditional business aesthetic with structured layouts.',
    className: 'corporate-style',
    cardClass: 'bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-800',
    buttonClass: 'bg-blue-600 dark:bg-blue-700 text-white',
  },
  'playful-colorful': {
    title: 'Playful Colorful',
    description: 'Vibrant, energetic design with bold colors and playful interactions.',
    className: 'playful-style',
    cardClass: 'bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900 dark:to-purple-900 border-pink-300',
    buttonClass: 'bg-gradient-to-r from-pink-500 to-purple-500 text-white',
  },
};

interface DesignStyleContentProps {
  style: string;
}

export default function DesignStyleContent({ style }: DesignStyleContentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const config = styleConfigs[style as keyof typeof styleConfigs];

  if (!config) {
    return <div>Invalid style</div>;
  }

  // Style-specific background and wrapper classes
  const styleWrappers: Record<keyof typeof styleConfigs, string> = {
    'modern-minimal': 'bg-gray-50 dark:bg-gray-950 min-h-screen',
    'glassmorphism': 'bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 min-h-screen',
    'neon-cyberpunk': 'bg-gradient-to-br from-purple-900 via-black to-cyan-900 min-h-screen text-cyan-100',
    'corporate-professional': 'bg-blue-50 dark:bg-gray-900 min-h-screen',
    'playful-colorful': 'bg-gradient-to-br from-yellow-200 via-pink-300 to-purple-300 dark:from-purple-900 dark:via-pink-900 dark:to-yellow-900 min-h-screen',
  };

  const styleKey = style as keyof typeof styleConfigs;
  const wrapperClass = styleWrappers[styleKey] || '';

  return (
    <div className={`${config.className} ${wrapperClass} py-8`}>
      <PageContainer>
        <PageHeader
          title={config.title}
          description={config.description}
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Components', href: '/components' },
            { label: 'Theme Showcase', href: '/components/theme-showcase' },
            { label: config.title },
          ]}
        />

        <div className="space-y-8">
          {/* Buttons Section */}
          <Section title="Buttons">
            <Grid columns={{ mobile: 1, tablet: 2, desktop: 4 }} gap="normal">
              <ExampleCard title="Primary" className={config.cardClass}>
                <Button variant="primary" className={config.buttonClass}>
                  Primary Button
                </Button>
              </ExampleCard>
              <ExampleCard title="Secondary" className={config.cardClass}>
                <Button variant="secondary">Secondary</Button>
              </ExampleCard>
              <ExampleCard title="Outline" className={config.cardClass}>
                <Button variant="outline">Outline</Button>
              </ExampleCard>
              <ExampleCard title="Danger" className={config.cardClass}>
                <Button variant="danger">Danger</Button>
              </ExampleCard>
            </Grid>
          </Section>

          {/* Cards Section */}
          <Section title="Cards">
            <Grid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap="loose">
              <Card className={config.cardClass}>
                <h3 className="text-lg font-semibold mb-2">Card Title</h3>
                <p className="text-muted-foreground mb-4">
                  This card demonstrates the {config.title.toLowerCase()} design style.
                </p>
                <Button variant="primary" size="sm">
                  Action
                </Button>
              </Card>
              <Card className={config.cardClass}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Stats Card</h3>
                  <Badge variant="success">Active</Badge>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">1,234</div>
                  <div className="text-sm text-muted-foreground">Total Items</div>
                </div>
              </Card>
              <Card className={config.cardClass}>
                <h3 className="text-lg font-semibold mb-2">Feature Card</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Feature one</li>
                  <li>• Feature two</li>
                  <li>• Feature three</li>
                </ul>
              </Card>
            </Grid>
          </Section>

          {/* Forms Section */}
          <Section title="Forms">
            <Card className={config.cardClass}>
              <div className="space-y-4">
                <Input label="Email Address" placeholder="you@example.com" type="email" />
                <Input label="Password" placeholder="Enter password" type="password" />
                <div className="flex gap-2">
                  <Button variant="primary">Submit</Button>
                  <Button variant="secondary">Cancel</Button>
                </div>
              </div>
            </Card>
          </Section>

          {/* Badges & Alerts Section */}
          <Section title="Badges & Alerts">
            <Grid columns={{ mobile: 1, tablet: 2 }} gap="normal">
              <ExampleCard title="Badges" className={config.cardClass}>
                <Stack gapValue="0.5rem">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">Default</Badge>
                    <Badge variant="success">Success</Badge>
                    <Badge variant="warning">Warning</Badge>
                    <Badge variant="error">Error</Badge>
                    <Badge variant="info">Info</Badge>
                  </div>
                </Stack>
              </ExampleCard>
              <ExampleCard title="Alerts" className={config.cardClass}>
                <Stack gapValue="0.5rem">
                  <Alert variant="success" title="Success">
                    Operation completed successfully!
                  </Alert>
                  <Alert variant="warning" title="Warning">
                    Please review your settings.
                  </Alert>
                </Stack>
              </ExampleCard>
            </Grid>
          </Section>

          {/* Interactive Components Section */}
          <Section title="Interactive Components">
            <Grid columns={{ mobile: 1, tablet: 2 }} gap="normal">
              <ExampleCard title="Dropdown Menu" className={config.cardClass}>
                <Dropdown
                  trigger={<Button variant="primary" className={config.buttonClass}>Open Menu</Button>}
                  items={[
                    { label: 'Profile', onClick: () => {} },
                    { label: 'Settings', onClick: () => {} },
                    { divider: true },
                    { label: 'Logout', onClick: () => {}, variant: 'danger' },
                  ]}
                />
              </ExampleCard>
              <ExampleCard title="Modal" className={config.cardClass}>
                <Button variant="primary" className={config.buttonClass} onClick={() => setIsModalOpen(true)}>
                  Open Modal
                </Button>
                <Modal
                  isOpen={isModalOpen}
                  onClose={() => setIsModalOpen(false)}
                  title="Example Modal"
                  footer={
                    <>
                      <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button variant="primary" onClick={() => setIsModalOpen(false)}>
                        Confirm
                      </Button>
                    </>
                  }
                >
                  <p>This is a modal dialog demonstrating the {config.title.toLowerCase()} design style.</p>
                </Modal>
              </ExampleCard>
            </Grid>
          </Section>

          {/* Layout Components Section */}
          <Section title="Layout Components">
            <Card className={config.cardClass}>
              <h3 className="text-lg font-semibold mb-4">Stack Layout</h3>
              <Stack gapValue="1rem">
                <div className="p-4 bg-muted rounded">Item 1</div>
                <div className="p-4 bg-muted rounded">Item 2</div>
                <div className="p-4 bg-muted rounded">Item 3</div>
              </Stack>
            </Card>
          </Section>

          {/* Navigation */}
          <Section title="Navigation">
            <Card className={config.cardClass}>
              <div className="flex items-center justify-between">
                <Link href="/components/theme-showcase">
                  <Button variant="secondary">← Back to Showcase</Button>
                </Link>
                <div className="flex gap-2">
                  {Object.keys(styleConfigs).map((s) => (
                    <Link key={s} href={`/components/theme-showcase/${s}`}>
                      <Button
                        variant={s === style ? 'primary' : 'secondary'}
                        size="sm"
                      >
                        {styleConfigs[s as keyof typeof styleConfigs].title}
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>
            </Card>
          </Section>
        </div>
      </PageContainer>
    </div>
  );
}
