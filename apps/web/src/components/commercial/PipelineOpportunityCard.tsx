'use client';

import { Plus, UserCircle } from 'lucide-react';
import { clsx } from 'clsx';
import Image from 'next/image';
import { type Contact } from '@/lib/api/contacts';
import Button from '@/components/ui/Button';

interface PipelineOpportunityCardProps {
  id: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date;
  tags?: string[];
  contact_ids?: number[];
  contact_names?: string[];
  contacts?: Contact[];
  onAddContact?: () => void;
  onClick?: () => void;
  dragged?: boolean;
}

export default function PipelineOpportunityCard({
  id: _id,
  title,
  description,
  priority,
  dueDate,
  tags,
  contact_ids = [],
  contact_names = [],
  contacts = [],
  onAddContact,
  onClick,
  dragged = false,
}: PipelineOpportunityCardProps) {
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-danger-50 dark:bg-danger-900/30 text-danger-900 dark:text-danger-300';
      case 'medium':
        return 'bg-warning-50 dark:bg-warning-900/30 text-warning-900 dark:text-warning-300';
      case 'low':
        return 'bg-secondary-50 dark:bg-secondary-900/30 text-secondary-900 dark:text-secondary-300';
      default:
        return 'bg-muted dark:bg-gray-700 text-foreground dark:text-gray-200';
    }
  };

  // Get contact details from contacts array if available
  const displayContacts = contact_ids && contact_ids.length > 0 && contacts && contacts.length > 0
    ? contacts.filter(c => contact_ids.includes(c.id))
    : [];

  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-background dark:bg-gray-800 rounded-lg p-4 shadow-sm cursor-move hover:shadow-md transition-shadow flex-shrink-0',
        dragged && 'opacity-50'
      )}
    >
      <h4 className="font-medium text-foreground dark:text-white mb-2">
        {title}
      </h4>
      {description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {description}
        </p>
      )}
      
      {/* Contacts display - visible if contacts exist */}
      {(displayContacts.length > 0 || contact_names.length > 0) && (
        <div className="mb-3 flex items-center gap-2 flex-wrap">
          {displayContacts.length > 0 ? (
            displayContacts.map((contact) => (
              <div key={contact.id} className="flex items-center gap-1.5">
                {contact.photo_url ? (
                  <Image
                    src={contact.photo_url}
                    alt={`${contact.first_name} ${contact.last_name}`}
                    width={20}
                    height={20}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <UserCircle className="w-5 h-5 text-muted-foreground" />
                )}
                <span className="text-xs text-foreground">
                  {contact.first_name} {contact.last_name}
                </span>
              </div>
            ))
          ) : (
            contact_names.map((name, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <UserCircle className="w-5 h-5 text-muted-foreground" />
                <span className="text-xs text-foreground">{name}</span>
              </div>
            ))
          )}
          {onAddContact && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAddContact();
              }}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
            >
              <Plus className="w-3 h-3" />
            </Button>
          )}
        </div>
      )}
      
      {/* Add contact button if no contacts */}
      {displayContacts.length === 0 && contact_names.length === 0 && onAddContact && (
        <div className="mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAddContact();
            }}
            className="h-6 text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Ajouter un contact
          </Button>
        </div>
      )}
      
      <div className="flex items-center justify-between flex-wrap gap-2">
        {priority && (
          <span className={clsx('text-xs px-2 py-1 rounded', getPriorityColor(priority))}>
            {priority}
          </span>
        )}
        {tags && tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 bg-muted dark:bg-gray-700 text-muted-foreground rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      {dueDate && (
        <div className="mt-2 text-xs text-muted-foreground">
          {new Date(dueDate).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
