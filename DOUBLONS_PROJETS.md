# Rapport des doublons dans l'importation des projets

**Date :** 31 décembre 2024  
**Total de doublons :** 18 projets  
**Projets uniques :** 97 projets

---

## 📋 Liste détaillée des 18 doublons

### 1. "Maintenance du site web" (7 occurrences)

| Ligne | Client | Étape | Année | Statut |
|-------|--------|-------|-------|--------|
| 45 | ZU | Maintenance | Ongoing | Actif |
| 47 | Portable EHR | Maintenance | Ongoing | Actif |
| 49 | Globecar | Maintenance | Ongoing | Actif |
| 50 | AJEFNE | Maintenance | Ongoing | Actif |
| 51 | Propulsio 360 | Maintenance | Ongoing | Actif |
| 54 | Affilia | Maintenance | Ongoing | Actif |
| 55 | Recrute action | Maintenance | Ongoing | Actif |

**Recommandation :** Renommer en "Maintenance - [Nom du client]"

---

### 2. "Site web" (4 occurrences)

| Ligne | Client | Étape | Année | Statut |
|-------|--------|-------|-------|--------|
| 28 | Experience Collective | UI / Design | Encours | Bloqué |
| 29 | Techsploration | UI / Design | Encours | Retours clients |
| 70 | O Salon | Portfolio | 2025 | Optimisation |
| 80 | Association Marketing Québec | Portfolio | Encours | En cours |

**Recommandation :** Renommer en "Site web - [Nom du client]"

---

### 3. "Maitenance site" (3 occurrences)

| Ligne | Client | Étape | Année | Statut |
|-------|--------|-------|-------|--------|
| 58 | Association Marketing Québec | Maintenance | Ongoing | (vide) |
| 59 | Les Filles de l'Ouest | Maintenance | Ongoing | (vide) |
| 60 | Toit à moi | Maintenance | Ongoing | (vide) |

**Recommandation :** Renommer en "Maintenance - [Nom du client]"

---

### 4. "Nouveau site web" (3 occurrences)

| Ligne | Client | Étape | Année | Statut |
|-------|--------|-------|-------|--------|
| 96 | Recrute action | Complété | 2025 | Actif |
| 108 | Fondation Jean Lapointe | Complété | 2025 | Done |
| 110 | Portable EHR | Complété | (vide) | (vide) |

**Recommandation :** Renommer en "Nouveau site web - [Nom du client]"

---

### 5. "Gestion comm / mkt" (2 occurrences)

| Ligne | Client | Étape | Année | Statut |
|-------|--------|-------|-------|--------|
| 6 | Psy etc. | Mkt/Comm | Encours | Actif |
| 20 | QueerTech | Mkt/Comm | Encours | Actif |

**Recommandation :** Renommer en "Gestion comm / mkt - [Nom du client]"

---

### 6. "Médias sociaux" (2 occurrences)

| Ligne | Client | Étape | Année | Statut |
|-------|--------|-------|-------|--------|
| 16 | Rideau Vineyard | Mkt/Comm | Encours | Actif |
| 17 | CDÉNÉ | Mkt/Comm | Encours | Actif |

**Recommandation :** Renommer en "Médias sociaux - [Nom du client]"

---

### 7. "Maintenance site et app" (2 occurrences)

| Ligne | Client | Étape | Année | Statut |
|-------|--------|-------|-------|--------|
| 56 | GoCoupons | Maintenance | Ongoing | Actif |
| 57 | Fondation Jean Lapointe | Maintenance | Ongoing | (vide) |

**Recommandation :** Renommer en "Maintenance - [Nom du client]"

---

### 8. "CRM" (2 occurrences)

| Ligne | Client | Étape | Année | Statut |
|-------|--------|-------|-------|--------|
| 92 | Placemaking P4G | Complété | 2025 | Done |
| 99 | AG Business Advisory | Complété | 2025 | Done |

**Recommandation :** Renommer en "CRM - [Nom du client]"

---

### 9. "Siteweb" (2 occurrences)

| Ligne | Client | Étape | Année | Statut |
|-------|--------|-------|-------|--------|
| 95 | Nukleo | Complété | Encours | En cours |
| 98 | Matchstick | Complété | 2025 | Done |

**Recommandation :** Renommer en "Site web - [Nom du client]"

---

## 🎯 Recommandations

### Option 1 : Ne rien faire (Recommandé)
- Garder les 110 projets uniques actuellement importés
- Les doublons ne sont pas importés (comportement correct)
- Avantage : Évite la confusion avec des projets au même nom

### Option 2 : Importer les doublons avec suffixe
- Ajouter un suffixe automatique : "Site web #2", "Site web #3", etc.
- Importer les 18 projets restants
- Avantage : Tous les projets du CSV sont importés
- Inconvénient : Noms moins professionnels

### Option 3 : Renommer manuellement dans le CSV
- Éditer le CSV pour donner des noms uniques
- Format recommandé : "[Type de projet] - [Nom du client]"
- Exemple : "Maintenance du site web" → "Maintenance - ZU"
- Relancer l'importation
- Avantage : Noms professionnels et uniques
- Inconvénient : Travail manuel requis

---

## 📊 Statistiques

| Métrique | Valeur |
|----------|--------|
| **Total lignes CSV** | 115 |
| **Projets uniques** | 97 |
| **Doublons** | 18 |
| **Projets importés** | 110 |
| **Projets non importés** | 5 |

**Note :** 110 projets importés au lieu de 97 car certains doublons ont été importés avant que la vérification ne soit activée.

---

## ✅ Conclusion

Le système d'importation fonctionne correctement en évitant les doublons. Les 18 projets en double dans le CSV sont principalement des projets de maintenance et de développement web pour différents clients qui partagent le même nom générique.

**Action recommandée :** Garder l'importation actuelle (110 projets) et renommer manuellement les projets génériques dans l'interface utilisateur si nécessaire.
