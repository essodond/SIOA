from rest_framework import serializers
from .models import Service, Ticket

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = '__all__'

class TicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = ['id', 'service', 'ticket_number', 'created_at', 'status']
        read_only_fields = ['ticket_number', 'created_at']
