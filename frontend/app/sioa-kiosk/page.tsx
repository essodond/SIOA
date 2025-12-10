"use client"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Smartphone, Zap } from "lucide-react"
import { getServices, createTicket, getTicketByNumber, Service, Ticket } from "@/lib/api"

export default function SIOAKiosk() {
  const [step, setStep] = useState<"menu" | "scan" | "confirmation" | "result">("menu")
  const [scannedTicketNumber, setScannedTicketNumber] = useState<string>("")
  const [searchInput, setSearchInput] = useState<string>("")
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchServices = async () => {
      const fetchedServices = await getServices()
      setServices(fetchedServices)
    }
    fetchServices()
  }, [])

  const handleNewScan = () => {
    setScannedTicketNumber("")
    setSearchInput("")
    setSelectedService(null)
    setCurrentTicket(null)
    setStep("menu")
  }

  const handleScan = async (ticketNumber: string) => {
    const ticket = await getTicketByNumber(ticketNumber);
    if (ticket) {
      setCurrentTicket(ticket);
      setStep("result");
    } else {
      alert("Ticket non trouvé ou invalide.");
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
                  className="h-24 text-xl font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
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
                <p className="text-2xl font-bold text-gray-900">{currentTicket.ticket_number}</p>
                <p className="text-gray-600">Service: {selectedService.name}</p>
                <p className="text-gray-600">Créé le: {new Date(currentTicket.created_at).toLocaleString()}</p>
                <p className="text-gray-600">Statut: {currentTicket.status}</p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">PROCHAINE ÉTAPE</p>
                <p className="text-lg font-semibold text-gray-900">
                  Veuillez vous diriger vers le comptoir de {selectedService.name}
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
