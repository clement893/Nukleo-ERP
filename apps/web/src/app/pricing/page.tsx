import { PricingSection } from '@/components/subscriptions/PricingSection';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing - Choose Your Plan',
  description: 'Select the perfect subscription plan for your needs',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PricingSection />
    </div>
  );
}

