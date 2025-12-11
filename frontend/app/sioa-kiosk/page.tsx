"use client"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Smartphone, Zap } from "lucide-react"
import { getServices, generateQueueTicket, getFlightDetails, Service, Ticket, Flight } from "@/lib/api"

export default function SIOAKiosk() {
  const [step, setStep] = useState<"menu" | "scan" | "flight_confirmation" | "result">("menu")
  const [scannedTicketNumber, setScannedTicketNumber] = useState<string>("")
  const [searchInput, setSearchInput] = useState<string>("")
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null)
  const [currentFlight, setCurrentFlight] = useState<Flight | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchServices = async () => {
      const fetchedServices = await getServices()
      const filteredServices = fetchedServices.filter(
        (service) => service.name === "Enregistrement" || service.name === "Information"
      )
      setServices(filteredServices)
    }
    fetchServices()
  }, [])

  const handleNewScan = () => {
    setScannedTicketNumber("")
    setSearchInput("")
    setSelectedService(null)
    setCurrentTicket(null)
    setCurrentFlight(null)
    setStep("menu")
  }

  const handleScan = async (ticketNumber: string) => {
    if (!selectedService) {
      alert("Veuillez sélectionner un service d'abord.");
      return;
    }

    const flight = await getFlightDetails(ticketNumber);
    if (flight) {
      setCurrentFlight(flight);
      setScannedTicketNumber(ticketNumber);
      setStep("flight_confirmation");
    } else {
      alert("Vol non trouvé. Veuillez vérifier le numéro de vol.");
    }
  }

  const handleConfirmFlight = async () => {
    if (!selectedService || !currentFlight || !scannedTicketNumber) {
      alert("Une erreur est survenue. Veuillez réessayer.");
      return;
    }

    const newTicket = await generateQueueTicket(selectedService.id, scannedTicketNumber);
    if (newTicket) {
      setCurrentTicket(newTicket);
      setStep("result");
    } else {
      alert("Erreur lors de la génération du ticket d'attente.");
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Borne Interactive SIOA</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-12 flex items-center justify-center">
        {step === "menu" && (
          <div className="w-full space-y-8 text-center">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-gray-900">Bienvenue</h2>
              <p className="text-gray-600 text-lg">Veuillez sélectionner un service</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => (
                <Button
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service)
                    setStep("scan")
                  }}
                  className={`h-24 text-xl font-bold rounded-xl text-white ${service.name === "Information" ? "bg-orange-500 hover:bg-orange-600" : "bg-blue-600 hover:bg-blue-700"}`}
                >
                  {service.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {step === "scan" && (
          <div className="w-full space-y-6 text-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Scanner Votre Billet</h2>
              <p className="text-gray-600">Veuillez positionner le code barres devant le scanner</p>
            </div>

            <div className="border-4 border-dashed border-blue-300 rounded-xl p-8 bg-blue-50">
              <Zap className="h-16 w-16 text-blue-400 mx-auto mb-3 animate-pulse" />
              <p className="text-gray-600">Scanner actif...</p>
            </div>

            <input
              type="text"
              placeholder="Simulation: Entrez le numéro de ticket"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchInput.trim()) {
                  handleScan(searchInput.trim())
                }
              }}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-lg font-semibold focus:outline-none focus:border-blue-500"
              autoFocus
            />

            <div className="space-y-3">
              {searchInput && (
                <Button
                  onClick={() => { handleScan(searchInput) }}
                  className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold"
                >
                  Confirmer le Scan
                </Button>
              )}

              <Button
                onClick={() => {
                  setStep("menu")
                  setSearchInput("")
                }}
                variant="outline"
                className="w-full h-12 border-2 border-gray-300"
              >
                Retour
              </Button>
            </div>
          </div>
        )}

        {step === "flight_confirmation" && currentFlight && selectedService && (
          <div className="w-full space-y-6 text-center">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-gray-900">Confirmer votre vol</h2>
              <p className="text-gray-600">Veuillez vérifier les informations de votre vol.</p>
            </div>

            <div className="glass rounded-2xl p-8 space-y-4 text-left">
              <p className="text-xl font-bold text-gray-900">Vol: {currentFlight.flight_number}</p>
              <p className="text-gray-700">Compagnie: {currentFlight.company_name} ({currentFlight.company_code})</p>
              <p className="text-gray-700">Heure de départ: {new Date(currentFlight.departure_time).toLocaleString()}</p>
              <p className="text-gray-700">Statut: {currentFlight.status}</p>
              {currentFlight.gate && <p className="text-gray-700">Porte: {currentFlight.gate}</p>}
              <p className="text-gray-700">Service sélectionné: {selectedService.name}</p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleConfirmFlight}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                Confirmer et générer le ticket
              </Button>

              <Button
                onClick={() => setStep("scan")}
                variant="outline"
                className="w-full h-12 border-2 border-gray-300"
              >
                Annuler
              </Button>
            </div>
          </div>
        )}

        {step === "result" && currentTicket && selectedService && (
          <div className="w-full space-y-6 text-center">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-gray-900">Votre Ticket est Prêt!</h2>
              <p className="text-gray-600">Veuillez prendre votre ticket et attendre votre appel.</p>
            </div>

            <div className="glass rounded-2xl p-8 space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div className="space-y-2">
                <p className="text-2xl font-bold text-gray-900">Numéro de vol: {currentTicket.ticket_number}</p>
                <p className="text-2xl font-bold text-gray-900">Votre numéro d'attente: {currentTicket.queue_number}</p>
                <p className="text-gray-600">Service: {selectedService.name}</p>
                <p className="text-gray-600">Comptoir attribué: {currentTicket.assigned_counter}</p>
                <p className="text-gray-600">Temps d'attente estimé: {currentTicket.estimated_waiting_time_minutes} minutes</p>
                <p className="text-gray-600">Créé le: {new Date(currentTicket.created_at).toLocaleString()}</p>
                <p className="text-gray-600">Statut: {currentTicket.status}</p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">PROCHAINE ÉTAPE</p>
                <p className="text-lg font-semibold text-gray-900">
                  Veuillez vous diriger vers le comptoir {currentTicket.assigned_counter} pour le service {selectedService.name}.
                  Temps d'attente estimé: {currentTicket.estimated_waiting_time_minutes} minutes.
                </p>
              </div>
            </div>

            <Button
              onClick={handleNewScan}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-lg"
            >
              Terminer
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
