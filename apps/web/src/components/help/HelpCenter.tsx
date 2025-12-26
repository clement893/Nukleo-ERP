/**
 * Help Center Component
 * 
 * Main hub for help and support resources.
 * 
 * @component
 */

'use client';

import { Card, Button } from '@/components/ui';
import { Link } from '@/i18n/routing';
import { HelpCircle, MessageSquare, BookOpen, Video, FileText, Search } from 'lucide-react';

export interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  color: string;
}

export interface HelpCenterProps {
  categories?: HelpCategory[];
  className?: string;
}

const defaultCategories: HelpCategory[] = [
  {
    id: 'faq',
    title: 'FAQ',
    description: 'Frequently asked questions and answers',
    icon: <HelpCircle className="w-6 h-6" />,
    link: '/help/faq',
    color: 'bg-primary-100 dark:bg-primary-900/40 border-primary-200 dark:border-primary-800',
  },
  {
    id: 'guides',
    title: 'User Guides',
    description: 'Step-by-step guides and tutorials',
    icon: <BookOpen className="w-6 h-6" />,
    link: '/help/guides',
    color: 'bg-secondary-100 dark:bg-secondary-900/40 border-secondary-200 dark:border-secondary-800',
  },
  {
    id: 'videos',
    title: 'Video Tutorials',
    description: 'Watch video tutorials and demos',
    icon: <Video className="w-6 h-6" />,
    link: '/help/videos',
    color: 'bg-info-100 dark:bg-info-900/40 border-info-200 dark:border-info-800',
  },
  {
    id: 'contact',
    title: 'Contact Support',
    description: 'Get in touch with our support team',
    icon: <MessageSquare className="w-6 h-6" />,
    link: '/help/contact',
    color: 'bg-success-100 dark:bg-success-900/40 border-success-200 dark:border-success-800',
  },
  {
    id: 'tickets',
    title: 'Support Tickets',
    description: 'View and manage your support tickets',
    icon: <FileText className="w-6 h-6" />,
    link: '/help/tickets',
    color: 'bg-warning-100 dark:bg-warning-900/40 border-warning-200 dark:border-warning-800',
  },
];

/**
 * Help Center Component
 * 
 * Displays help categories and quick links.
 */
export default function HelpCenter({
  categories = defaultCategories,
  className,
}: HelpCenterProps) {
  return (
    <div className={className}>
      {/* Search Bar */}
      <Card className="mb-8">
        <div className="flex items-center gap-4">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search for help..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <Button variant="primary">Search</Button>
        </div>
      </Card>

      {/* Help Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Link key={category.id} href={category.link}>
            <Card
              hover
              className={`h-full ${category.color} border-2 transition-all`}
            >
              <div className="flex flex-col items-center text-center p-6">
                <div className="mb-4 text-primary-600 dark:text-primary-400">
                  {category.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {category.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {category.description}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Links */}
      <Card title="Quick Links" className="mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/help/faq">
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Common Questions</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Find answers to common questions</p>
            </div>
          </Link>
          <Link href="/help/contact">
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Need More Help?</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Contact our support team</p>
            </div>
          </Link>
        </div>
      </Card>
    </div>
  );
}

