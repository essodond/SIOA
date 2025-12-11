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
from .serializers import EnregistrementSerializer, ServiceSerializer, TicketSerializer

class ServiceListView(generics.ListAPIView):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer

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
        
        # 3. Mise à jour du modèle Ticket
        new_ticket.estimated_waiting_time_minutes = estimated_time
        new_ticket.save(update_fields=['estimated_waiting_time_minutes'])

        # 4. Retour
        response_data = {
            "queue_number": new_ticket.queue_number,
            "estimated_waiting_time_minutes": estimated_time,
            "details": details,
            "company": company.name
        }
        
        return Response(response_data, status=status.HTTP_201_CREATED)