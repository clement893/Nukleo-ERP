/**
 * Collaboration Components Showcase Page
 */

'use client';

import { PageHeader, PageContainer, Section } from '@/components/layout';
import {
  Comments,
  Mentions,
  CollaborationPanel,
} from '@/components/collaboration';
import { logger } from '@/lib/logger';
import { useState } from 'react';
import Card from '@/components/ui/Card';

export default function CollaborationComponentsContent() {
  const [comments, setComments] = useState([
    {
      id: '1',
      author: {
        id: '1',
        name: 'John Doe',
        avatar: undefined,
      },
      content: 'This looks great! Nice work on the implementation.',
      timestamp: new Date().toISOString(),
      reactions: {
        like: 3,
        heart: 1,
      },
      replies: [
        {
          id: '2',
          author: {
            id: '2',
            name: 'Jane Smith',
            avatar: undefined,
          },
          content: 'Thanks! I appreciate the feedback.',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          reactions: {
            like: 1,
            heart: 0,
          },
        },
      ],
    },
    {
      id: '3',
      author: {
        id: '3',
        name: 'Bob Wilson',
        avatar: undefined,
      },
      content: 'Could we add more features to this?',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      reactions: {
        like: 0,
        heart: 0,
      },
    },
  ]);

  const [mentionValue, setMentionValue] = useState('');
  const [mentions, setMentions] = useState<Array<{ userId: string; userName: string; position: number }>>([]);

  const sampleUsers = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      avatar: undefined,
      role: 'Admin',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      avatar: undefined,
      role: 'Editor',
    },
    {
      id: '3',
      name: 'Bob Wilson',
      email: 'bob@example.com',
      avatar: undefined,
      role: 'Viewer',
    },
  ];

  const sampleCollaborators = [
    {
      id: '1',
      name: 'John Doe',
      avatar: undefined,
      role: 'owner' as const,
      status: 'online' as const,
      isTyping: false,
    },
    {
      id: '2',
      name: 'Jane Smith',
      avatar: undefined,
      role: 'editor' as const,
      status: 'online' as const,
      isTyping: true,
      cursor: { x: 100, y: 200 },
    },
    {
      id: '3',
      name: 'Bob Wilson',
      avatar: undefined,
      role: 'viewer' as const,
      status: 'away' as const,
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Composants de Collaboration"
        description="Composants pour la collaboration en temps réel, commentaires et mentions"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Composants', href: '/components' },
          { label: 'Collaboration' },
        ]}
      />

      <div className="space-y-8 mt-8">
        <Section title="Comments">
          <div className="max-w-4xl">
            <Comments
              comments={comments}
              currentUser={{
                id: 'current',
                name: 'You',
                avatar: undefined,
              }}
              onSubmit={async (content, parentId) => {
                logger.info('Comment submitted:', { content, parentId });
                const newComment = {
                  id: String(Date.now()),
                  author: {
                    id: 'current',
                    name: 'You',
                    avatar: undefined,
                  },
                  content,
                  timestamp: new Date().toISOString(),
                  reactions: {
                    like: 0,
                    heart: 0,
                  },
                };
                if (parentId) {
                  setComments((prev) =>
                    prev.map((c) =>
                      c.id === parentId
                        ? { ...c, replies: [...(c.replies || []), newComment] }
                        : c
                    )
                  );
                } else {
                  setComments([...comments, newComment]);
                }
                await new Promise((resolve) => setTimeout(resolve, 500));
                return newComment;
              }}
              onEdit={async (id, content) => {
                logger.info('Comment edited:', { id, content });
                setComments((prev) =>
                  prev.map((c) =>
                    c.id === id ? { ...c, content, edited: true } : c
                  )
                );
                await new Promise((resolve) => setTimeout(resolve, 500));
              }}
              onDelete={async (id) => {
                logger.info('Comment deleted:', { id });
                setComments((prev) => prev.filter((c) => c.id !== id));
                await new Promise((resolve) => setTimeout(resolve, 500));
              }}
              onReact={async (id, reaction) => {
                logger.info('Reaction added:', { id, reaction });
                setComments((prev) =>
                  prev.map((c) =>
                    c.id === id
                      ? {
                          ...c,
                          reactions: {
                            ...c.reactions,
                            [reaction]: (c.reactions?.[reaction] || 0) + 1,
                          },
                        }
                      : c
                  )
                );
                await new Promise((resolve) => setTimeout(resolve, 500));
              }}
            />
          </div>
        </Section>

        <Section title="Mentions">
          <div className="max-w-2xl">
            <Card className="bg-background">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Type @ to mention someone
                  </label>
                  <Mentions
                    users={sampleUsers}
                    value={mentionValue}
                    onChange={(value, mentions) => {
                      setMentionValue(value);
                      setMentions(mentions);
                      logger.info('Mentions updated:', { value, mentions });
                    }}
                    placeholder="Type your message... Use @ to mention someone"
                  />
                </div>
                {mentions.length > 0 && (
                  <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                    <div className="text-sm font-medium text-primary-900 dark:text-primary-100 mb-1">
                      Mentioned Users:
                    </div>
                    <div className="text-xs text-primary-800 dark:text-primary-200">
                      {mentions.map((m) => m.userName).join(', ')}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </Section>

        <Section title="Collaboration Panel">
          <div className="max-w-md">
            <CollaborationPanel
              collaborators={sampleCollaborators}
              currentUser={sampleCollaborators[0]}
              onInvite={() => {
                logger.info('Invite collaborators');
              }}
              onShare={() => {
                logger.info('Share document');
              }}
              onStartCall={() => {
                logger.info('Start video call');
              }}
            />
          </div>
        </Section>
      </div>
    </PageContainer>
  );
}

