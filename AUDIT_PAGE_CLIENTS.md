# Audit de la page Clients après refactor UI

**Page audité** : `/fr/dashboard/projets/clients`  
**Date** : 2025-01-27  
**URL de production** : https://modeleweb-production-f341.up.railway.app/fr/dashboard/projets/clients

## 📋 Résumé exécutif

Après analyse du code de la page clients, plusieurs fonctionnalités existantes au niveau API et hooks React Query ne sont **pas implémentées dans l'interface utilisateur**. De plus, certaines connexions sont **non fonctionnelles**.

---

## ✅ Fonctionnalités implémentées

1. ✅ **Liste des clients** avec pagination infinie (`useInfiniteClients`)
2. ✅ **Création** de clients (`useCreateClient`)
3. ✅ **Modification** de statut via dropdown
4. ✅ **Recherche** avec debounce
5. ✅ **Filtres** par statut (Tous, Actifs, Inactifs, Maintenance)
6. ✅ **Vues** grille et liste
7. ✅ **Affichage des projets** associés
8. ✅ **Navigation** vers la page de détail
9. ✅ **Stats** (clients actifs, projets totaux, clients totaux)

---

## ❌ Fonctionnalités manquantes (API/hooks existants mais UI manquante)

### 1. **Suppression de clients** 🔴 CRITIQUE

**API disponible** : ✅ `clientsAPI.delete(id)`  
**Hook disponible** : ✅ `useDeleteClient()`  
**UI manquante** : ❌ Aucun bouton de suppression dans l'interface

**Impact** : Les utilisateurs ne peuvent pas supprimer des clients depuis l'interface.

**Code existant** :
```typescript
// apps/web/src/lib/api/clients.ts:107
delete: async (id: number): Promise<void> => {
  await apiClient.delete(`/v1/projects/clients/${id}`);
}

// apps/web/src/lib/query/clients.ts:135
export function useDeleteClient() {
  // Hook disponible mais non utilisé
}
```

**Recommandation** : Ajouter un bouton de suppression dans un menu contextuel (Dropdown) avec confirmation.

---

### 2. **Modification complète de clients** 🟡 IMPORTANT

**API disponible** : ✅ `clientsAPI.update(id, data)`  
**Hook disponible** : ✅ `useUpdateClient()`  
**Modal disponible** : ✅ `ClientForm` avec prop `client`  
**UI manquante** : ❌ Aucun bouton pour ouvrir le modal d'édition depuis la liste

**Impact** : Les utilisateurs ne peuvent modifier que le statut, pas les autres informations (nom, type, portal_url).

**Code existant** :
```typescript
// Le modal existe mais n'est jamais ouvert depuis la liste
<Modal isOpen={showEditModal} ...>
  <ClientForm client={selectedClient} ... />
</Modal>
```

**Recommandation** : Ajouter un bouton "Modifier" dans un menu contextuel pour chaque client.

---

### 3. **Export CSV/Excel** 🟡 IMPORTANT

**Composants disponibles** : ✅ `ExportButton`, `DataExporter`  
**UI manquante** : ❌ Aucun bouton d'export dans l'interface

**Impact** : Les utilisateurs ne peuvent pas exporter la liste des clients.

**Recommandation** : Ajouter un bouton d'export dans le header avec dropdown (CSV, Excel).

---

### 4. **Sélection multiple et actions en masse** 🟢 MOYEN

**UI manquante** : ❌ Pas de checkboxes pour sélection multiple  
**Actions manquantes** : ❌ Pas de suppression en masse, pas de changement de statut en masse

**Impact** : Les utilisateurs doivent modifier/supprimer les clients un par un.

**Recommandation** : Ajouter des checkboxes et une barre d'actions en masse.

---

### 5. **Menu contextuel (Dropdown)** 🟢 MOYEN

**Composant disponible** : ✅ `Dropdown`  
**UI manquante** : ❌ Pas de menu avec toutes les actions (Voir, Modifier, Dupliquer, Supprimer)

**Impact** : L'interface est moins intuitive et les actions sont dispersées.

**Recommandation** : Ajouter un menu contextuel avec icône `MoreVertical` pour chaque client.

---

### 6. **Duplication de clients** 🟢 MOYEN

**API disponible** : ✅ `clientsAPI.create()` peut être utilisé pour dupliquer  
**UI manquante** : ❌ Pas de fonctionnalité de duplication

**Impact** : Les utilisateurs doivent créer manuellement un nouveau client similaire.

**Recommandation** : Ajouter une action "Dupliquer" dans le menu contextuel.

---

## 🔴 Connexions non fonctionnelles

### 1. **Compteur de contacts toujours à 0** 🔴 CRITIQUE

**Problème** : Le compteur de contacts affiche toujours `0` même si des contacts existent.

**Code problématique** :
```typescript
// Ligne 206
totalContacts: 0, // Contact count not available in Client type

// Lignes 593, 708
<p className="text-sm font-semibold text-gray-900 dark:text-white">0</p>
```

**API disponible** : ✅ `clientsAPI.getContacts(clientId)`  
**Hook disponible** : ✅ `useClientContacts(clientId)`

**Solution** : Utiliser `useClientContacts` pour chaque client ou charger tous les contacts et les mapper.

---

### 2. **Modal d'édition jamais ouvert** 🟡 IMPORTANT

**Problème** : Le modal d'édition existe mais `setShowEditModal(true)` n'est jamais appelé depuis la liste.

**Code problématique** :
```typescript
// Le modal existe mais aucun bouton ne l'ouvre
const [showEditModal, setShowEditModal] = useState(false);
```

**Solution** : Ajouter un bouton "Modifier" qui appelle `setShowEditModal(true)` et `setSelectedClient(client)`.

---

## 📊 Statistiques

- **Fonctionnalités implémentées** : 9/15 (60%)
- **Fonctionnalités manquantes** : 6/15 (40%)
- **Connexions non fonctionnelles** : 2

---

## 🎯 Priorités d'implémentation

### Priorité 1 (Critique)
1. ✅ Ajouter la suppression de clients
2. ✅ Corriger le compteur de contacts
3. ✅ Ajouter le bouton de modification

### Priorité 2 (Important)
4. ✅ Ajouter l'export CSV/Excel
5. ✅ Ajouter le menu contextuel (Dropdown)

### Priorité 3 (Moyen)
6. ✅ Ajouter la sélection multiple et actions en masse
7. ✅ Ajouter la duplication

---

## 📝 Notes techniques

### Hooks React Query disponibles mais non utilisés
- `useDeleteClient()` - Non utilisé
- `useClientContacts()` - Non utilisé pour les stats

### APIs disponibles mais non utilisées
- `clientsAPI.delete()` - Non utilisé
- `clientsAPI.getContacts()` - Non utilisé pour les stats

### Composants UI disponibles mais non utilisés
- `Dropdown` - Utilisé seulement pour le statut, pas pour les actions
- `ExportButton` - Non utilisé
- `DataExporter` - Non utilisé

---

## 🔗 Références

- **API Clients** : `apps/web/src/lib/api/clients.ts`
- **Hooks Clients** : `apps/web/src/lib/query/clients.ts`
- **Page Clients** : `apps/web/src/app/[locale]/dashboard/projets/clients/page.tsx`
- **Composant Form** : `apps/web/src/components/projects/ClientForm.tsx`

---

## ✅ Checklist d'implémentation

- [ ] Ajouter `useDeleteClient` et bouton de suppression avec confirmation
- [ ] Ajouter bouton "Modifier" pour ouvrir le modal d'édition
- [ ] Utiliser `useClientContacts` pour afficher le vrai compteur de contacts
- [ ] Ajouter bouton d'export CSV/Excel dans le header
- [ ] Ajouter menu contextuel (Dropdown) avec toutes les actions
- [ ] Ajouter sélection multiple avec checkboxes
- [ ] Ajouter actions en masse (suppression, changement de statut)
- [ ] Ajouter fonctionnalité de duplication

---

**Fin du rapport d'audit**
