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
        
class EnregistrementSerializer(serializers.Serializer):
    # L'utilisateur fournit le numéro de vol et le service (ex: Check-in)
    ticket_number = serializers.CharField(max_length=20) 
    service_id = serializers.IntegerField()