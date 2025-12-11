from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
import datetime
import math

# ============================
#        SERVICE (Ex: Check-in, Bagages)
# ============================
class Service(models.Model):
    name = models.CharField(max_length=100, unique=True)
    # Lettre préfixe pour le ticket (Ex: 'A' pour Check-in)
    prefix = models.CharField(max_length=1, default="A", help_text="Préfixe pour les tickets (ex: A, B, C)")
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Service"
        verbose_name_plural = "Services"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.prefix})"


# ============================
#        COMPANY (Compagnie Aérienne)
# ============================
class Company(models.Model):
    name = models.CharField(max_length=200, unique=True)
    code = models.CharField(max_length=10, blank=True, null=True, help_text="Code IATA (Ex: AF, ET)")
    logo_url = models.URLField(blank=True, null=True)
    
    average_daily_passengers = models.PositiveIntegerField(
        default=0, 
        help_text="Nombre moyen de passagers par jour."
    )

    # T_moyen pour le calcul du TAE
    average_service_time_minutes = models.PositiveIntegerField(
        default=3, 
        help_text="Temps de service moyen par voyageur (en minutes)."
    )

    class Meta:
        verbose_name = "Compagnie aérienne"
        verbose_name_plural = "Compagnies aériennes"
        ordering = ["name"]

    def __str__(self):
        return self.name
    
    def get_recommended_counters(self):
        """Calcule le nombre de comptoirs recommandés (1 pour 50 pax)."""
        if self.average_daily_passengers == 0: return 0
        return math.ceil(self.average_daily_passengers / 50)


# ============================
#        COUNTER (Comptoir)
# ============================
class Counter(models.Model):
    # Les 24 comptoirs fixes (A1-A12, B1-B12)
    COUNTER_CHOICES = [
        (f"{zone}{num}", f"Comptoir {zone}{num}")
        for zone in ['A', 'B']
        for num in range(1, 13)
    ]
    STATUS_CHOICES = [
        ("LIBRE", "Libre"),
        ("OCCUPE", "Occupé"),
        ("FERME", "Fermé"),
    ]

    name = models.CharField(
        max_length=5, 
        choices=COUNTER_CHOICES, 
        unique=True,
        help_text="Identifiant physique (Ex: A1, B12)"
    )
    
    # Le comptoir est assigné dynamiquement à une compagnie
    assigned_company = models.ForeignKey(
        Company, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name="assigned_counters"
    )
    
    # Statut d'occupation du comptoir
    status = models.CharField(
        max_length=10, 
        choices=STATUS_CHOICES, 
        default="LIBRE",
        help_text="Statut d'occupation du comptoir."
    )
    
    # Ancien champ is_active remplacé par le statut 'FERME' vs 'LIBRE'/'OCCUPE'
    
    class Meta:
        verbose_name = "Comptoir"
        verbose_name_plural = "Comptoirs"
        ordering = ["name"]

    def __str__(self):
        comp = self.assigned_company.name if self.assigned_company else "Non Assigné"
        return f"{self.get_name_display()} ({comp}) - {self.status}"


# ============================
#        FLIGHT (Vol)
# ============================
class Flight(models.Model):
    STATUS_CHOICES = [
        ("ON_TIME", "À l'heure"),
        ("DELAYED", "Retardé"),
        ("CANCELLED", "Annulé"),
        ("BOARDING", "Embarquement"),
    ]

    flight_number = models.CharField(max_length=20) # Ex: AF480
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="flights")
    
    departure_time = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="ON_TIME")
    gate = models.CharField(max_length=10, blank=True, null=True) # Ajout pour l'info vol

    class Meta:
        verbose_name = "Vol"
        verbose_name_plural = "Vols"
        # Contrainte pour s'assurer qu'un vol est unique par numéro et par jour
        unique_together = ('flight_number', 'departure_time',) 
        ordering = ["departure_time"]

    def __str__(self):
        return f"{self.flight_number} ({self.company.code})"


# ============================
#        TICKET (Voyageur/File d'attente)
# ============================
class Ticket(models.Model):
    STATUS_CHOICES = [
        ("WAITING", "En attente"),
        ("CALLED", "Appelé"),
        ("DONE", "Terminé"),
        ("CANCELLED", "Annulé"),
    ]

    # INPUT : Numéro de Vol saisi par le passager (non unique)
    ticket_number = models.CharField(
        max_length=20, 
        help_text="Numéro de vol saisi par le passager (ex: AF480)"
    )
    
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name="tickets")

    # OUTPUT : Numéro de file d'attente généré (Ex: A001)
    queue_number = models.CharField(
        max_length=10, 
        blank=True, 
        editable=False, 
        help_text="Numéro unique généré pour l'appel (Ex: A001)"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="WAITING") 
    
    called_at = models.DateTimeField(blank=True, null=True)
    
    # Le comptoir qui traite le ticket
    counter = models.ForeignKey(Counter, on_delete=models.SET_NULL, null=True, blank=True, related_name="tickets")
    
    # Temps d'attente estimé, calculé lors de la création du ticket
    estimated_waiting_time_minutes = models.PositiveIntegerField(
        default=0, 
        help_text="Temps d'attente estimé à l'enregistrement (en minutes)."
    )

    class Meta:
        verbose_name = "Ticket"
        verbose_name_plural = "Tickets"
        ordering = ["created_at"] # Premier arrivé, premier servi (FIFO)

    def __str__(self):
        return f"File {self.queue_number} (Vol {self.ticket_number})"

    def save(self, *args, **kwargs):
        # Génération automatique du queue_number (Ex: A001) lors de la création
        if not self.queue_number:
            today = datetime.date.today()
            # On compte les tickets créés aujourd'hui pour ce service
            count = Ticket.objects.filter(
                service=self.service,
                created_at__date=today
            ).count()
            # Formatage : Préfixe service + numéro sur 3 chiffres (ex: A + 001)
            self.queue_number = f"{self.service.prefix}{str(count + 1).zfill(3)}"
            
        super().save(*args, **kwargs)

    def call_ticket(self, counter: Counter):
        """
        Méthode pour appeler le ticket au comptoir.
        """
        # Vous pourriez ajouter ici une vérification pour s'assurer 
        # que le comptoir.assigned_company correspond au code du ticket_number.
        
        self.status = "CALLED"
        self.called_at = timezone.now()
        self.counter = counter
        self.save()