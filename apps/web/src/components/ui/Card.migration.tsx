/**
 * Card Migration Helpers
 * 
 * These are compatibility wrappers to help migrate from old components
 * to the new unified Card component with variants.
 * 
 * Usage:
 * ```tsx
 * // Old way
 * import StatsCard from '@/components/ui/StatsCard';
 * <StatsCard title="Users" value="1234" />
 * 
 * // New way (with migration helper)
 * import { StatsCard } from '@/components/ui/Card.migration';
 * <StatsCard title="Users" value="1234" />
 * 
 * // Eventually migrate to:
 * import Card from '@/components/ui/Card';
 * <Card variant="stats" statsTitle="Users" statsValue="1234" />
 * ```
 */

import Card from './Card.v2';
import type { StatusType } from './Card.v2';

/**
 * StatsCard - Migration helper for StatsCard component
 * 
 * @deprecated Use <Card variant="stats" /> instead
 */
export function StatsCard({
  title,
  value,
  change,
  icon,
  className,
  trend,
}: {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    period?: string;
  };
  icon?: React.ReactNode;
  className?: string;
  trend?: React.ReactNode;
}) {
  return (
    <Card
      variant="stats"
      statsTitle={title}
      statsValue={value}
      statsChange={change}
      statsIcon={icon}
      statsTrend={trend}
      className={className}
    />
  );
}

/**
 * StatusCard - Migration helper for StatusCard component
 * 
 * @deprecated Use <Card variant="status" /> instead
 */
export function StatusCard({
  title,
  description,
  status = 'success',
  className,
}: {
  title: string;
  description: string;
  status?: StatusType;
  className?: string;
}) {
  return (
    <Card
      variant="status"
      statusTitle={title}
      statusDescription={description}
      status={status}
      className={className}
    />
  );
}

/**
 * PricingCard - Migration helper for PricingCard component
 * 
 * @deprecated Use <Card variant="pricing" /> instead
 */
export function PricingCard({
  name,
  description,
  price,
  currency = '$',
  interval = '/month',
  features = [],
  popular = false,
  buttonText = 'Select Plan',
  onSelect,
  className,
}: {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  interval?: string;
  features?: string[];
  popular?: boolean;
  buttonText?: string;
  onSelect?: () => void;
  className?: string;
}) {
  return (
    <Card
      variant="pricing"
      pricingName={name}
      pricingDescription={description}
      pricingPrice={price}
      pricingCurrency={currency}
      pricingInterval={interval}
      pricingFeatures={features}
      pricingPopular={popular}
      pricingButtonText={buttonText}
      pricingButtonAction={onSelect}
      className={className}
    />
  );
}
