'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, X, UserCircle, Search, Users } from 'lucide-react';
import { useToast, Modal, Button, Input, Loading } from '@/components/ui';
import { reseauTestimonialsAPI, type Testimonial } from '@/lib/api/reseau-testimonials';
import { contactsAPI, type Contact } from '@/lib/api/contacts';
import { handleApiError } from '@/lib/errors/api';
import Image from 'next/image';

interface TestimonialContactProps {
  testimonial: Testimonial;
  onUpdate: () => void; // Callback to refresh parent data
  compact?: boolean; // For table cell display
}

export default function TestimonialContact({ testimonial, onUpdate, compact = false }: TestimonialContactProps) {
  const { showToast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [addingContact, setAddingContact] = useState(false);
  const [currentContact, setCurrentContact] = useState<Contact | null>(null);

  // Load all contacts once
  useEffect(() => {
    const loadAllContacts = async () => {
      try {
        setLoadingContacts(true);
        const contactsList = await contactsAPI.list(0, 1000); // Fetch all contacts
        setAllContacts(contactsList);
        
        // Find current contact if contact_id exists
        if (testimonial.contact_id) {
          const found = contactsList.find(c => c.id === testimonial.contact_id);
          setCurrentContact(found || null);
        }
      } catch (err) {
        console.error('Error loading all contacts:', err);
        showToast({
          message: 'Erreur lors du chargement des contacts disponibles',
          type: 'error',
        });
      } finally {
        setLoadingContacts(false);
      }
    };
    loadAllContacts();
  }, [testimonial.contact_id, showToast]);

  const filteredAvailableContacts = useMemo(() => {
    return allContacts.filter(
      (contact) =>
        contact.id !== testimonial.contact_id &&
        (contact.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.position?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [allContacts, testimonial.contact_id, searchQuery]);

  const handleAddContact = async (contactId: number) => {
    try {
      setAddingContact(true);
      await reseauTestimonialsAPI.update(testimonial.id, {
        contact_id: contactId,
      });

      showToast({
        message: 'Contact ajouté avec succès',
        type: 'success',
      });

      setShowAddModal(false);
      setSearchQuery('');
      
      // Update current contact
      const found = allContacts.find(c => c.id === contactId);
      setCurrentContact(found || null);
      
      onUpdate(); // Refresh parent data
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

  const handleRemoveContact = async () => {
    try {
      await reseauTestimonialsAPI.update(testimonial.id, {
        contact_id: null,
      });

      showToast({
        message: 'Contact retiré avec succès',
        type: 'success',
      });
      
      setCurrentContact(null);
      onUpdate(); // Refresh parent data
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors du retrait du contact',
        type: 'error',
      });
    }
  };

  // Compact view for table cell
  if (compact) {
    if (currentContact) {
      return (
        <div className="flex items-center gap-2">
          {currentContact.photo_url ? (
            <Image
              src={currentContact.photo_url}
              alt={currentContact.first_name}
              width={24}
              height={24}
              className="rounded-full object-cover"
            />
          ) : (
            <UserCircle className="w-6 h-6 text-muted-foreground" />
          )}
          <span className="text-sm">
            {currentContact.first_name} {currentContact.last_name}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveContact();
            }}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      );
    }
    
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          setShowAddModal(true);
        }}
        className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
      >
        <Plus className="w-4 h-4" />
      </Button>
    );
  }

  // Full view for detail page
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Users className="w-5 h-5" />
        Contact lié
      </h3>

      {loadingContacts ? (
        <div className="py-4 text-center">
          <Loading />
          <p className="text-muted-foreground text-sm mt-2">Chargement des contacts...</p>
        </div>
      ) : (
        <>
          {currentContact ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  {currentContact.photo_url ? (
                    <Image
                      src={currentContact.photo_url}
                      alt={currentContact.first_name}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <UserCircle className="w-10 h-10 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">{currentContact.first_name} {currentContact.last_name}</p>
                    {currentContact.company_name && (
                      <p className="text-sm text-muted-foreground">{currentContact.company_name}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveContact}
                  className="text-muted-foreground hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddModal(true)}
                className="w-full flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Changer le contact
              </Button>
            </div>
          ) : (
            <div className="text-center p-4 border border-dashed border-border rounded-lg">
              <p className="text-muted-foreground text-sm mb-3">Aucun contact lié pour le moment.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddModal(true)}
                className="flex items-center justify-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Ajouter un contact
              </Button>
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Ajouter un contact au témoignage"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            placeholder="Rechercher un contact par nom, entreprise, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            fullWidth
          />
          {loadingContacts ? (
            <div className="py-8 text-center">
              <Loading />
              <p className="text-muted-foreground text-sm mt-2">Chargement des contacts...</p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto border rounded-md">
              {filteredAvailableContacts.length > 0 ? (
                filteredAvailableContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                    onClick={() => handleAddContact(contact.id)}
                  >
                    <div className="flex items-center gap-3">
                      {contact.photo_url ? (
                        <Image
                          src={contact.photo_url}
                          alt={contact.first_name}
                          width={32}
                          height={32}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <UserCircle className="w-8 h-8 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">{contact.first_name} {contact.last_name}</p>
                        {contact.company_name && (
                          <p className="text-xs text-muted-foreground">{contact.company_name}</p>
                        )}
                      </div>
                    </div>
                    {addingContact && <Loading className="w-4 h-4" />}
                  </div>
                ))
              ) : (
                <p className="p-4 text-center text-muted-foreground text-sm">Aucun contact trouvé.</p>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
