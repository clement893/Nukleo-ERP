import FeedbackContent from './FeedbackContent';

// Force dynamic rendering to avoid CSS file issues during build
export const dynamic = 'force-dynamic';

export default function FeedbackPage() {
  return <FeedbackContent />;
}
