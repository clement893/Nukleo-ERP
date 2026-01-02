# Audit de la Page Leo

**Date**: 2025-01-27  
**Page**: `/fr/dashboard/leo`  
**Fichier**: `apps/web/src/app/[locale]/dashboard/leo/page.tsx`

## 📋 Résumé Exécutif

La page Leo est fonctionnelle pour les conversations de base (création, envoi de messages, suppression), mais plusieurs fonctionnalités existantes dans l'API ne sont pas implémentées dans l'interface, notamment le renommage de conversations, l'affichage du dernier message réel, la recherche, et les suggestions dynamiques.

---

## 🔴 Problèmes Critiques

### 1. **Dernier Message Non Affiché dans la Sidebar**
**Problème**: La fonction `getLastMessage` retourne toujours un placeholder au lieu du vrai dernier message.

**Code concerné**: 
```typescript
// Ligne 179-182
const getLastMessage = (_conv: LeoConversation) => {
  // We don't have last message in conversation object, so we'll use a placeholder
  return 'Conversation avec Leo';
};
```

**Impact**: 
- Impossible de voir le dernier message d'une conversation dans la sidebar
- Toutes les conversations affichent le même texte "Conversation avec Leo"
- Difficile de distinguer les conversations sans ouvrir chacune

**Recommandation**: 
- Charger le dernier message de chaque conversation
- Ou ajouter un champ `last_message` dans l'API de liste des conversations
- Afficher le dernier message réel dans la sidebar

**API disponible**: ✅ `leoAgentAPI.getConversationMessages()` existe mais nécessite un appel par conversation

---

### 2. **Pas de Fonctionnalité de Renommage de Conversation**
**Problème**: Impossible de renommer une conversation existante.

**Code concerné**: 
- Aucun bouton "Renommer" ou double-clic pour éditer le titre
- L'API `updateConversation` existe mais n'est jamais utilisée

**Impact**: 
- Les conversations gardent leur titre initial (probablement généré automatiquement)
- Impossible de personnaliser les titres pour mieux organiser les conversations

**Recommandation**: 
- Ajouter un bouton "Renommer" dans chaque conversation de la sidebar
- Ou permettre le double-clic sur le titre pour l'éditer
- Utiliser `leoAgentAPI.updateConversation()` pour mettre à jour le titre

**API disponible**: ✅ `leoAgentAPI.updateConversation()` existe et fonctionne

---

### 3. **Suggestions Mockées**
**Problème**: Les suggestions sont hardcodées dans `mockSuggestions` au lieu d'être dynamiques.

**Code concerné**: 
```typescript
// Ligne 26-47
const mockSuggestions = [
  {
    icon: TrendingUp,
    text: 'Analyse mes opportunités',
    color: 'purple',
  },
  // ... autres suggestions hardcodées
];
```

**Impact**: 
- Suggestions statiques qui ne s'adaptent pas au contexte
- Pas de suggestions personnalisées basées sur l'historique ou les données de l'utilisateur
- Pas de suggestions basées sur la documentation Leo

**Recommandation**: 
- Générer des suggestions dynamiques basées sur :
  - Les données de l'utilisateur (opportunités récentes, contacts, projets)
  - L'historique des conversations
  - La documentation Leo disponible
- Ou créer un endpoint API pour récupérer des suggestions personnalisées

---

### 4. **Pas de Recherche dans les Conversations**
**Problème**: Impossible de rechercher dans les conversations ou les messages.

**Code concerné**: 
- Aucun champ de recherche dans la sidebar
- Aucun filtre de recherche

**Impact**: 
- Difficile de retrouver une conversation spécifique avec beaucoup de conversations
- Impossible de rechercher dans le contenu des messages

**Recommandation**: 
- Ajouter un champ de recherche dans la sidebar
- Filtrer les conversations par titre
- Optionnellement, rechercher dans le contenu des messages (nécessite un endpoint backend)

---

### 5. **Pas de Pagination Visible pour les Conversations**
**Problème**: Les conversations sont limitées à 50 mais il n'y a pas d'indication ni de pagination.

**Code concerné**: 
```typescript
// Ligne 60
queryFn: () => leoAgentAPI.listConversations({ limit: 50 }),
```

**Impact**: 
- Si l'utilisateur a plus de 50 conversations, les plus anciennes ne sont pas visibles
- Pas de moyen de charger plus de conversations
- Pas d'indication du nombre total de conversations

**Recommandation**: 
- Afficher le nombre total de conversations
- Ajouter un bouton "Charger plus" si nécessaire
- Ou implémenter une pagination complète avec numéros de page

**API disponible**: ✅ L'API supporte `skip` et `limit` mais seule la limite est utilisée

---

### 6. **Pas de Filtrage des Conversations**
**Problème**: Impossible de filtrer les conversations (par date, par titre, etc.).

**Impact**: 
- Difficile de trouver des conversations spécifiques
- Pas d'organisation des conversations

**Recommandation**: 
- Ajouter des filtres (récentes, anciennes, par période)
- Ou permettre le tri (par date, par titre)

---

## ⚠️ Fonctionnalités Manquantes

### 7. **Pas d'Export de Conversation**
**Problème**: Impossible d'exporter une conversation (PDF, texte, etc.).

**Impact**: 
- Impossible de sauvegarder une conversation pour référence externe
- Pas de moyen de partager une conversation

**Recommandation**: 
- Ajouter un bouton "Exporter" dans chaque conversation
- Export vers PDF, texte, ou Markdown
- Inclure tous les messages avec timestamps

---

### 8. **Pas de Partage de Conversation**
**Problème**: Impossible de partager une conversation avec d'autres utilisateurs.

**Impact**: 
- Impossible de collaborer sur une conversation
- Pas de moyen de transférer une conversation

**Recommandation**: 
- Ajouter un bouton "Partager" (si le backend le supporte)
- Générer un lien de partage ou permettre le partage avec d'autres utilisateurs

---

### 9. **Pas d'Affichage des Métadonnées**
**Problème**: Les métadonnées des messages (`metadata`) ne sont pas affichées.

**Code concerné**: 
```typescript
// Ligne 352-384
// Les messages sont affichés mais metadata n'est pas utilisé
```

**Impact**: 
- Informations supplémentaires cachées (usage tokens, modèle utilisé, etc.)
- Pas de visibilité sur les coûts ou la performance

**Recommandation**: 
- Afficher les métadonnées dans un tooltip ou un panneau dépliable
- Afficher le modèle utilisé, les tokens consommés, etc.

---

### 10. **Pas de Gestion des Erreurs pour Certaines Opérations**
**Problème**: Certaines opérations n'ont pas de gestion d'erreurs complète.

**Code concerné**: 
```typescript
// Ligne 114-128
// deleteAllConversations utilise try/catch mais pourrait être amélioré
```

**Impact**: 
- Erreurs silencieuses possibles
- Pas de feedback utilisateur en cas d'échec partiel

**Recommandation**: 
- Améliorer la gestion d'erreurs pour toutes les opérations
- Afficher des messages d'erreur détaillés
- Gérer les cas d'échec partiel (ex: certaines conversations supprimées, d'autres non)

---

### 11. **Pas de Support du Provider dans l'UI**
**Problème**: L'API supporte le choix du provider (`auto`, `openai`, `anthropic`) mais l'UI ne permet pas de le sélectionner.

**Code concerné**: 
```typescript
// Ligne 76-79
// query() est appelé sans spécifier le provider
leoAgentAPI.query({
  message: text,
  conversation_id: activeConversation,
})
```

**Impact**: 
- Impossible de choisir le provider AI (OpenAI vs Anthropic)
- Toujours sur "auto" par défaut

**Recommandation**: 
- Ajouter un sélecteur de provider dans l'interface
- Permettre de choisir entre OpenAI, Anthropic, ou Auto
- Sauvegarder la préférence par conversation ou globalement

**API disponible**: ✅ Le paramètre `provider` existe dans `LeoQueryRequest` mais n'est pas utilisé

---

### 12. **Pas d'Affichage du Statut de l'Assistant**
**Problème**: Le badge "En ligne" est statique et ne reflète pas le vrai statut.

**Code concerné**: 
```typescript
// Ligne 208-213
<Badge className="bg-white/20 text-white border-white/30">
  <div className="flex items-center gap-1">
    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
    <span>En ligne</span>
  </div>
</Badge>
```

**Impact**: 
- Statut toujours "En ligne" même si l'API est indisponible
- Pas de feedback réel sur la disponibilité du service

**Recommandation**: 
- Vérifier le statut réel de l'API
- Afficher "Hors ligne" si l'API n'est pas disponible
- Ou vérifier la configuration des clés API

---

### 13. **Pas de Gestion des Messages en Streaming**
**Problème**: Les messages sont affichés seulement après réception complète, pas en streaming.

**Impact**: 
- Pas de feedback en temps réel pendant la génération de la réponse
- Expérience moins fluide pour les réponses longues

**Recommandation**: 
- Implémenter le streaming si l'API le supporte
- Afficher les messages au fur et à mesure de leur génération
- Améliorer l'expérience utilisateur

---

### 14. **Pas de Fonctionnalité de Copie de Message**
**Problème**: Impossible de copier le contenu d'un message.

**Impact**: 
- Difficile de réutiliser les réponses de Leo
- Doit copier manuellement depuis le texte affiché

**Recommandation**: 
- Ajouter un bouton "Copier" sur chaque message
- Copier le texte dans le presse-papiers
- Afficher une confirmation après copie

---

### 15. **Pas de Fonctionnalité de Régénération de Réponse**
**Problème**: Impossible de régénérer une réponse si elle n'est pas satisfaisante.

**Impact**: 
- Doit reformuler la question pour obtenir une nouvelle réponse
- Pas de moyen de demander une nouvelle réponse à la même question

**Recommandation**: 
- Ajouter un bouton "Régénérer" sur les réponses de l'assistant
- Permettre de régénérer la dernière réponse
- Utiliser le même message mais avec un flag de régénération

---

## 🔗 Connexions API Non Utilisées

### 16. **API updateConversation Non Utilisée**
**Problème**: L'API `updateConversation` existe mais n'est jamais appelée.

**Code disponible**: 
```typescript
// apps/web/src/lib/api/leo-agent.ts ligne 113-126
updateConversation: async (
  conversationId: number,
  updateData: LeoConversationUpdate
): Promise<LeoConversation>
```

**Impact**: 
- Fonctionnalité de renommage complètement absente
- Code disponible mais non connecté

**Recommandation**: 
- Implémenter le renommage de conversation
- Ajouter un bouton ou double-clic pour éditer le titre

---

### 17. **Paramètre Provider Non Utilisé**
**Problème**: Le paramètre `provider` dans `LeoQueryRequest` n'est jamais spécifié.

**Code disponible**: 
```typescript
// apps/web/src/lib/api/leo-agent.ts ligne 39-43
export interface LeoQueryRequest {
  message: string;
  conversation_id?: number | null;
  provider?: 'auto' | 'openai' | 'anthropic';
}
```

**Impact**: 
- Impossible de choisir le provider AI depuis l'interface
- Toujours sur "auto" par défaut

**Recommandation**: 
- Ajouter un sélecteur de provider dans l'UI
- Permettre de choisir le provider pour chaque message ou globalement

---

### 18. **Pagination Non Utilisée**
**Problème**: L'API supporte `skip` et `limit` mais seule `limit` est utilisée, et il n'y a pas de pagination visible.

**Code disponible**: 
```typescript
// apps/web/src/lib/api/leo-agent.ts ligne 65-69
listConversations: async (params?: {
  skip?: number;
  limit?: number;
  user_id?: number;
})
```

**Impact**: 
- Seulement 50 conversations visibles maximum
- Pas de moyen de charger plus

**Recommandation**: 
- Implémenter la pagination avec bouton "Charger plus"
- Ou pagination complète avec numéros de page

---

## 📊 Données Manquantes dans l'Affichage

### 19. **Dernier Message Non Affiché**
**Problème**: Le dernier message de chaque conversation n'est pas affiché dans la sidebar.

**Impact**: 
- Impossible de voir rapidement le contenu d'une conversation
- Toutes les conversations affichent le même placeholder

**Recommandation**: 
- Charger le dernier message de chaque conversation
- Ou modifier l'API pour inclure le dernier message dans la liste

---

### 20. **Métadonnées Non Affichées**
**Problème**: Les métadonnées des messages (`metadata`, `usage`, `model`, `provider`) ne sont pas affichées.

**Impact**: 
- Pas de visibilité sur les coûts (tokens consommés)
- Pas de visibilité sur le modèle utilisé
- Pas de visibilité sur le provider utilisé

**Recommandation**: 
- Afficher les métadonnées dans un panneau dépliable
- Afficher le modèle, les tokens, le provider utilisé

---

### 21. **Nombre Total de Conversations Non Affiché**
**Problème**: Le nombre total de conversations n'est pas affiché.

**Impact**: 
- Impossible de savoir combien de conversations existent au total
- Pas d'indication si toutes les conversations sont chargées

**Recommandation**: 
- Afficher "X conversations" dans la sidebar
- Indiquer si toutes les conversations sont chargées

---

## 🎨 Améliorations UX Suggérées

### 22. **Tri des Conversations**
**Problème**: Les conversations sont triées par défaut mais pas de contrôle utilisateur.

**Recommandation**: 
- Permettre de trier par date (récentes/anciennes)
- Permettre de trier par titre (A-Z, Z-A)

---

### 23. **Marquage de Favoris**
**Problème**: Pas de moyen de marquer des conversations comme favorites.

**Recommandation**: 
- Ajouter un système de favoris
- Filtrer par favoris
- Afficher les favoris en haut de la liste

---

### 24. **Archivage de Conversations**
**Problème**: Pas de moyen d'archiver des conversations sans les supprimer.

**Recommandation**: 
- Ajouter une fonctionnalité d'archivage
- Filtrer les conversations archivées
- Permettre de restaurer les conversations archivées

---

### 25. **Raccourcis Clavier**
**Problème**: Pas de raccourcis clavier pour les actions courantes.

**Recommandation**: 
- `Ctrl+N` ou `Cmd+N` : Nouvelle conversation
- `Ctrl+K` ou `Cmd+K` : Focus sur la recherche
- `Ctrl+/` ou `Cmd+/` : Afficher les raccourcis

---

## ✅ Fonctionnalités Bien Implémentées

1. ✅ **Liste des conversations** - Fonctionne correctement avec React Query
2. ✅ **Affichage des messages** - Fonctionne correctement
3. ✅ **Envoi de messages** - Fonctionne avec gestion d'erreurs
4. ✅ **Suppression de conversation** - Avec confirmation, fonctionne bien
5. ✅ **Suppression de toutes les conversations** - Fonctionne
6. ✅ **Nouvelle conversation** - Bouton fonctionnel
7. ✅ **Suggestions cliquables** - Remplissent le champ de message
8. ✅ **Scroll automatique** - Vers le bas lors de nouveaux messages
9. ✅ **Indicateur de chargement** - Pendant l'envoi de messages
10. ✅ **UI moderne et responsive** - Bien fait
11. ✅ **Gestion d'erreurs de base** - Avec toasts

---

## 📝 Plan d'Action Recommandé

### Priorité HAUTE
1. **Afficher le dernier message réel** - Charger le dernier message de chaque conversation ou modifier l'API
2. **Ajouter fonctionnalité de renommage** - Utiliser `updateConversation` API
3. **Ajouter recherche dans les conversations** - Filtrer par titre dans la sidebar
4. **Ajouter pagination** - Bouton "Charger plus" ou pagination complète
5. **Améliorer les suggestions** - Générer dynamiquement au lieu de hardcoder

### Priorité MOYENNE
6. **Ajouter sélecteur de provider** - Permettre de choisir OpenAI, Anthropic, ou Auto
7. **Afficher métadonnées** - Modèle, tokens, provider dans un panneau dépliable
8. **Ajouter fonctionnalité de copie** - Bouton copier sur chaque message
9. **Ajouter export de conversation** - PDF, texte, Markdown
10. **Améliorer gestion d'erreurs** - Pour toutes les opérations

### Priorité BASSE
11. **Ajouter tri des conversations** - Par date, par titre
12. **Ajouter favoris** - Marquer des conversations comme favorites
13. **Ajouter archivage** - Archiver sans supprimer
14. **Ajouter raccourcis clavier** - Pour les actions courantes
15. **Ajouter régénération de réponse** - Bouton pour régénérer la dernière réponse

---

## 🔧 Modifications Nécessaires

### 1. Afficher le Dernier Message

**Option A**: Modifier l'API pour inclure le dernier message dans la liste des conversations

**Option B**: Charger le dernier message de chaque conversation côté client
```typescript
// Pour chaque conversation, charger le dernier message
const lastMessages = await Promise.all(
  conversations.map(conv => 
    leoAgentAPI.getConversationMessages(conv.id).then(res => res.items[res.items.length - 1])
  )
);
```

### 2. Ajouter le Renommage

Ajouter un bouton "Renommer" ou double-clic sur le titre :
```typescript
const handleRename = async (conversationId: number, newTitle: string) => {
  await leoAgentAPI.updateConversation(conversationId, { title: newTitle });
  queryClient.invalidateQueries({ queryKey: ['leo', 'conversations'] });
};
```

### 3. Ajouter la Recherche

Ajouter un champ de recherche dans la sidebar :
```typescript
const [searchQuery, setSearchQuery] = useState('');
const filteredConversations = conversations.filter(conv => 
  conv.title.toLowerCase().includes(searchQuery.toLowerCase())
);
```

---

## 📌 Conclusion

La page Leo fonctionne bien pour les conversations de base mais manque plusieurs fonctionnalités importantes :
- **Renommage** de conversation (API disponible mais non utilisée)
- **Dernier message** réel dans la sidebar (placeholder hardcodé)
- **Recherche** dans les conversations (absente)
- **Pagination** visible (limite fixe sans indication)
- **Suggestions dynamiques** (hardcodées)
- **Sélecteur de provider** (paramètre API disponible mais non utilisé)
- **Métadonnées** non affichées (modèle, tokens, provider)

Les connexions API de base fonctionnent (liste, messages, envoi, suppression), mais plusieurs fonctionnalités avancées ne sont pas implémentées dans l'interface. L'API supporte plus de fonctionnalités que ce qui est actuellement utilisé dans l'UI.
