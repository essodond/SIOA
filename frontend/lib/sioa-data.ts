// SIOA System static data and types

export interface Flight {
  id: string
  number: string
  destination: string
  departureTime: string
  terminal: string
  counters: string[]
  status: "on-time" | "delayed" | "boarding" | "closed"
  tae: number // Temps d'Attente Estimé in minutes
  taeStatus: "green" | "yellow" | "red" // Color code
}

export interface Counter {
  id: string
  number: string
  service: "check-in" | "baggage" | "special" | "vip"
  status: "available" | "busy" | "break" | "closed"
  currentTicket: string | null
  flightAssignment: string | null
}

export interface Ticket {
  id: string
  number: string
  passengerName: string
  flightNumber: string
  destination: string
  status: "waiting" | "called" | "served" | "no-show"
  createdAt: string
  waitTime: number // in minutes
  waitingNumber?: string // Nouveau champ pour le numéro d'attente
}

export interface Passenger {
  id: string
  name: string
  ticketNumber: string
  flightNumber: string
  destination: string
  boardingPass?: string
  status: "checked-in" | "pending" | "no-show"
}

// Static flight data
export const flights: Flight[] = [
  {
    id: "1",
    number: "AF480",
    destination: "Paris",
    departureTime: "09:30",
    terminal: "T1",
    counters: ["C01", "C02", "C03"],
    status: "on-time",
    tae: 15,
    taeStatus: "green",
  },
  {
    id: "2",
    number: "BA271",
    destination: "Londres",
    departureTime: "10:15",
    terminal: "T1",
    counters: ["C04", "C05"],
    status: "on-time",
    tae: 22,
    taeStatus: "yellow",
  },
  {
    id: "3",
    number: "LH502",
    destination: "Berlin",
    departureTime: "10:45",
    terminal: "T2",
    counters: ["C06", "C07"],
    status: "delayed",
    tae: 38,
    taeStatus: "red",
  },
  {
    id: "4",
    number: "IB6420",
    destination: "Madrid",
    departureTime: "11:20",
    terminal: "T1",
    counters: ["C08"],
    status: "boarding",
    tae: 45,
    taeStatus: "red",
  },
  {
    id: "5",
    number: "KL620",
    destination: "Amsterdam",
    departureTime: "12:00",
    terminal: "T2",
    counters: ["C09", "C10"],
    status: "on-time",
    tae: 18,
    taeStatus: "green",
  },
]

// Static counter data
export const counters: Counter[] = [
  { id: "1", number: "C01", service: "check-in", status: "busy", currentTicket: "0145", flightAssignment: "AF480" },
  { id: "2", number: "C02", service: "check-in", status: "available", currentTicket: null, flightAssignment: "AF480" },
  { id: "3", number: "C03", service: "check-in", status: "busy", currentTicket: "0147", flightAssignment: "AF480" },
  { id: "4", number: "C04", service: "check-in", status: "available", currentTicket: null, flightAssignment: "BA271" },
  { id: "5", number: "C05", service: "check-in", status: "busy", currentTicket: "0152", flightAssignment: "BA271" },
  { id: "6", number: "C06", service: "baggage", status: "available", currentTicket: null, flightAssignment: "LH502" },
  { id: "7", number: "C07", service: "baggage", status: "busy", currentTicket: "0156", flightAssignment: "LH502" },
  { id: "8", number: "C08", service: "special", status: "busy", currentTicket: "0159", flightAssignment: "IB6420" },
  { id: "9", number: "C09", service: "check-in", status: "available", currentTicket: null, flightAssignment: "KL620" },
  { id: "10", number: "C10", service: "vip", status: "available", currentTicket: null, flightAssignment: "KL620" },
]

// Static ticket queue
export const ticketQueue: Ticket[] = [
  {
    id: "1",
    number: "0145",
    passengerName: "Dupont, Jean",
    flightNumber: "AF480",
    destination: "Paris",
    status: "called",
    createdAt: "09:15",
    waitTime: 5,
  },
  {
    id: "2",
    number: "0146",
    passengerName: "Martin, Marie",
    flightNumber: "AF480",
    destination: "Paris",
    status: "waiting",
    createdAt: "09:18",
    waitTime: 12,
  },
  {
    id: "3",
    number: "0147",
    passengerName: "Bernard, Pierre",
    flightNumber: "AF480",
    destination: "Paris",
    status: "called",
    createdAt: "09:20",
    waitTime: 8,
  },
  {
    id: "4",
    number: "0148",
    passengerName: "Moreau, Sophie",
    flightNumber: "BA271",
    destination: "Londres",
    status: "waiting",
    createdAt: "09:22",
    waitTime: 18,
  },
  {
    id: "5",
    number: "0149",
    passengerName: "Laurent, Claire",
    flightNumber: "BA271",
    destination: "Londres",
    status: "waiting",
    createdAt: "09:25",
    waitTime: 25,
  },
  {
    id: "6",
    number: "0150",
    passengerName: "Blanc, Thomas",
    flightNumber: "LH502",
    destination: "Berlin",
    status: "waiting",
    createdAt: "09:28",
    waitTime: 32,
  },
  {
    id: "7",
    number: "0151",
    passengerName: "Lefevre, Anne",
    flightNumber: "BA271",
    destination: "Londres",
    status: "waiting",
    createdAt: "09:30",
    waitTime: 30,
  },
  {
    id: "8",
    number: "0152",
    passengerName: "Garcia, Luis",
    flightNumber: "BA271",
    destination: "Londres",
    status: "called",
    createdAt: "09:32",
    waitTime: 3,
  },
  {
    id: "9",
    number: "0153",
    passengerName: "Rossi, Marco",
    flightNumber: "IB6420",
    destination: "Madrid",
    status: "waiting",
    createdAt: "09:35",
    waitTime: 25,
  },
  {
    id: "10",
    number: "0154",
    passengerName: "Mueller, Hans",
    flightNumber: "LH502",
    destination: "Berlin",
    status: "waiting",
    createdAt: "09:37",
    waitTime: 28,
  },
  {
    id: "11",
    number: "TEST1234",
    passengerName: "Test, User",
    flightNumber: "AF480",
    destination: "Paris",
    status: "waiting",
    createdAt: "10:00",
    waitTime: 10,
    waitingNumber: "A01", // Numéro d'attente pour le test
  },
]

// Utility functions
export function getFlightByNumber(number: string): Flight | undefined {
  return flights.find((f) => f.number === number)
}

export function getCountersByService(service: string): Counter[] {
  return counters.filter((c) => c.service === service)
}

export function getQueueByFlight(flightNumber: string): Ticket[] {
  return ticketQueue.filter((t) => t.flightNumber === flightNumber)
}

export function getTAEStatus(minutes: number): "green" | "yellow" | "red" {
  if (minutes <= 20) return "green"
  if (minutes <= 40) return "yellow"
  return "red"
}
