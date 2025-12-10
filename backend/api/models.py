from django.db import models

class Service(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class Ticket(models.Model):
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    ticket_number = models.CharField(max_length=10, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='waiting') # e.g., 'waiting', 'called', 'completed'

    def __str__(self):
        return f"{self.service.name} - {self.ticket_number}"
