from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
import datetime

# ============================
#        SERVICE
# ============================
class Service(models.Model):
    # Ex: "Enregistrement", "Bagages"
    name = models.CharField(max_length=100, unique=True)
    # Lettre préfixe pour le ticket (ex: 'E' pour Enregistrement -> E001)
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
#        COMPANY
# ============================
class Company(models.Model):
    name = models.CharField(max_length=200, unique=True)
    code = models.CharField(max_length=10, blank=True, null=True)
    logo_url = models.URLField(blank=True, null=True)
    
    # Donnée pour gérer l'allocation des comptoirs
    average_daily_passengers = models.PositiveIntegerField(
        default=0, 
        help_text="Nombre moyen de passagers par jour. Sert à calculer le nombre de comptoirs nécessaires."
    )

    class Meta:
        verbose_name = "Compagnie aérienne"
        verbose_name_plural = "Compagnies aériennes"
        ordering = ["name"]

    def __str__(self):
        return self.name
    
    def get_recommended_counters(self):
        """Calcule le nombre de comptoirs recommandés (1 pour 50 pax par exemple)."""
        if self.average_daily_passengers == 0: return 0
        import math
        return math.ceil(self.average_daily_passengers / 50)


# ============================
#        COUNTER
# ============================
class Counter(models.Model):
    # Les 24 comptoirs fixes (A1-A12, B1-B12)
    COUNTER_CHOICES = [
        (f"{zone}{num}", f"Comptoir {zone}{num}")
        for zone in ['A', 'B']
        for num in range(1, 13)
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
    
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Comptoir"
        verbose_name_plural = "Comptoirs"
        ordering = ["name"]

    def __str__(self):
        comp = f" -> {self.assigned_company.name}" if self.assigned_company else " (Libre)"
        return f"{self.get_name_display()}{comp}"


# ============================
#        FLIGHT
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

    class Meta:
        verbose_name = "Vol"
        verbose_name_plural = "Vols"
        ordering = ["departure_time"]

    def __str__(self):
        return f"{self.flight_number}"


# ============================
#        TICKET
# ============================
class Ticket(models.Model):
    STATUS_CHOICES = [
        ("WAITING", "En attente"),
        ("CALLED", "Appelé"),
        ("DONE", "Terminé"),
        ("CANCELLED", "Annulé"),
    ]

    # 1. INPUT : Numéro de Vol entré par le passager (Ex: AF480)
    # Ce n'est pas unique car plusieurs passagers sont sur le même vol.
    ticket_number = models.CharField(
        max_length=20, 
        help_text="Numéro de vol saisi par le passager (ex: AF480)"
    )
    
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name="tickets")

    # 2. OUTPUT : Numéro de file d'attente généré (Ex: A001)
    queue_number = models.CharField(
        max_length=10, 
        blank=True, 
        editable=False, 
        help_text="Numéro unique généré pour l'appel (Ex: A001)"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="WAITING")
    
    # 3. Initialisé quand la réceptionniste appelle
    called_at = models.DateTimeField(blank=True, null=True)
    
    # Le comptoir qui traite le ticket
    counter = models.ForeignKey(Counter, on_delete=models.SET_NULL, null=True, blank=True, related_name="tickets")

    class Meta:
        verbose_name = "Ticket"
        verbose_name_plural = "Tickets"
        ordering = ["created_at"] # FIFO (First In, First Out)

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
        Méthode appelée quand la réceptionniste clique sur 'Suivant'.
        """
        # Vérification optionnelle : Le comptoir doit être assigné à une compagnie
        # qui correspond au vol indiqué (si on fait le lien avec Flight, sinon on laisse passer)
        
        self.status = "CALLED"
        self.called_at = timezone.now() # C'est ici que la date est initialisée
        self.counter = counter
        self.save()