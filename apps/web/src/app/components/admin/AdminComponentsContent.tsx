/**
 * Admin Components Showcase Page
 */

'use client';

import { PageHeader, PageContainer, Section } from '@/components/layout';
import { useState } from 'react';
import { logger } from '@/lib/logger';
import InvitationManagement from '@/components/admin/InvitationManagement';
import RoleManagement from '@/components/admin/RoleManagement';
import TeamManagement from '@/components/admin/TeamManagement';
import { AdminThemeManager } from '@/components/admin/themes/AdminThemeManager';
import { Card } from '@/components/ui';

export default function AdminComponentsContent() {
  const [invitations, setInvitations] = useState([
    {
      id: '1',
      email: 'newuser@example.com',
      role: 'user',
      status: 'pending',
      invitedBy: 'admin@example.com',
      invitedAt: new Date(Date.now() - 86400000).toISOString(),
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    },
    {
      id: '2',
      email: 'manager@example.com',
      role: 'admin',
      status: 'accepted',
      invitedBy: 'admin@example.com',
      invitedAt: new Date(Date.now() - 172800000).toISOString(),
      acceptedAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ]);

  const sampleRoles = [
    {
      id: '1',
      name: 'Super Admin',
      description: 'Full system access',
      permissions: ['read', 'write', 'delete', 'admin'],
      userCount: 2,
    },
    {
      id: '2',
      name: 'Admin',
      description: 'Administrative access',
      permissions: ['read', 'write', 'delete'],
      userCount: 5,
    },
    {
      id: '3',
      name: 'User',
      description: 'Standard user access',
      permissions: ['read', 'write'],
      userCount: 150,
    },
  ];

  const sampleTeams = [
    {
      id: '1',
      name: 'Development Team',
      description: 'Software development team',
      members: [
        { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'member' },
      ],
      createdAt: new Date(Date.now() - 2592000000).toISOString(),
    },
    {
      id: '2',
      name: 'Marketing Team',
      description: 'Marketing and communications',
      members: [
        { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'admin' },
      ],
      createdAt: new Date(Date.now() - 1728000000).toISOString(),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Composants d'Administration"
        description="Composants pour la gestion des utilisateurs, rôles, équipes et invitations"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Composants', href: '/components' },
          { label: 'Administration' },
        ]}
      />

      <div className="space-y-8 mt-8">
        <Section title="Invitation Management">
          <InvitationManagement
            invitations={invitations}
            onInvite={(email, role) => {
              logger.info('Inviting user:', { email, role });
              setInvitations([
                ...invitations,
                {
                  id: String(invitations.length + 1),
                  email,
                  role,
                  status: 'pending',
                  invitedBy: 'current-user@example.com',
                  invitedAt: new Date().toISOString(),
                  expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
                },
              ]);
            }}
            onResend={(invitationId) => {
              logger.info('Resending invitation:', { invitationId });
            }}
            onRevoke={(invitationId) => {
              logger.info('Revoking invitation:', { invitationId });
              setInvitations(invitations.filter((inv) => inv.id !== invitationId));
            }}
          />
        </Section>

        <Section title="Role Management">
          <RoleManagement
            roles={sampleRoles}
            onCreateRole={(roleData) => {
              logger.info('Creating role:', { roleData });
            }}
            onUpdateRole={(roleId, roleData) => {
              logger.info('Updating role:', { roleId, roleData });
            }}
            onDeleteRole={(roleId) => {
              logger.info('Deleting role:', { roleId });
            }}
          />
        </Section>

        <Section title="Team Management">
          <TeamManagement
            teams={sampleTeams}
            onCreateTeam={(teamData) => {
              logger.info('Creating team:', { teamData });
            }}
            onUpdateTeam={(teamId, teamData) => {
              logger.info('Updating team:', { teamId, teamData });
            }}
            onDeleteTeam={(teamId) => {
              logger.info('Deleting team:', { teamId });
            }}
            onAddMember={(teamId, userId) => {
              logger.info('Adding member to team:', { teamId, userId });
            }}
            onRemoveMember={(teamId, userId) => {
              logger.info('Removing member from team:', { teamId, userId });
            }}
          />
        </Section>

        <Section title="Theme Manager (Super Admin)">
          <Card className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              AdminThemeManager allows super admins to manage global themes that apply to all users.
            </p>
            <AdminThemeManager authToken="" />
          </Card>
        </Section>
      </div>
    </PageContainer>
  );
}

