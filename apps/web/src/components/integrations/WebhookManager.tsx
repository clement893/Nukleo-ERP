/**
 * Webhook Manager Component
 * Manage webhook endpoints and configurations
 * Note: This is similar to WebhooksSettings but focused on management UI
 */

'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Switch from '@/components/ui/Switch';
import { Plus, Webhook, Trash2, Edit, CheckCircle, Activity } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { logger } from '@/lib/logger';

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
  createdAt: string;
  lastTriggered?: string;
  successCount: number;
  failureCount: number;
  lastStatus?: 'success' | 'failure';
}

export interface WebhookManagerProps {
  webhooks?: Webhook[];
  onCreate?: (data: { name: string; url: string; events: string[] }) => Promise<Webhook>;
  onUpdate?: (id: string, data: Partial<Webhook>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onToggle?: (id: string, active: boolean) => Promise<void>;
  onTest?: (id: string) => Promise<void>;
  className?: string;
}

const availableEvents = [
  { id: 'user.created', label: 'User Created' },
  { id: 'user.updated', label: 'User Updated' },
  { id: 'user.deleted', label: 'User Deleted' },
  { id: 'payment.succeeded', label: 'Payment Succeeded' },
  { id: 'payment.failed', label: 'Payment Failed' },
  { id: 'subscription.created', label: 'Subscription Created' },
  { id: 'subscription.updated', label: 'Subscription Updated' },
  { id: 'subscription.cancelled', label: 'Subscription Cancelled' },
];

export default function WebhookManager({
  webhooks = [],
  onCreate,
  onUpdate: _onUpdate,
  onDelete,
  onToggle,
  onTest,
  className,
}: WebhookManagerProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
  });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.url.trim() || formData.events.length === 0) return;

    setLoading(true);
    try {
      await onCreate?.(formData);
      setShowCreateModal(false);
      setFormData({ name: '', url: '', events: [] });
    } catch (error) {
      logger.error('Failed to create webhook', error instanceof Error ? error : undefined);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;
    try {
      await onDelete?.(id);
    } catch (error) {
      logger.error('Failed to delete webhook', error instanceof Error ? error : undefined);
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    try {
      await onToggle?.(id, active);
    } catch (error) {
      logger.error('Failed to toggle webhook', error instanceof Error ? error : undefined);
    }
  };

  const getSuccessRate = (webhook: Webhook) => {
    const total = webhook.successCount + webhook.failureCount;
    if (total === 0) return 100;
    return Math.round((webhook.successCount / total) * 100);
  };

  return (
    <>
      <Card className={clsx('bg-white dark:bg-gray-800', className)}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Webhook className="w-5 h-5" />
              Webhook Manager
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage webhook endpoints and monitor delivery status
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Webhook
            </span>
          </Button>
        </div>

        {webhooks.length === 0 ? (
          <div className="text-center py-12">
            <Webhook className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No webhooks configured</p>
          </div>
        ) : (
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <div
                key={webhook.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {webhook.name}
                      </span>
                      {webhook.active ? (
                        <Badge variant="success">
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </span>
                        </Badge>
                      ) : (
                        <Badge variant="default">Inactive</Badge>
                      )}
                      {webhook.lastStatus && (
                        <Badge
                          variant={webhook.lastStatus === 'success' ? 'success' : 'error'}
                        >
                          {webhook.lastStatus === 'success' ? 'Last: Success' : 'Last: Failed'}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-mono">
                      {webhook.url}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 mb-2">
                      <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        Success: {webhook.successCount} ({getSuccessRate(webhook)}%)
                      </div>
                      {webhook.failureCount > 0 && (
                        <div className="text-danger-600 dark:text-danger-400">
                          Failures: {webhook.failureCount}
                        </div>
                      )}
                      {webhook.lastTriggered && (
                        <div>
                          Last: {new Date(webhook.lastTriggered).toLocaleString()}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {webhook.events.map((event) => (
                        <Badge key={event} variant="info" size="sm">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={webhook.active}
                      onChange={(e) => handleToggle(webhook.id, e.target.checked)}
                    />
                    {onTest && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onTest(webhook.id)}
                        icon={<Activity className="w-4 h-4" />}
                      >
                        Test
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingWebhook(webhook)}
                      icon={<Edit className="w-4 h-4" />}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(webhook.id)}
                      icon={<Trash2 className="w-4 h-4" />}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Webhook Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormData({ name: '', url: '', events: [] });
        }}
        title="Create Webhook"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Webhook Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="My Webhook"
              className={clsx(
                'w-full px-4 py-2 border rounded-lg',
                'bg-white dark:bg-gray-700',
                'text-gray-900 dark:text-gray-100',
                'border-gray-300 dark:border-gray-600',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400'
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Webhook URL
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://example.com/webhook"
              className={clsx(
                'w-full px-4 py-2 border rounded-lg',
                'bg-white dark:bg-gray-700',
                'text-gray-900 dark:text-gray-100',
                'border-gray-300 dark:border-gray-600',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400'
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Events to Subscribe
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableEvents.map((event) => (
                <label
                  key={event.id}
                  className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <input
                    type="checkbox"
                    checked={formData.events.includes(event.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, events: [...formData.events, event.id] });
                      } else {
                        setFormData({
                          ...formData,
                          events: formData.events.filter((e) => e !== event.id),
                        });
                      }
                    }}
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">{event.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setShowCreateModal(false);
                setFormData({ name: '', url: '', events: [] });
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              loading={loading}
              disabled={!formData.name.trim() || !formData.url.trim() || formData.events.length === 0}
            >
              Create Webhook
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

