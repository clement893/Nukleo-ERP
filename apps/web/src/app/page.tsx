import Hero from '@/components/sections/Hero';
import Features from '@/components/sections/Features';
import TechStack from '@/components/sections/TechStack';
import Stats from '@/components/sections/Stats';
import CTA from '@/components/sections/CTA';

export default function Home() {
  return (
    <main>
      <Hero />
      <Features />
      <TechStack />
      <Stats />
      <CTA />
    </main>
  );
}
