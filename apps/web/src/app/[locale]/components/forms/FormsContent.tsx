'use client';

import { useState } from 'react';
import { Input, Textarea, Select, Checkbox, Radio, Switch, DatePicker, TimePicker, FileUpload, Button, Form, FormField, FormBuilder, RichTextEditor, Slider, Range, ColorPicker, TagInput } from '@/components/ui';
import type { FormField as FormBuilderField } from '@/components/ui/FormBuilder';
import { PageHeader, PageContainer, Section, PageNavigation } from '@/components/layout';
import { logger } from '@/lib/logger';

export default function FormsContent() {
  const [formData, setFormData] = useState({ email: '', password: '', description: '', country: '', newsletter: false, plan: 'basic', notifications: true, birthdate: '', richText: '', time: '', sliderValue: 50, rangeValue: [20, 80] as [number, number], color: 'var(--color-primary-500)', tags: [] as string[] });

  return (
    <PageContainer>
      <PageHeader
        title="Composants de Formulaire"
        description="Composants pour créer des formulaires interactifs et accessibles"
        breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Composants', href: '/components' }, { label: 'Formulaires' }]}
      />

      <div className="space-y-8">
        <Section title="Input">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Email" type="email" placeholder="votre@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            <Input label="Mot de passe" type="password" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
            <Input label="Avec icône gauche" leftIcon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} placeholder="Rechercher..." />
            <Input label="Avec erreur" error="Ce champ est requis" placeholder="Champ invalide" />
          </div>
        </Section>

        <Section title="Textarea">
          <Textarea label="Description" rows={4} placeholder="Décrivez votre projet..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} helperText="Maximum 500 caractères" />
        </Section>

        <Section title="Select">
          <Select label="Pays" placeholder="Sélectionnez un pays" options={[{ value: 'fr', label: 'France' }, { value: 'us', label: 'États-Unis' }, { value: 'uk', label: 'Royaume-Uni' }, { value: 'de', label: 'Allemagne' }]} value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} />
        </Section>

        <Section title="Checkbox">
          <div className="space-y-3">
            <Checkbox label="J'accepte les conditions d'utilisation" checked={formData.newsletter} onChange={(e) => setFormData({ ...formData, newsletter: e.target.checked })} />
            <Checkbox label="Recevoir les newsletters" checked={formData.newsletter} onChange={(e) => setFormData({ ...formData, newsletter: e.target.checked })} />
            <Checkbox label="Checkbox désactivé" disabled />
          </div>
        </Section>

        <Section title="Radio">
          <div className="space-y-3">
            <Radio label="Plan Basic - 9€/mois" name="plan" value="basic" checked={formData.plan === 'basic'} onChange={(e) => setFormData({ ...formData, plan: e.target.value })} />
            <Radio label="Plan Pro - 29€/mois" name="plan" value="pro" checked={formData.plan === 'pro'} onChange={(e) => setFormData({ ...formData, plan: e.target.value })} />
            <Radio label="Plan Enterprise - 99€/mois" name="plan" value="enterprise" checked={formData.plan === 'enterprise'} onChange={(e) => setFormData({ ...formData, plan: e.target.value })} />
          </div>
        </Section>

        <Section title="Switch">
          <div className="space-y-4">
            <Switch label="Notifications par email" checked={formData.notifications} onChange={(e) => setFormData({ ...formData, notifications: e.target.checked })} />
            <Switch label="Notifications push" checked={formData.notifications} onChange={(e) => setFormData({ ...formData, notifications: e.target.checked })} />
            <Switch label="Switch désactivé" disabled />
          </div>
        </Section>

        <Section title="DatePicker">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DatePicker label="Date de naissance" format="date" value={formData.birthdate} onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })} />
            <DatePicker label="Date et heure" format="datetime-local" />
          </div>
        </Section>

        <Section title="TimePicker">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TimePicker label="Heure (24h)" value={formData.time} onChange={(time) => setFormData({ ...formData, time })} format="24h" />
            <TimePicker label="Heure (12h)" value={formData.time} onChange={(time) => setFormData({ ...formData, time })} format="12h" />
          </div>
        </Section>

        <Section title="Slider">
          <div className="space-y-6">
            <Slider label="Volume" value={formData.sliderValue} onChange={(value) => setFormData({ ...formData, sliderValue: value })} min={0} max={100} showValue />
            <Slider label="Taille" value={formData.sliderValue} onChange={(value) => setFormData({ ...formData, sliderValue: value })} min={0} max={100} step={10} marks={[{ value: 0, label: 'Min' }, { value: 50, label: 'Moyen' }, { value: 100, label: 'Max' }]} />
          </div>
        </Section>

        <Section title="Range">
          <div className="space-y-6">
            <Range label="Prix" value={formData.rangeValue} onChange={(value) => setFormData({ ...formData, rangeValue: value })} min={0} max={1000} showValues />
            <Range label="Période" value={formData.rangeValue} onChange={(value) => setFormData({ ...formData, rangeValue: value })} min={0} max={100} step={5} />
          </div>
        </Section>

        <Section title="ColorPicker">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ColorPicker label="Couleur principale" value={formData.color} onChange={(color) => setFormData({ ...formData, color })} showInput />
            <ColorPicker label="Couleur secondaire" value={formData.color} onChange={(color) => setFormData({ ...formData, color })} showInput={false} />
          </div>
        </Section>

        <Section title="TagInput">
          <div className="space-y-4">
            <TagInput label="Tags" value={formData.tags} onChange={(tags) => setFormData({ ...formData, tags })} placeholder="Ajouter un tag..." maxTags={5} />
            <TagInput label="Catégories" value={formData.tags} onChange={(tags) => setFormData({ ...formData, tags })} placeholder="Appuyez sur Entrée ou virgule pour ajouter" allowDuplicates={false} />
          </div>
        </Section>

        <Section title="FileUpload">
          <FileUpload 
            label="Téléverser des fichiers" 
            accept="image/*" 
            multiple 
            maxSize={5} 
            onFileSelect={(files) => logger.debug('Files selected', { count: files.length })} 
            helperText="Formats acceptés : JPG, PNG, GIF. Taille max : 5MB" 
          />
        </Section>

        <Section title="Form & FormField">
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold mb-4">Formulaire structuré avec Form</h4>
              <Form
                onSubmit={(data) => {
                  logger.debug('Form submitted', { fields: Object.keys(data) });
                  alert('Formulaire soumis avec succès !');
                }}
                className="space-y-4"
              >
                <FormField
                  name="fullName"
                  label="Nom complet"
                  required
                  children={<Input name="fullName" placeholder="John Doe" />}
                />


                <FormField
                  name="email"
                  label="Email"
                  children={<Input name="email" type="email" placeholder="john@example.com" />}
                />
                <FormField
                  name="country"
                  label="Pays"
                  children={<Select name="country" placeholder="Sélectionnez un pays" options={[{ value: 'fr', label: 'France' }, { value: 'us', label: 'États-Unis' }, { value: 'uk', label: 'Royaume-Uni' }]} />}
                />






                <FormField
                  name="message"
                  label="Message"
                  children={<Textarea name="message" rows={4} placeholder="Votre message..." />}
                />
                <FormField
                  name="acceptTerms"
                  label="J'accepte les conditions"
                  required
                  children={<Checkbox name="acceptTerms" />}
                />
                <div className="flex gap-4">
                  <Button type="submit" variant="primary">Envoyer</Button>
                  <Button type="button" variant="outline">Annuler</Button>
                </div>
              </Form>
            </div>
          </div>
        </Section>

        <Section title="RichTextEditor">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Éditeur de texte riche avec barre d'outils.</p>
            <RichTextEditor
              value={formData.richText}
              onChange={(value) => setFormData({ ...formData, richText: value })}
              label="Description détaillée"
              placeholder="Tapez votre texte ici..."
              helperText="Utilisez la barre d'outils pour formater votre texte"
            />
          </div>
        </Section>

        <Section title="FormBuilder">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Constructeur de formulaires dynamiques à partir d'une configuration.</p>
            <FormBuilder
              fields={[
                { name: 'name', label: 'Nom complet', type: 'text' as const, placeholder: 'John Doe', required: true },
                { name: 'email', label: 'Email', type: 'email' as const, placeholder: 'john@example.com', required: true },
                { name: 'country', label: 'Pays', type: 'select' as const, options: [{ label: 'France', value: 'fr' }, { label: 'États-Unis', value: 'us' }], required: true },
                { name: 'message', label: 'Message', type: 'textarea' as const, placeholder: 'Votre message...', helperText: 'Maximum 500 caractères' },
                { name: 'newsletter', label: 'S\'abonner à la newsletter', type: 'checkbox' as const, defaultValue: false },
                { name: 'plan', label: 'Plan', type: 'radio' as const, options: [{ label: 'Basique', value: 'basic' }, { label: 'Premium', value: 'premium' }], defaultValue: 'basic' },
                { name: 'birthdate', label: 'Date de naissance', type: 'date' as const },
              ] satisfies FormBuilderField[]}
              onSubmit={(data) => {
                logger.debug('FormBuilder submitted', { fields: Object.keys(data) });
                alert('Formulaire soumis avec succès !');
              }}
              submitLabel="Soumettre"
            />
          </div>
        </Section>

        <Section title="Exemple de formulaire complet">
          <form onSubmit={(e) => { e.preventDefault(); alert('Formulaire soumis !'); }} className="space-y-4">
            <Input label="Nom complet" required placeholder="John Doe" />
            <Input label="Email" type="email" required placeholder="john@example.com" />
            <Select label="Pays" placeholder="Sélectionnez un pays" options={[{ value: 'fr', label: 'France' }, { value: 'us', label: 'États-Unis' }]} required />
            <Textarea label="Message" rows={4} placeholder="Votre message..." />
            <Checkbox label="J'accepte les conditions" required />
            <div className="flex gap-4">
              <Button type="submit" variant="primary">Envoyer</Button>
              <Button type="button" variant="outline">Annuler</Button>
            </div>
          </form>
        </Section>
      </div>

      <PageNavigation prev={{ label: 'Retour aux composants', href: '/components' }} next={{ label: 'Navigation', href: '/components/navigation' }} />
    </PageContainer>
  );
}

