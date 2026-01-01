# Guide de Test - Card Component V2

## 🚀 Accès Rapide

### Option 1 : Page de Démonstration (Recommandé)

Accédez à la page de démonstration via :
```
/fr/dashboard/test/card-demo
```

ou

```
http://localhost:3000/fr/dashboard/test/card-demo
```

Cette page affiche tous les variants du nouveau composant Card avec des exemples interactifs.

### Option 2 : Utilisation Directe dans le Code

```tsx
// Dans n'importe quel composant
import Card from '@/components/ui/Card.v2';

// Test d'un variant stats
<Card 
  variant="stats"
  statsTitle="Total Users"
  statsValue="1,234"
  statsChange={{ value: 12, type: 'increase' }}
/>
```

## 📋 Tests à Effectuer

### 1. Variants de Base

- [ ] **Default** : Card standard avec title, subtitle, footer
- [ ] **Stats** : Affichage de statistiques avec icône et changement
- [ ] **Status** : Card avec statut coloré (success, error, warning, info)
- [ ] **Pricing** : Card de prix avec features et bouton

### 2. Variants Visuels

- [ ] **Glass** : Vérifier que le glassmorphism fonctionne (backdrop blur visible)
- [ ] **Elevated** : Ombre plus prononcée
- [ ] **Outlined** : Bordure uniquement, pas de fond
- [ ] **Filled** : Fond rempli avec couleur muted

### 3. Intégration Thème

- [ ] Vérifier que les couleurs du thème s'appliquent correctement
- [ ] Tester en mode clair et sombre
- [ ] Vérifier que le glassmorphism ne se fait pas écraser par le thème
- [ ] Tester avec différents thèmes si disponibles

### 4. Interactions

- [ ] Card avec `hover` : effet au survol
- [ ] Card avec `onClick` : clic fonctionne
- [ ] Pricing card : bouton d'action fonctionne
- [ ] Navigation clavier (Tab, Enter, Espace)

### 5. Responsive

- [ ] Tester sur mobile (< 768px)
- [ ] Tester sur tablette (768px - 1024px)
- [ ] Tester sur desktop (> 1024px)
- [ ] Vérifier que les grilles s'adaptent

## 🐛 Problèmes à Vérifier

### Glassmorphism
- ✅ Le backdrop blur doit être visible
- ✅ Le fond doit être transparent
- ✅ Les bordures doivent être subtiles
- ❌ Le thème ne doit PAS écraser les styles glassmorphism

### Stats Card
- ✅ Les valeurs s'affichent correctement
- ✅ Les changements (increase/decrease) sont colorés
- ✅ L'icône s'affiche à droite
- ✅ Le trend personnalisé fonctionne

### Status Card
- ✅ Les couleurs de statut sont correctes
- ✅ Success = vert, Error = rouge, Warning = jaune, Info = bleu
- ✅ Le texte est lisible sur chaque couleur

### Pricing Card
- ✅ Le prix s'affiche correctement
- ✅ Le badge "Most Popular" apparaît si `pricingPopular={true}`
- ✅ Les features s'affichent avec des checkmarks
- ✅ Le bouton fonctionne

## 📝 Checklist de Validation

Avant de considérer le composant comme prêt :

- [ ] Tous les variants s'affichent correctement
- [ ] Pas d'erreurs dans la console
- [ ] Pas de warnings React
- [ ] Les styles sont cohérents
- [ ] Le glassmorphism fonctionne sans conflit
- [ ] Le thème s'applique correctement
- [ ] Responsive sur tous les breakpoints
- [ ] Accessibilité (navigation clavier, ARIA labels)
- [ ] Performance (pas de lag, animations fluides)

## 🔍 Tests Comparatifs

Comparez avec les anciens composants :

### StatsCard vs Card variant="stats"
```tsx
// Ancien
<StatsCard title="Users" value="1234" />

// Nouveau
<Card variant="stats" statsTitle="Users" statsValue="1234" />
```

Vérifiez que :
- ✅ L'apparence est identique ou meilleure
- ✅ Les fonctionnalités sont préservées
- ✅ Les performances sont équivalentes ou meilleures

## 💡 Conseils de Test

1. **Testez dans différents contextes** :
   - Sur une page avec fond clair
   - Sur une page avec fond sombre
   - Sur une page avec gradient (pour glassmorphism)

2. **Testez avec différents contenus** :
   - Textes courts et longs
   - Avec et sans icônes
   - Avec et sans actions

3. **Testez les cas limites** :
   - Valeurs très grandes (ex: 999,999,999)
   - Textes très longs
   - Beaucoup de features dans pricing card

4. **Testez les interactions** :
   - Clics rapides
   - Navigation clavier
   - Touch sur mobile

## 📊 Résultats Attendus

Après les tests, vous devriez avoir :
- ✅ Un composant fonctionnel et cohérent
- ✅ Tous les variants opérationnels
- ✅ Intégration thème sans conflits
- ✅ Glassmorphism fonctionnel
- ✅ Performance optimale

## 🚨 Signaler un Problème

Si vous trouvez un problème :
1. Notez le variant concerné
2. Notez les étapes pour reproduire
3. Capturez une capture d'écran si possible
4. Vérifiez la console pour les erreurs
5. Documentez dans `CARD_REFACTORING_STATUS.md`
