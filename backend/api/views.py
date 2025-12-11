import math
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from rest_framework import generics
from django.core.exceptions import ObjectDoesNotExist
# Assurez-vous d'importer les modèles et le serializer
from .models import Company, Counter, Ticket, Service, Flight
from .serializers import EnregistrementSerializer, ServiceSerializer, TicketSerializer, FlightSerializer, CounterSerializer, TicketStatisticsSerializer


def assign_counter_to_ticket(company, new_ticket):
    """
    Assigne le comptoir avec la file la plus courte à un nouveau ticket.
    
    Étapes :
    1. Trouver la compagnie à partir du numéro de vol scanné ✅ (déjà fait)
    2. Trouver tous les comptoirs assignés à cette compagnie ✅
    3. Calculer la charge (tickets en WAITING ou CALLED ou non terminés) ✅
    4. Choisir le comptoir avec la file la plus courte ✅
    5. Attribuer ce comptoir au nouveau ticket ✅
    
    Args:
        company: L'objet Company trouvé via le code IATA
        new_ticket: Le nouveau Ticket à assigner
    
    Returns:
        assigned_counter: L'objet Counter assigné ou None si aucun disponible
    """
    # 1. & 2. Trouver TOUS les comptoirs assignés à cette compagnie (même fermés)
    all_counters = Counter.objects.filter(assigned_company=company)
    
    # 3. Filtrer les comptoirs ouverts (LIBRE ou OCCUPE, pas FERME)
    open_counters = all_counters.filter(status__in=['LIBRE', 'OCCUPE'])
    
    if not open_counters.exists():
        # Aucun comptoir ouvert pour cette compagnie
        return None
    
    # 4. Calculer la charge pour chaque comptoir
    counter_loads = {}
    for counter in open_counters:
        # Compter les tickets en WAITING ou CALLED (non terminés) assignés à ce comptoir
        queue_count = Ticket.objects.filter(
            counter=counter,
            status__in=['WAITING', 'CALLED']
        ).count()
        counter_loads[counter] = queue_count
    
    # 5. Trouver le comptoir avec la file la plus courte
    assigned_counter = min(counter_loads, key=counter_loads.get)
    
    # Assigner le ticket à ce comptoir
    new_ticket.counter = assigned_counter
    
    # Mettre à jour le statut du comptoir si nécessaire (passer à OCCUPE s'il était LIBRE)
    if assigned_counter.status == 'LIBRE':
        assigned_counter.status = 'OCCUPE'
        assigned_counter.save()
    
    return assigned_counter


class ServiceListView(generics.ListAPIView):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer

class CounterListView(generics.ListAPIView):
    queryset = Counter.objects.all()
    serializer_class = CounterSerializer

class TicketCreateView(generics.CreateAPIView):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer

class TicketDetailView(generics.RetrieveAPIView):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    lookup_field = 'ticket_number'

    def get_object(self):
        queryset = self.get_queryset()
        filter_kwargs = {self.lookup_field: self.kwargs[self.lookup_field]}
        obj = get_object_or_404(queryset, **filter_kwargs)
        return obj

class FlightDetailView(APIView):
    def get(self, request, flight_number, *args, **kwargs):
        try:
            flight = Flight.objects.get(flight_number__iexact=flight_number)
            serializer = FlightSerializer(flight)
            return Response(serializer.data)
        except Flight.DoesNotExist:
            return Response({"error": "Vol non trouvé."}, status=status.HTTP_404_NOT_FOUND)

class GenererTicketEtCalculerTAEView(APIView):
    """
    Crée un nouveau ticket, identifie la compagnie via le code IATA (2 premières lettres
    du ticket_number) et calcule le Temps d'Attente Estimé (TAE).
    """

    def post(self, request, *args, **kwargs):
        # 1. Validation des données d'entrée
        serializer = EnregistrementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ticket_number_input = serializer.validated_data['ticket_number'].upper()
        service_id = serializer.validated_data['service_id']
        
        # Extrait les deux premiers caractères (Code IATA de la compagnie)
        company_code = ticket_number_input[:2] 

        try:
            service = Service.objects.get(pk=service_id)
            
            # 🌟 ÉTAPE CLÉ : Identifier la Compagnie via le code IATA
            company = Company.objects.get(code__iexact=company_code) 
            
            # Vérification facultative : Assurer que le vol existe (pour la robustesse)
            # Nous utilisons ici le Flight pour valider l'existence du vol réel
            Flight.objects.get(flight_number=ticket_number_input) 

        except ObjectDoesNotExist:
            return Response(
                {"error": f"Code compagnie '{company_code}' ou Service introuvable."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Flight.DoesNotExist:
            return Response(
                {"error": f"Vol '{ticket_number_input}' non planifié."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # --- TÂCHE A : Enregistrement et Attribution du queue_number ---
        
        # Création du Ticket. La méthode save() génère le queue_number (ex: A001).
        new_ticket = Ticket(
            ticket_number=ticket_number_input, # Le numéro de vol
            service=service,
            status="WAITING"
        )
        new_ticket.save() 

        # --- TÂCHE B : Calculer le Temps d'Attente Estimé (TAE) ---

        # 1. Détermination des variables de calcul
        
        # N_compteur : Nombre de comptoirs ouverts (LIBRE ou OCCUPE) attribués à CETTE compagnie
        active_counters_count = Counter.objects.filter(
            assigned_company=company,
            status__in=['LIBRE', 'OCCUPE']
        ).count()

        # N_voyageurs_avant : Nombre de voyageurs en attente pour CE vol (même ticket_number)
        # qui sont arrivés avant ce nouveau ticket.
        waiting_tickets_count = Ticket.objects.filter(
            ticket_number=ticket_number_input,
            status__in=['WAITING', 'CALLED'], 
            created_at__lt=new_ticket.created_at
        ).count()

        T_moyen = company.average_service_time_minutes

        # 2. Formule de Calcul du Temps d'Attente (TAE)
        if active_counters_count == 0:
            estimated_time = -1 
            details = f"Aucun comptoir ouvert pour {company.name} (Code {company_code})."
        else:
            estimated_time = math.ceil(
                (waiting_tickets_count / active_counters_count) * T_moyen
            )
            details = f"Basé sur {waiting_tickets_count} personnes devant et {active_counters_count} comptoirs actifs de {company.name}."
        
        # --- TÂCHE C : Attribution d'un Comptoir (avec stratégie file la plus courte) ---
        try:
            # Utilise la fonction intelligente pour assigner le comptoir avec la file la plus courte
            assigned_counter = assign_counter_to_ticket(company, new_ticket)
        except Exception as e:
            # Gérer l'erreur si aucun comptoir n'est disponible ou autre problème
            print(f"Erreur lors de l'attribution du comptoir: {e}")
            assigned_counter = None
            # Le ticket sera créé sans comptoir assigné, ce qui est géré par null=True

        # 3. Mise à jour du modèle Ticket
        new_ticket.estimated_waiting_time_minutes = estimated_time
        new_ticket.save() # Sauvegarde tous les champs mis à jour

        # 4. Retour
        response_data = {
            "queue_number": new_ticket.queue_number,
            "estimated_waiting_time_minutes": estimated_time,
            "details": details,
            "company": company.name,
            "assigned_counter": assigned_counter.name if assigned_counter else "Aucun"
        }
        
        return Response(response_data, status=status.HTTP_201_CREATED)

class TicketStatisticsView(APIView):
    def get(self, request, *args, **kwargs):
        # Total waiting tickets
        total_waiting_tickets = Ticket.objects.filter(status__in=['WAITING', 'CALLED']).count()

        # Calculate average waiting time for completed tickets
        done_tickets = Ticket.objects.filter(status='DONE')
        avg_wait_time = 0
        if done_tickets.exists():
            done_count = done_tickets.count()
            if done_count > 0:
                # Calculate average from estimated times
                total_estimated_time = sum(t.estimated_waiting_time_minutes or 0 for t in done_tickets)
                avg_wait_time = round(total_estimated_time / done_count) if total_estimated_time > 0 else 0

        # Waiting tickets by company
        debug_tickets_info = []
        all_tickets = Ticket.objects.all()
        for ticket in all_tickets:
            counter_info = "N/A"
            company_info = "N/A"
            if ticket.counter:
                counter_info = ticket.counter.name
                if ticket.counter.assigned_company:
                    company_info = ticket.counter.assigned_company.name
            debug_tickets_info.append({
                'ticket_number': ticket.ticket_number,
                'counter': counter_info,
                'company': company_info,
                'service': ticket.service.name if ticket.service else "N/A",
                'status': ticket.status
            })

        # Waiting tickets by company: extract company from ticket_number (first 2 chars = IATA code)
        # and find the company name
        waiting_tickets_by_company = []
        try:
            company_counts = {}
            for ticket in Ticket.objects.filter(status__in=['WAITING', 'CALLED']):
                if len(ticket.ticket_number) >= 2:
                    company_code = ticket.ticket_number[:2].upper()
                    try:
                        company = Company.objects.get(code__iexact=company_code)
                        key = (company.name, company.code)
                        company_counts[key] = company_counts.get(key, 0) + 1
                    except Company.DoesNotExist:
                        pass
            
            waiting_tickets_by_company = [
                {'counter__assigned_company__name': k[0], 'counter__assigned_company__code': k[1], 'count': v}
                for k, v in sorted(company_counts.items())
            ]
        except Exception as e:
            print(f"Error computing waiting_tickets_by_company: {e}")
            import traceback
            traceback.print_exc()
            waiting_tickets_by_company = []
        
        # Waiting tickets by service: count all WAITING/CALLED tickets grouped by service
        waiting_tickets_by_service = (
            Ticket.objects.filter(status__in=['WAITING', 'CALLED'], service__isnull=False)
            .values('service__name')
            .annotate(count=Count('id'))
            .order_by('service__name')
        )

        try:
            data = {
                'total_waiting_tickets': total_waiting_tickets,
                'average_wait_time_minutes': avg_wait_time,
                'waiting_tickets_by_company': waiting_tickets_by_company,
                'waiting_tickets_by_service': list(waiting_tickets_by_service),
                'debug_tickets_info': debug_tickets_info,
            }
            serializer = TicketStatisticsSerializer(data)
            return Response(serializer.data)
        except Exception as e:
            print(f"Error in TicketStatisticsView: {e}")
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)

class CounterTicketsListView(generics.ListAPIView):
    serializer_class = TicketSerializer

    def get_queryset(self):
        counter_id = self.kwargs['counter_id']
        return Ticket.objects.filter(counter__id=counter_id, status__in=['WAITING', 'CALLED']).order_by('created_at')

class TicketActionView(APIView):
    def post(self, request, ticket_id, action, *args, **kwargs):
        ticket = get_object_or_404(Ticket, pk=ticket_id)
        counter = ticket.counter

        if action == 'call':
            if ticket.status == 'WAITING':
                ticket.status = 'CALLED'
                ticket.save()
                if counter:
                    counter.status = 'OCCUPE'
                    counter.save()
                return Response({'status': 'Ticket called', 'ticket_id': ticket.id}, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Ticket is not in WAITING status'}, status=status.HTTP_400_BAD_REQUEST)
        
        elif action == 'serve':
            if ticket.status == 'CALLED':
                ticket.status = 'DONE'
                ticket.save()
                if counter:
                    counter.status = 'LIBRE'
                    counter.save()
                return Response({'status': 'Ticket served', 'ticket_id': ticket.id}, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Ticket is not in CALLED status'}, status=status.HTTP_400_BAD_REQUEST)
        
        elif action == 'skip':
            if ticket.status == 'CALLED':
                ticket.status = 'WAITING'
                ticket.save()
                if counter:
                    counter.status = 'LIBRE'
                    counter.save()
                return Response({'status': 'Ticket skipped', 'ticket_id': ticket.id}, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Ticket is not in CALLED status'}, status=status.HTTP_400_BAD_REQUEST)
        
        else:
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
