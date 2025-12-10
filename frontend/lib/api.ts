const API_BASE_URL = "http://localhost:8000/api"; // Assurez-vous que c'est l'URL correcte de votre backend Django

export interface Service {
  id: number;
  name: string;
  description: string | null;
}

export interface Ticket {
  id: number;
  service: number; // ID du service
  ticket_number: string;
  created_at: string;
  status: "waiting" | "called" | "completed";
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

export async function getTicketByNumber(ticketNumber: string): Promise<Ticket | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketNumber}/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: Ticket = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching ticket ${ticketNumber}:`, error);
    return null;
  }
}
