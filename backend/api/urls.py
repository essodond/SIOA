from django.urls import path
from .views import ServiceListView, TicketCreateView, TicketDetailView

urlpatterns = [
    path('services/', ServiceListView.as_view(), name='service-list'),
    path('tickets/create/', TicketCreateView.as_view(), name='ticket-create'),
    path('tickets/<str:ticket_number>/', TicketDetailView.as_view(), name='ticket-detail'),
]
