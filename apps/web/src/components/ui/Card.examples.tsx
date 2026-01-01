/**
 * Card Component Examples
 * 
 * Examples demonstrating the new unified Card component with variants.
 * This file can be used for Storybook stories or documentation.
 */

import Card from './Card.v2';
import { Users, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import Button from './Button';

export function CardExamples() {
  return (
    <div className="space-y-8 p-8">
      <h1 className="text-3xl font-bold mb-8">Card Component Examples</h1>

      {/* Default Card */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Default Card</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Standard Card" subtitle="With subtitle">
            <p>This is a standard card with title and subtitle.</p>
          </Card>
          
          <Card title="Card with Footer" footer={<Button>Action</Button>}>
            <p>Card with footer actions.</p>
          </Card>
          
          <Card hover onClick={() => alert('Clicked!')}>
            <p>Clickable card with hover effect.</p>
          </Card>
        </div>
      </section>

      {/* Stats Cards */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Stats Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            variant="stats"
            statsTitle="Total Users"
            statsValue="1,234"
            statsChange={{ value: 12, type: 'increase', period: 'last month' }}
            statsIcon={<Users className="w-8 h-8" />}
          />
          
          <Card
            variant="stats"
            statsTitle="Revenue"
            statsValue="$45,678"
            statsChange={{ value: 5, type: 'decrease', period: 'last quarter' }}
            statsIcon={<TrendingUp className="w-8 h-8" />}
          />
          
          <Card
            variant="stats"
            statsTitle="Active Projects"
            statsValue={42}
          />
        </div>
      </section>

      {/* Status Cards */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Status Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            variant="status"
            statusTitle="System Online"
            statusDescription="All systems operational"
            status="success"
          />
          
          <Card
            variant="status"
            statusTitle="Warning"
            statusDescription="High CPU usage detected"
            status="warning"
          />
          
          <Card
            variant="status"
            statusTitle="Error"
            statusDescription="Database connection failed"
            status="error"
          />
          
          <Card
            variant="status"
            statusTitle="Info"
            statusDescription="New update available"
            status="info"
          />
        </div>
      </section>

      {/* Pricing Cards */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Pricing Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            variant="pricing"
            pricingName="Basic"
            pricingDescription="Perfect for individuals"
            pricingPrice={9}
            pricingCurrency="$"
            pricingInterval="/month"
            pricingFeatures={['Feature 1', 'Feature 2', 'Feature 3']}
            pricingButtonText="Get Started"
            pricingButtonAction={() => alert('Selected Basic')}
          />
          
          <Card
            variant="pricing"
            pricingName="Pro"
            pricingDescription="Perfect for teams"
            pricingPrice={29}
            pricingCurrency="$"
            pricingInterval="/month"
            pricingFeatures={['All Basic features', 'Feature 4', 'Feature 5', 'Priority Support']}
            pricingPopular={true}
            pricingButtonText="Get Started"
            pricingButtonAction={() => alert('Selected Pro')}
          />
          
          <Card
            variant="pricing"
            pricingName="Enterprise"
            pricingDescription="For large organizations"
            pricingPrice={99}
            pricingCurrency="$"
            pricingInterval="/month"
            pricingFeatures={['All Pro features', 'Feature 6', 'Feature 7', 'Dedicated Support']}
            pricingButtonText="Contact Sales"
            pricingButtonAction={() => alert('Contacted Sales')}
          />
        </div>
      </section>

      {/* Glassmorphism Cards */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Glassmorphism Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gradient-to-br from-blue-500 to-purple-600 p-8 rounded-lg">
          <Card variant="glass" title="Glass Card 1">
            <p>This card has a glassmorphism effect with backdrop blur.</p>
          </Card>
          
          <Card variant="glass" title="Glass Card 2" subtitle="With subtitle">
            <p>Perfect for overlays and modern designs.</p>
          </Card>
        </div>
      </section>

      {/* Other Variants */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Other Variants</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="elevated" title="Elevated Card">
            <p>Card with stronger shadow.</p>
          </Card>
          
          <Card variant="outlined" title="Outlined Card">
            <p>Card with border only, no background.</p>
          </Card>
          
          <Card variant="filled" title="Filled Card">
            <p>Card with filled background.</p>
          </Card>
        </div>
      </section>
    </div>
  );
}
