import os
import django
from django.utils import timezone
from datetime import timedelta

# Configuration de l'environnement Django
# Remplacez 'votre_projet' par le nom de votre projet Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')
django.setup()

# Importation des modèles après la configuration de Django
from api.models import Company, Counter, Service, Flight, Ticket

# --- VARIABLES ET DONNÉES À INITIALISER ---

# Compagnies avec leur code IATA (crucial pour le routage des tickets)
# et un temps de service moyen estimé.
COMPANIES_DATA = [
    {"name": "ASKY Airlines", "code": "KP", "service_time": 4},
    {"name": "Ethiopian Airlines", "code": "ET", "service_time": 5},
    {"name": "Air Côte d'Ivoire", "code": "HN", "service_time": 3},
    {"name": "Air Burkina", "code": "2J", "service_time": 3},
    {"name": "Brussels Airlines", "code": "SN", "service_time": 4},
    {"name": "Air France", "code": "AF", "service_time": 5},
    {"name": "Royal Air Maroc", "code": "AT", "service_time": 4},
    {"name": "Kenya Airways", "code": "KQ", "service_time": 4},
    {"name": "Autre Compagnie", "code": "XX", "service_time": 3}, # Pour les tests génériques
]

# Services de file d'attente
SERVICES_DATA = [
    {"name": "Enregistrement & Bagages", "prefix": "C"},
    {"name": "Assistance spéciale", "prefix": "S"},
]

# Comptoirs (pour les zones A et B)
# Note : Nous initialisons ici les 24 comptoirs A1-A12 et B1-B12.
def generate_counters():
    counters = []
    for zone in ['A', 'B']:
        for num in range(1, 13):
            counters.append(f"{zone}{num}")
    return counters

# --- FONCTIONS D'INITIALISATION ---

def initialize_companies_and_services():
    """Crée les Compagnies et les Services."""
    print("--- 1. Initialisation des Compagnies et Services ---")
    
    # Création des Services
    for data in SERVICES_DATA:
        Service.objects.get_or_create(name=data['name'], defaults={'prefix': data['prefix']})
        print(f"  Service: {data['name']} créé/vérifié.")

    # Création des Compagnies
    companies = {}
    for data in COMPANIES_DATA:
        company, created = Company.objects.get_or_create(
            code=data['code'],
            defaults={
                'name': data['name'],
                'average_service_time_minutes': data['service_time']
            }
        )
        companies[data['code']] = company
        print(f"  Compagnie: {data['name']} ({data['code']}) créé/vérifié.")
        
    return companies, Service.objects.all()

def initialize_counters(companies):
    """Crée les 24 Comptoirs et les assigne à des Compagnies pour les tests."""
    print("\n--- 2. Initialisation et Attribution des Comptoirs ---")
    
    COUNTER_NAMES = generate_counters()
    
    # Exemple d'attribution pour les tests:
    # A1-A4: Air France (AF)
    # A5-A7: Ethiopian Airlines (ET)
    # A8-A9: Royal Air Maroc (AT)
    # Reste (A10-B12): Non attribué (LIBRE par défaut)
    
    af = companies.get('AF')
    et = companies.get('ET')
    at = companies.get('AT')

    all_counters = [] # Added this line

    for name in COUNTER_NAMES:
        assigned_to = None
        status_c = 'LIBRE'
        
        # Logique d'attribution
        if name in ['A1', 'A2', 'A3', 'A4'] and af:
            assigned_to = af
        elif name in ['A5', 'A6', 'A7'] and et:
            assigned_to = et
        elif name in ['A8', 'A9'] and at:
            assigned_to = at
            status_c = 'OCCUPE' # Pour simuler un comptoir déjà en service
        
        counter, created = Counter.objects.get_or_create(
            name=name,
            defaults={
                'assigned_company': assigned_to,
                'status': status_c
            }
        )
        all_counters.append(counter)
        status_text = f"Assigné à {counter.assigned_company.name}, Statut: {counter.status}" if counter.assigned_company else "LIBRE"
        print(f"  Comptoir {name} créé/vérifié. {status_text}")
    return all_counters
def initialize_flights(companies):
    """Crée quelques Vols pour tester la logique de routage."""
    print("\n--- 3. Initialisation des Vols de test ---")
    
    now = timezone.now()
    
    # Vol AF480 (Air France) - Départ dans 2 heures
    Flight.objects.get_or_create(
        flight_number='AF480',
        defaults={
            'company': companies.get('AF'),
            'departure_time': now + timedelta(hours=2)
        }
    )
    # Vol ET901 (Ethiopian Airlines) - Départ dans 3 heures
    Flight.objects.get_or_create(
        flight_number='ET901',
        defaults={
            'company': companies.get('ET'),
            'departure_time': now + timedelta(hours=3)
        }
    )
    # Vol AT511 (Royal Air Maroc) - Départ dans 5 heures
    Flight.objects.get_or_create(
        flight_number='AT511',
        defaults={
            'company': companies.get('AT'),
            'departure_time': now + timedelta(hours=5)
        }
    )
    # Vol KP305 (ASKY) - Départ dans 6 heures
    Flight.objects.get_or_create(
        flight_number='KP305',
        defaults={
            'company': companies.get('KP'),
            'departure_time': now + timedelta(hours=6)
        }
    )
    print("  4 Vols de test créés/vérifiés.")


def initialize_tickets(all_counters):
    """Crée des tickets de test avec différents statuts et associations."""
    print("\n--- 4. Initialisation des Tickets de test ---")
    
    now = timezone.now()
    all_services = Service.objects.all()
    
    print(f"Debug: all_counters type: {type(all_counters)}, len: {len(all_counters) if all_counters else 0}, content: {[c.name for c in all_counters] if all_counters else 'N/A'}")
    print(f"Debug: all_services type: {type(all_services)}, len: {len(all_services) if all_services else 0}, content: {[s.name for s in all_services] if all_services else 'N/A'}")

    # Créer quelques tickets en attente pour le comptoir A1 (Air France)
    if all_counters and all_services:
        counter_a1 = next((c for c in all_counters if c.name == 'A1'), None)
        service_enregistrement = next((s for s in all_services if s.name == 'Enregistrement & Bagages'), None)
        print(f"Debug: counter_a1: {counter_a1}, service_enregistrement: {service_enregistrement}")

        if counter_a1 and service_enregistrement:
            print(f"Debug: Creating ticket AF1001 with counter: {counter_a1.name} (Company: {counter_a1.assigned_company.name if counter_a1.assigned_company else 'N/A'}), Service: {service_enregistrement.name}")
            Ticket.objects.get_or_create(
                ticket_number='AF1001',
                defaults={
                    'counter': counter_a1,
                    'service': service_enregistrement,
                    'status': 'WAITING',
                    'created_at': now - timedelta(minutes=10)
                }
            )
            print(f"Debug: Creating ticket AF1002 with counter: {counter_a1.name} (Company: {counter_a1.assigned_company.name if counter_a1.assigned_company else 'N/A'}), Service: {service_enregistrement.name}")
            Ticket.objects.get_or_create(
                ticket_number='AF1002',
                defaults={
                    'counter': counter_a1,
                    'service': service_enregistrement,
                    'status': 'WAITING',
                    'created_at': now - timedelta(minutes=5)
                }
            )
            print("  2 tickets en attente pour A1 (Air France) créés/vérifiés.")

        # Créer un ticket appelé pour le comptoir A5 (Ethiopian Airlines)
        counter_a5 = next((c for c in all_counters if c.name == 'A5'), None)
        service_assistance = next((s for s in all_services if s.name == 'Assistance spéciale'), None)
        print(f"Debug: counter_a5: {counter_a5}, service_assistance: {service_assistance}")

        if counter_a5 and service_assistance:
            print(f"Debug: Creating ticket ET2001 with counter: {counter_a5.name} (Company: {counter_a5.assigned_company.name if counter_a5.assigned_company else 'N/A'}), Service: {service_assistance.name}")
            Ticket.objects.get_or_create(
                ticket_number='ET2001',
                defaults={
                    'counter': counter_a5,
                    'service': service_assistance,
                    'status': 'CALLED',
                    'created_at': now - timedelta(minutes=15),
                    'called_at': now - timedelta(minutes=2)
                }
            )
            print("  1 ticket appelé pour A5 (Ethiopian Airlines) créé/vérifié.")
    else:
        print("  Impossible de créer des tickets de test: comptoirs ou services non disponibles.")

def run_initialization():
    """Fonction principale."""
    print("===========================================")
    print(" DÉBUT DE L'INITIALISATION DES DONNÉES ")
    print("===========================================")

    companies, services = initialize_companies_and_services()
    all_counters = initialize_counters(companies)
    initialize_flights(companies)
    initialize_tickets(all_counters)
    
    print("\n===========================================")
    print(" INITIALISATION TERMINÉE AVEC SUCCÈS. ")
    print("===========================================")


if __name__ == '__main__':
    run_initialization()