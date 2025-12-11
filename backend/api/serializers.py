from rest_framework import serializers
from .models import Service, Ticket, Flight, Company, Counter

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ['id', 'name', 'code']

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = '__all__'

class TicketSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='service.name', read_only=True)
    assigned_counter_name = serializers.CharField(source='counter.name', read_only=True)

    class Meta:
        model = Ticket
        fields = ['id', 'service', 'service_name', 'ticket_number', 'queue_number', 'created_at', 'status', 'estimated_waiting_time_minutes', 'counter', 'assigned_counter_name']
        read_only_fields = ['ticket_number', 'queue_number', 'created_at', 'estimated_waiting_time_minutes', 'counter', 'service', 'service_name', 'assigned_counter_name']

class EnregistrementSerializer(serializers.Serializer):
    ticket_number = serializers.CharField(max_length=20)
    service_id = serializers.IntegerField()

class FlightSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    company_code = serializers.CharField(source='company.code', read_only=True)

    class Meta:
        model = Flight
        fields = [
            'id',
            'flight_number',
            'company',
            'company_name',
            'company_code',
            'departure_time',
            'status',
            'gate',
        ]

class CounterSerializer(serializers.ModelSerializer):
    assigned_company = CompanySerializer(read_only=True)

    class Meta:
        model = Counter
        fields = ['id', 'name', 'status', 'assigned_company']

class TicketStatisticsSerializer(serializers.Serializer):
    total_waiting_tickets = serializers.IntegerField()
    waiting_tickets_by_company = serializers.SerializerMethodField()
    waiting_tickets_by_service = serializers.SerializerMethodField()
    debug_tickets_info = serializers.ListField(child=serializers.DictField())

    def get_waiting_tickets_by_company(self, obj):
        # obj will be the aggregated data from the view
        # This method should return a list of dictionaries, each with company info and ticket count
        return obj.get('waiting_tickets_by_company', [])

    def get_waiting_tickets_by_service(self, obj):
        # obj will be the aggregated data from the view
        # This method should return a list of dictionaries, each with service info and ticket count
        return obj.get('waiting_tickets_by_service', [])
