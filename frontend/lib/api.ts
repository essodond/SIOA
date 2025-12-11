const API_BASE_URL = "http://localhost:8000/api"; // URL de notre api Django

export interface Service {
  id: number;
  name: string;
  description: string | null;
}

export interface Company {
  id: number;
  name: string;
  code: string;
}

export interface Flight {
  id: number;
  flight_number: string;
  company: number; // ID de la compagnie
  company_name: string;
  company_code: string;
  departure_time: string;
  status: "ON_TIME" | "DELAYED" | "CANCELLED" | "BOARDING";
  gate: string | null;
}

export interface Counter {
  id: number;
  name: string;
  status: "LIBRE" | "OCCUPE" | "FERME";
  assigned_company: Company | null;
}

export interface TicketStatistics {
  total_waiting_tickets: number;
  waiting_tickets_by_company: Array<{ counter__assigned_company__name: string; counter__assigned_company__code: string; count: number }>;
  average_wait_time_minutes: number;
  waiting_tickets_by_service: Array<{ service__name: string; count: number }>;
  debug_tickets_info?: Array<{ ticket_number: string; counter: string; company: string; service: string; status: string }>;
}

export interface Ticket {
  id: number;
  service: number; // ID du service
  service_name: string; // Nom du service
  ticket_number: string; // Numéro de vol saisi par le passager
  queue_number: string; // Numéro unique généré pour l'appel (Ex: A001)
  created_at: string;
  status: "WAITING" | "CALLED" | "DONE" | "CANCELLED";
  estimated_waiting_time_minutes: number;
  assigned_counter: number | null; // ID du comptoir attribué
  assigned_counter_name: string | null; // Nom du comptoir attribué (Ex: A1)
}

export async function getCounterTickets(counterId: number): Promise<Ticket[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/counters/${counterId}/tickets/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: Ticket[] = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching counter tickets:", error);
    return [];
  }
}

export async function callTicket(ticketId: number): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/call/`, {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error calling ticket:", error);
    return null;
  }
}

export async function serveTicket(ticketId: number): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/serve/`, {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error serving ticket:", error);
    return null;
  }
}

export async function skipTicket(ticketId: number): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/skip/`, {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error skipping ticket:", error);
    return null;
  }
}


export async function generateQueueTicket(serviceId: number, flightNumber: string): Promise<Ticket | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/tickets/generate-queue-ticket/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ service_id: serviceId, ticket_number: flightNumber }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: Ticket = await response.json();
    return data;
  } catch (error) {
    console.error("Error generating queue ticket:", error);
    return null;
  }
}

// La fonction createTicket existante n'est plus utilisée pour le flux de la borne, mais je la laisse pour l'instant.
export async function createTicket(serviceId: number): Promise<Ticket | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/tickets/create/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ service: serviceId }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: Ticket = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating ticket:", error);
    return null;
  }
}

export async function getServices(): Promise<Service[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/services/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: Service[] = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching services:", error);
    return [];
  }
}

export async function getFlightDetails(flightNumber: string): Promise<Flight | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/flights/${flightNumber.toUpperCase()}/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: Flight = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching flight details:", error);
    return null;
  }
}

export async function getCounters(): Promise<Counter[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/counters/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: Counter[] = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching counters:", error);
    return [];
  }
}

export async function getTicketStatistics(): Promise<TicketStatistics | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/tickets/statistics/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: TicketStatistics = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching ticket statistics:", error);
    return null;
  }
}
