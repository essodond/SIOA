# 📚 Guide d'Utilisation - Assignation Intelligente des Comptoirs

## Description Rapide

La fonction `assign_counter_to_ticket()` assigne automatiquement le meilleur comptoir à un passager en choisissant celui avec la **file d'attente la plus courte**.

---

## 🚀 Usage Basique

### Dans `GenererTicketEtCalculerTAEView`

```python
# Contexte : Un nouveau ticket vient d'être créé
new_ticket = Ticket(
    ticket_number=ticket_number_input,  # Ex: "AF480"
    service=service,
    status="WAITING"
)
new_ticket.save()

# 🎯 Assigner le meilleur comptoir
try:
    assigned_counter = assign_counter_to_ticket(company, new_ticket)
    
    if assigned_counter:
        print(f"✅ Ticket assigné au comptoir {assigned_counter.name}")
    else:
        print("⚠️ Aucun comptoir disponible")
        
except Exception as e:
    print(f"❌ Erreur lors de l'assignation : {e}")
```

---

## 📊 Exemples de Scénarios

### Scénario 1 : Distribution Normale

**État Initial:**
```
Compagnie: Air France (AF)
├─ Comptoir A1 (LIBRE) → 1 ticket
├─ Comptoir A2 (OCCUPE) → 3 tickets
└─ Comptoir A3 (LIBRE) → 2 tickets
```

**Nouveau Ticket Arrive:**
```
assign_counter_to_ticket(air_france_company, new_ticket)
```

**Résultat:**
```
✅ Assigné à A1 (charge la plus courte = 1)

État Final:
├─ Comptoir A1 (OCCUPE) → 2 tickets ← NOUVEAU
├─ Comptoir A2 (OCCUPE) → 3 tickets
└─ Comptoir A3 (LIBRE) → 2 tickets
```

### Scénario 2 : Comptoir Fermé

**État Initial:**
```
Compagnie: Swiss International (SR)
├─ Comptoir B1 (FERME) → 0 tickets ← Fermé
├─ Comptoir B2 (LIBRE) → 2 tickets
└─ Comptoir B3 (OCCUPE) → 1 ticket
```

**Nouveau Ticket Arrive:**
```
assigned_counter = assign_counter_to_ticket(swiss_company, new_ticket)
```

**Résultat:**
```
✅ Assigné à B3 (charge minimale parmi comptoirs ouverts)
⚠️ B1 (FERME) est ignoré

État Final:
├─ Comptoir B1 (FERME) → 0 tickets (ignoré)
├─ Comptoir B2 (LIBRE) → 2 tickets
└─ Comptoir B3 (OCCUPE) → 2 tickets ← NOUVEAU
```

### Scénario 3 : Tous les Comptoirs Pleins

**État Initial:**
```
Compagnie: Lufthansa (LH)
├─ Comptoir C1 (OCCUPE) → 5 tickets
├─ Comptoir C2 (OCCUPE) → 5 tickets
└─ Comptoir C3 (OCCUPE) → 5 tickets
```

**Nouveau Ticket Arrive:**
```
assigned_counter = assign_counter_to_ticket(lufthansa_company, new_ticket)
```

**Résultat:**
```
✅ Assigné à C1 (première trouvée avec charge minimale)

État Final:
├─ Comptoir C1 (OCCUPE) → 6 tickets ← NOUVEAU
├─ Comptoir C2 (OCCUPE) → 5 tickets
└─ Comptoir C3 (OCCUPE) → 5 tickets
```

### Scénario 4 : Aucun Comptoir Disponible

**État Initial:**
```
Compagnie: Qatar Airways (QR)
└─ Comptoir D1 (FERME) → 0 tickets ← Le seul comptoir est fermé
```

**Nouveau Ticket Arrive:**
```
assigned_counter = assign_counter_to_ticket(qatar_company, new_ticket)
```

**Résultat:**
```
⚠️ assigned_counter = None
   (Aucun comptoir ouvert pour cette compagnie)

État Final:
└─ Comptoir D1 (FERME) → 0 tickets
   Ticket créé sans assignation
```

---

## 🔍 Exemple Détaillé : Processus Complet

### 1️⃣ Passager Scanne son Billet

```
Entrée : Numéro de vol AF480
```

### 2️⃣ Création du Ticket

```python
# Dans GenererTicketEtCalculerTAEView.post()
ticket_number_input = "AF480"
company_code = "AF"  # 2 premiers caractères

# Trouver la compagnie
company = Company.objects.get(code__iexact="AF")
# company = <Company: Air France>

# Créer le ticket
new_ticket = Ticket(
    ticket_number="AF480",
    service=service,
    status="WAITING"
)
new_ticket.save()
# new_ticket.id = 42
# new_ticket.queue_number = "A001" (généré automatiquement)
```

### 3️⃣ Assignation Intelligente du Comptoir

```python
# Appel de la fonction magique
assigned_counter = assign_counter_to_ticket(company, new_ticket)

# Inside the function:
# 1. Tous les comptoirs AF : [A1, A2, A3, ...]
# 2. Ouverts seulement : [A1, A2] (A3 fermé ignoré)
# 3. Charge calculée:
#    - A1 : 2 tickets (WAITING/CALLED)
#    - A2 : 0 tickets
# 4. Min = A2
# 5. Assigner new_ticket → A2
```

### 4️⃣ Réponse au Passager

```json
{
  "queue_number": "A001",
  "estimated_waiting_time_minutes": 0,
  "details": "Basé sur 0 personnes devant et 2 comptoirs actifs de Air France.",
  "company": "Air France",
  "assigned_counter": "A2"
}
```

### 5️⃣ État de la Base de Données

```
Ticket 42:
  - ticket_number: "AF480"
  - queue_number: "A001"
  - counter: A2
  - status: "WAITING"

Counter A2:
  - name: "A2"
  - assigned_company: Air France
  - status: "OCCUPE" ← Changé de LIBRE
```

---

## 🧮 Formule de Calcul de Charge

Pour chaque comptoir :

```
queue_count = nombre de tickets avec status ∈ {WAITING, CALLED}
```

**Statuts comptabilisés:**
- ✅ WAITING (en attente)
- ✅ CALLED (appelé)

**Statuts ignorés:**
- ❌ DONE (terminé)
- ❌ CANCELLED (annulé)

---

## 🎛️ Configuration des Comptoirs

### Ajouter des Comptoirs à une Compagnie

```python
# En ligne de commande Django
company = Company.objects.get(code="AF")

counters = [
    Counter.objects.create(name="A1", assigned_company=company, status="LIBRE"),
    Counter.objects.create(name="A2", assigned_company=company, status="LIBRE"),
    Counter.objects.create(name="A3", assigned_company=company, status="OCCUPE"),
]
```

### Fermer un Comptoir

```python
counter = Counter.objects.get(name="A3")
counter.status = "FERME"
counter.save()
# Désormais, il ne sera plus considéré pour les assignations
```

### Réouvrir un Comptoir

```python
counter.status = "LIBRE"
counter.save()
# À nouveau disponible pour les assignations
```

---

## 🐛 Dépannage

### Problème : Tous les tickets vont au même comptoir

**Cause possible:** Seul 1 comptoir est assigné à la compagnie

**Solution:**
```python
# Vérifier les comptoirs assignés
counters = Counter.objects.filter(assigned_company=company)
print(f"Comptoirs trouvés: {[c.name for c in counters]}")

# Ajouter plus de comptoirs si nécessaire
Counter.objects.create(name="A4", assigned_company=company, status="LIBRE")
```

### Problème : `assigned_counter` est None

**Cause possible:** Tous les comptoirs de la compagnie sont FERME

**Solution:**
```python
# Vérifier le statut des comptoirs
counters = Counter.objects.filter(assigned_company=company)
for c in counters:
    print(f"{c.name}: {c.status}")

# Rouvrir un comptoir
counter = Counter.objects.get(name="A1")
counter.status = "LIBRE"
counter.save()
```

### Problème : La distribution n'est pas équilibrée

**Cause possible:** Les tickets ne se terminent pas assez vite

**Solution:** Vérifier que les statuts de tickets sont bien mis à jour:
```python
# Assurer que les tickets sont marqués DONE
ticket = Ticket.objects.get(pk=1)
ticket.status = "DONE"
ticket.save()
# Après cela, ce ticket n'affecte plus la charge
```

---

## 📈 Métriques Utiles

### Charge Moyenne par Comptoir

```python
from django.db.models import Avg, Count

avg_queue_length = (
    Ticket.objects
    .filter(status__in=['WAITING', 'CALLED'])
    .values('counter__name')
    .annotate(queue_count=Count('id'))
    .aggregate(avg_queue=Avg('queue_count'))
)
print(f"Charge moyenne: {avg_queue_length['avg_queue']:.2f} tickets/comptoir")
```

### Comptoir le Plus Chargé

```python
busiest_counter = (
    Counter.objects
    .annotate(queue_count=Count('tickets', filter=Q(tickets__status__in=['WAITING', 'CALLED'])))
    .order_by('-queue_count')
    .first()
)
print(f"Plus chargé: {busiest_counter.name} ({busiest_counter.queue_count} tickets)")
```

### Efficacité de Distribution

```python
# Variance de charge (plus basse = mieux équilibrée)
import statistics

loads = [counter_loads[c] for c in counters]
variance = statistics.variance(loads)
print(f"Variance de charge: {variance:.2f}")
```

---

## ✅ Checklist de Vérification

- [ ] La compagnie a au moins 1 comptoir assigné
- [ ] Au moins 1 comptoir a le statut "LIBRE" ou "OCCUPE"
- [ ] Les tickets sont correctement marqués DONE quand terminés
- [ ] Les requêtes de comptoirs sont correctement filtrées
- [ ] Les tests unitaires passent tous
- [ ] Les assignations sont distribuées de manière équitable

---

## 📞 Support

Pour plus d'informations :
- Consulter `COUNTER_ASSIGNMENT.md` pour l'architecture
- Lire les tests dans `tests.py` pour des exemples
- Vérifier les logs Django pour déboguer
