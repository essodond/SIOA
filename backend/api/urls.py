from django.urls import path
from .views import (
    ServiceListView, TicketCreateView, TicketDetailView,
    GenererTicketEtCalculerTAEView, FlightDetailView, CounterListView,
    TicketStatisticsView, CounterTicketsListView, TicketActionView
)

urlpatterns = [
    path('services/', ServiceListView.as_view(), name='service-list'),
    path('counters/', CounterListView.as_view(), name='counter-list'),
    path('counters/<int:counter_id>/tickets/', CounterTicketsListView.as_view(), name='counter-tickets-list'),

    # Tickets
    path('tickets/create/', TicketCreateView.as_view(), name='ticket-create'),
    path('tickets/generate-queue-ticket/', GenererTicketEtCalculerTAEView.as_view(), name='generate-queue-ticket'),
    path('tickets/statistics/', TicketStatisticsView.as_view(), name='ticket-statistics'),
    path('tickets/<int:ticket_id>/<str:action>/', TicketActionView.as_view(), name='ticket-action'),
    path('tickets/<str:ticket_number>/', TicketDetailView.as_view(), name='ticket-detail'),

    # Flights
    path('flights/<str:flight_number>/', FlightDetailView.as_view(), name='flight-detail'),
]

