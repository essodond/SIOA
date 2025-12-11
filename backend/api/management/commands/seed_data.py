from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from api.models import Company, Counter, Service, Flight, Ticket

class Command(BaseCommand):
    help = 'Seeds the database with initial data for companies, services, counters, flights, and tickets.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('==========================================='))
        self.stdout.write(self.style.SUCCESS(' DÉBUT DE L\'INITIALISATION DES DONNÉES '))
        self.stdout.write(self.style.SUCCESS('==========================================='))

        companies, services = self.initialize_companies_and_services()
        all_counters = self.initialize_counters(companies)
        self.initialize_flights(companies)
        self.initialize_tickets(all_counters)
        
        self.stdout.write(self.style.SUCCESS('\\n==========================================='))
        self.stdout.write(self.style.SUCCESS(' INITIALISATION TERMINÉE AVEC SUCCÈS. '))
        self.stdout.write(self.style.SUCCESS('==========================================='))

    def initialize_companies_and_services(self):
        """Crée les Compagnies et les Services."""
        self.stdout.write("--- 1. Initialisation des Compagnies et Services ---")
        
        COMPANIES_DATA = [
            {"name": "ASKY Airlines", "code": "KP", "service_time": 4},
            {"name": "Ethiopian Airlines", "code": "ET", "service_time": 5},
            {"name": "Air Côte d'Ivoire", "code": "HN", "service_time": 3},
            {"name": "Air Burkina", "code": "2J", "service_time": 3},
            {"name": "Brussels Airlines", "code": "SN", "service_time": 4},
            {"name": "Air France", "code": "AF", "service_time": 5},
            {"name": "Royal Air Maroc", "code": "AT", "service_time": 4},
            {"name": "Kenya Airways", "code": "KQ", "service_time": 4},
            {"name": "Autre Compagnie", "code": "XX", "service_time": 3},
        ]

        SERVICES_DATA = [
            {"name": "Enregistrement & Bagages", "prefix": "C"},
            {"name": "Assistance spéciale", "prefix": "S"},
        ]

        # Création des Services
        for data in SERVICES_DATA:
            Service.objects.get_or_create(name=data['name'], defaults={'prefix': data['prefix']})
            self.stdout.write(f"  Service: {data['name']} créé/vérifié.")

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
            self.stdout.write(f"  Compagnie: {data['name']} ({data['code']}) créé/vérifié.")
            
        return companies, Service.objects.all()

    def generate_counters(self):
        counters = []
        for zone in ['A', 'B']:
            for num in range(1, 13):
                counters.append(f"{zone}{num}")
        return counters

    def initialize_counters(self, companies):
        """Crée les 24 Comptoirs et les assigne à des Compagnies pour les tests."""
        self.stdout.write("\n--- 2. Initialisation et Attribution des Comptoirs ---")
        
        COUNTER_NAMES = self.generate_counters()
        
        af = companies.get('AF')
        et = companies.get('ET')
        at = companies.get('AT')

        all_counters = []

        for name in COUNTER_NAMES:
            assigned_to = None
            status_c = 'LIBRE'
            
            if name in ['A1', 'A2', 'A3', 'A4'] and af:
                assigned_to = af
            elif name in ['A5', 'A6', 'A7'] and et:
                assigned_to = et
            elif name in ['A8', 'A9'] and at:
                assigned_to = at
                status_c = 'OCCUPE'
            
            counter, created = Counter.objects.get_or_create(
                name=name,
                defaults={
                    'assigned_company': assigned_to,
                    'status': status_c
                }
            )
            all_counters.append(counter)
            status_text = f"Assigné à {counter.assigned_company.name}, Statut: {counter.status}" if counter.assigned_company else "LIBRE"
            self.stdout.write(f"  Comptoir {name} créé/vérifié. {status_text}")
        return all_counters

    def initialize_flights(self, companies):
        """Crée quelques Vols pour tester la logique de routage."""
        self.stdout.write("\n--- 3. Initialisation des Vols de test ---")
        
        now = timezone.now()
        
        Flight.objects.get_or_create(
            flight_number='AF480',
            defaults={
                'company': companies.get('AF'),
                'departure_time': now + timedelta(hours=2)
            }
        )
        Flight.objects.get_or_create(
            flight_number='ET901',
            defaults={
                'company': companies.get('ET'),
                'departure_time': now + timedelta(hours=3)
            }
        )
        Flight.objects.get_or_create(
            flight_number='AT511',
            defaults={
                'company': companies.get('AT'),
                'departure_time': now + timedelta(hours=5)
            }
        )
        Flight.objects.get_or_create(
            flight_number='KP305',
            defaults={
                'company': companies.get('KP'),
                'departure_time': now + timedelta(hours=6)
            }
        )
        self.stdout.write("  4 Vols de test créés/vérifiés.")

    def initialize_tickets(self, all_counters):
        """Crée des tickets de test avec différents statuts et associations."""
        self.stdout.write("\n--- 4. Initialisation des Tickets de test ---")
        
        now = timezone.now()
        all_services = Service.objects.all()
        
        self.stdout.write(f"Debug: all_counters type: {type(all_counters)}, len: {len(all_counters) if all_counters else 0}, content: {[c.name for c in all_counters] if all_counters else 'N/A'}")
        self.stdout.write(f"Debug: all_services type: {type(all_services)}, len: {len(all_services) if all_services else 0}, content: {[s.name for s in all_services] if all_services else 'N/A'}")

        if all_counters and all_services:
            counter_a1 = next((c for c in all_counters if c.name == 'A1'), None)
            service_enregistrement = next((s for s in all_services if s.name == 'Enregistrement & Bagages'), None)
            self.stdout.write(f"Debug: counter_a1: {counter_a1}, service_enregistrement: {service_enregistrement}")

            if counter_a1 and service_enregistrement:
                self.stdout.write(f"Debug: Creating ticket AF1001 with counter: {counter_a1.name} (Company: {counter_a1.assigned_company.name if counter_a1.assigned_company else 'N/A'}), Service: {service_enregistrement.name}")
                Ticket.objects.get_or_create(
                    ticket_number='AF1001',
                    defaults={
                        'counter': counter_a1,
                        'service': service_enregistrement,
                        'status': 'WAITING',
                        'flight': Flight.objects.get(flight_number='AF100'),
                        'company': counter_a1.assigned_company,
                        'issue_time': now - timedelta(minutes=random.randint(1, 60))
                    }
                )
                self.stdout.write(f"Debug: Creating ticket AF1002 with counter: {counter_a1.name} (Company: {counter_a1.assigned_company.name if counter_a1.assigned_company else 'N/A'}), Service: {service_enregistrement.name}")
                Ticket.objects.get_or_create(
                    ticket_number='AF1002',
                    defaults={
                        'counter': counter_a1,
                        'service': service_enregistrement,
                        'status': 'WAITING',
                        'flight': Flight.objects.get(flight_number='AF100'),
                        'company': counter_a1.assigned_company,
                        'issue_time': now - timedelta(minutes=random.randint(1, 60))
                    }
                 )                self.stdout.write(\"  2 tickets en attente pour A1 (Air France) créés/vérifiés.\")

            counter_a5 = next((c for c in all_counters if c.name == \'A5\'), None)
            service_assistance = next((s for s in all_services if s.name == \'Assistance spéciale\'), None)
            self.stdout.write(f\"Debug: counter_a5: {counter_a5}, service_assistance: {service_assistance}\")

            if counter_a5 and service_assistance:
                self.stdout.write(f\"Debug: Creating ticket ET2001 with counter: {counter_a5.name} (Company: {counter_a5.assigned_company.name if counter_a5.assigned_company else \'N/A\'}), Service: {service_assistance.name}\")
                Ticket.objects.get_or_create(
                    ticket_number=\'ET2001\',\
                    defaults={\
                        \'counter\': counter_a5,\
                        \'service\': service_assistance,\
                        \'status\': \'CALLED\',\
                        \'created_at\': now - timedelta(minutes=15),\
                        \'called_at\': now - timedelta(minutes=2)\
                    }\
                )\
                self.stdout.write(\"  1 ticket appelé pour A5 (Ethiopian Airlines) créé/vérifié.\")
        else:\
            self.stdout.write(\"  Impossible de créer des tickets de test: comptoirs ou services non disponibles.\")
