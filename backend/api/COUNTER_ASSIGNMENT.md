# 🎯 Stratégie d'Assignation Intelligente des Comptoirs

## Vue d'ensemble

La fonction `assign_counter_to_ticket()` implémente une stratégie d'équilibre de charge pour assigner automatiquement le meilleur comptoir à chaque nouveau ticket.

## Objectif

Garantir une répartition équitable des passagers entre les comptoirs d'une compagnie aérienne en assignant toujours le comptoir avec la **file d'attente la plus courte**.

---

## 🧩 Étapes d'Implémentation

### ✅ 1. Trouver la compagnie à partir du numéro de vol scanné
- **Où** : Dans `GenererTicketEtCalculerTAEView.post()`
- **Comment** : Extraction des 2 premiers caractères du numéro de vol = code IATA
- **Code** : `company = Company.objects.get(code__iexact=company_code)`

### ✅ 2. Trouver tous les comptoirs assignés à cette compagnie
- **Où** : Au début de `assign_counter_to_ticket()`
- **Comment** : Requête filtrée sur `assigned_company`
- **Code** : `Counter.objects.filter(assigned_company=company)`

### ✅ 3. Calculer la charge (tickets en WAITING ou CALLED ou non terminés)
- **Où** : Boucle dans `assign_counter_to_ticket()`
- **Comment** : Compter les tickets avec `status__in=['WAITING', 'CALLED']`
- **Code** :
  ```python
  for counter in open_counters:
      queue_count = Ticket.objects.filter(
          counter=counter,
          status__in=['WAITING', 'CALLED']
      ).count()
      counter_loads[counter] = queue_count
  ```

### ✅ 4. Choisir le comptoir avec la file la plus courte
- **Où** : Dans `assign_counter_to_ticket()`
- **Comment** : Utiliser `min()` avec la clé de charge minimale
- **Code** : `assigned_counter = min(counter_loads, key=counter_loads.get)`

### ✅ 5. Attribuer ce comptoir au nouveau ticket
- **Où** : À la fin de `assign_counter_to_ticket()`
- **Comment** : Assigner et mettre à jour le statut du comptoir
- **Code** :
  ```python
  new_ticket.counter = assigned_counter
  if assigned_counter.status == 'LIBRE':
      assigned_counter.status = 'OCCUPE'
      assigned_counter.save()
  return assigned_counter
  ```

---

## 📊 Exemple de Flux

### Scénario

3 comptoirs assignés à Air France (AF) :
- **A1** : 2 tickets en attente (WAITING/CALLED)
- **A2** : 0 tickets en attente
- **A3** : 1 ticket en attente + statut FERME (fermé)

### Nouveau ticket arrive

1. Code IATA extrait : `AF`
2. Compagnie trouvée : `Air France`
3. Comptoirs ouverts (LIBRE/OCCUPE) : `[A1, A2]` (A3 fermé ignored)
4. Charges calculées :
   - A1 → 2
   - A2 → 0
5. Comptoir choisi : **A2** (charge minimale)
6. Assignation : nouveau ticket → A2
7. Statut A2 : `LIBRE` → `OCCUPE`

---

## 🔧 Paramètres d'Entrée

### `assign_counter_to_ticket(company, new_ticket)`

| Paramètre | Type | Description |
|-----------|------|-------------|
| `company` | `Company` | L'objet compagnie trouvé via le code IATA |
| `new_ticket` | `Ticket` | Le nouveau ticket créé (sans comptoir assigné) |

---

## 📤 Valeur de Retour

| Valeur | Type | Signification |
|--------|------|---------------|
| `assigned_counter` | `Counter` \| `None` | Le comptoir assigné ou `None` si aucun comptoir n'est ouvert |

---

## ⚠️ Cas Limites Gérés

### 1. Aucun comptoir ouvert pour la compagnie
```python
if not open_counters.exists():
    return None
```
**Résultat** : Ticket créé sans comptoir assigné

### 2. Plusieurs comptoirs ont la même charge
```python
assigned_counter = min(counter_loads, key=counter_loads.get)
```
**Résultat** : Le premier trouvé dans la requête est sélectionné

### 3. Les comptoirs FERME ne sont pas pris en compte
```python
open_counters = all_counters.filter(status__in=['LIBRE', 'OCCUPE'])
```
**Résultat** : Seuls les comptoirs ouverts sont considérés

### 4. Seuls les tickets actifs sont comptabilisés
```python
status__in=['WAITING', 'CALLED']
```
**Résultat** : Les tickets DONE et CANCELLED n'affectent pas la charge

---

## 🧪 Tests Unitaires

Le fichier `tests.py` contient 5 tests pour valider la fonction :

1. **test_assign_counter_with_shortest_queue** : Vérifier que le comptoir avec la file la plus courte est assigné
2. **test_assign_counter_ignores_non_open_counters** : Ignorer les comptoirs fermés
3. **test_assign_counter_counts_only_active_tickets** : Compter uniquement les tickets actifs
4. **test_no_open_counters_returns_none** : Retourner `None` si aucun comptoir n'est ouvert
5. **test_counter_status_updated_to_occupe** : Vérifier que le statut passe à OCCUPE

### Exécution des tests

```bash
python manage.py test api.tests.AssignCounterToTicketTestCase
```

---

## 📍 Fichiers Modifiés

### [backend/api/views.py](backend/api/views.py)
- ✅ Fonction `assign_counter_to_ticket()` ajoutée (lignes 16-67)
- ✅ Vue `GenererTicketEtCalculerTAEView` mise à jour (lignes 178-187)

### [backend/api/tests.py](backend/api/tests.py)
- ✅ Tests unitaires `AssignCounterToTicketTestCase` ajoutés

---

## 💡 Améliorations Futures

- [ ] Intégrer des poids de priorité pour les comptoirs (ex: comptoirs express)
- [ ] Prendre en compte les temps de service moyens par comptoir
- [ ] Implémenter une file d'attente virtuelle pour prévoir les assignations futures
- [ ] Ajouter des logs pour tracer les assignations
- [ ] Implémenter un mécanisme de rééquilibrage en temps réel

---

## 🔗 Références

- Modèles associés : `Company`, `Counter`, `Ticket`, `Service`, `Flight`
- Vue appelante : `GenererTicketEtCalculerTAEView`
- Endpoint : `POST /api/generer-ticket/`
