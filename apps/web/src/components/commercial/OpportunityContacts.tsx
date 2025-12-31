'use client';

import { useState, useEffect } from 'react';
import { Opportunity, opportunitiesAPI } from '@/lib/api/opportunities';
import { contactsAPI, Contact } from '@/lib/api/contacts';
import { useToast } from '@/components/ui';
import { handleApiError } from '@/lib/errors/api';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { Plus, X, Search, UserCircle } from 'lucide-react';

interface OpportunityContactsProps {
  opportunity: Opportunity;
  onUpdate: () => void;
}

export default function OpportunityContacts({ opportunity, onUpdate }: OpportunityContactsProps) {
  const { showToast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [addingContact, setAddingContact] = useState(false);

  // Load all contacts (for search and to display linked contacts)
  useEffect(() => {
    const loadContacts = async () => {
      try {
        setLoading(true);
        const allContacts = await contactsAPI.list(0, 1000);
        setContacts(allContacts);
      } catch (err) {
        const appError = handleApiError(err);
        showToast({
          message: appError.message || 'Erreur lors du chargement des contacts',
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    loadContacts();
  }, [showToast]);

  // Filter contacts based on search query
  const filteredContacts = contacts.filter((contact) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const fullName = `${contact.first_name} ${contact.last_name}`.toLowerCase();
    const companyName = contact.company_name?.toLowerCase() || '';
    return (
      fullName.includes(query) ||
      companyName.includes(query) ||
      contact.email?.toLowerCase().includes(query) ||
      contact.position?.toLowerCase().includes(query)
    );
  });

  // Get contacts that are already linked
  const linkedContactIds = opportunity.contact_ids || [];
  const availableContacts = filteredContacts.filter(
    (contact) => !linkedContactIds.includes(contact.id)
  );

  const handleAddContact = async (contactId: number) => {
    try {
      setAddingContact(true);
      const currentContactIds = opportunity.contact_ids || [];
      const newContactIds = [...currentContactIds, contactId];

      await opportunitiesAPI.update(opportunity.id, {
        contact_ids: newContactIds,
      });

      showToast({
        message: 'Contact ajouté avec succès',
        type: 'success',
      });

      setShowAddModal(false);
      setSearchQuery('');
      onUpdate();
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de l\'ajout du contact',
        type: 'error',
      });
    } finally {
      setAddingContact(false);
    }
  };

  const handleRemoveContact = async (contactId: number) => {
    try {
      const currentContactIds = opportunity.contact_ids || [];
      const newContactIds = currentContactIds.filter((id) => id !== contactId);

      await opportunitiesAPI.update(opportunity.id, {
        contact_ids: newContactIds,
      });

      showToast({
        message: 'Contact retiré avec succès',
        type: 'success',
      });

      onUpdate();
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression du contact',
        type: 'error',
      });
    }
  };

  // Get linked contacts details
  const linkedContacts = contacts.filter((contact) =>
    linkedContactIds.includes(contact.id)
  );

  return (
    <>
      <div className="space-y-2">
        {loading && contacts.length === 0 ? (
          <div className="text-sm text-muted-foreground py-2">
            Chargement des contacts...
          </div>
        ) : linkedContacts.length > 0 ? (
          <div className="space-y-2">
            {linkedContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-2 rounded-lg border border-border bg-muted/50"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {contact.photo_url ? (
                    <img
                      src={contact.photo_url}
                      alt={`${contact.first_name} ${contact.last_name}`}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <UserCircle className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {contact.first_name} {contact.last_name}
                    </p>
                    {contact.company_name && (
                      <p className="text-xs text-muted-foreground truncate">
                        {contact.company_name}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveContact(contact.id)}
                  className="ml-2 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 transition-colors flex-shrink-0"
                  title="Retirer le contact"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un contact
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un contact
          </Button>
        )}
      </div>

      {/* Add Contact Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSearchQuery('');
        }}
        title="Ajouter un contact"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Rechercher un contact"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Nom, entreprise, email..."
            leftIcon={<Search className="w-4 h-4" />}
          />

          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              Chargement des contacts...
            </div>
          ) : availableContacts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {searchQuery
                ? 'Aucun contact trouvé'
                : 'Tous les contacts sont déjà liés à cette opportunité'}
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {availableContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => handleAddContact(contact.id)}
                  disabled={addingContact}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {contact.photo_url ? (
                    <img
                      src={contact.photo_url}
                      alt={`${contact.first_name} ${contact.last_name}`}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <UserCircle className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {contact.first_name} {contact.last_name}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {contact.company_name && (
                        <span className="truncate">{contact.company_name}</span>
                      )}
                      {contact.position && (
                        <span className="truncate">• {contact.position}</span>
                      )}
                      {contact.email && (
                        <span className="truncate">• {contact.email}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
