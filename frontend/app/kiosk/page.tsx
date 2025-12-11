"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, DessertIcon as PassportIcon, Briefcase, Info, Crown, Search, Accessibility } from "lucide-react"
import { generateQueueTicket } from "@/lib/api"

const SERVICES = [
  { id: 1, name: "Enregistrement", Icon: PassportIcon, color: "from-blue-500 to-blue-600" },
  { id: 2, name: "Réclamation Bagages", Icon: Briefcase, color: "from-green-500 to-green-600" },
  { id: 3, name: "Information", Icon: Info, color: "from-yellow-500 to-yellow-600" },
  { id: 4, name: "Service VIP", Icon: Crown, color: "from-purple-500 to-purple-600" },
  { id: 5, name: "Objets Trouvés", Icon: Search, color: "from-red-500 to-red-600" },
  { id: 6, name: "Accessibilité", Icon: Accessibility, color: "from-orange-500 to-orange-600" },
]

export default function KioskPage() {
  const [selectedService, setSelectedService] = useState<number | null>(null)
  const [scanInput, setScanInput] = useState<string>("")
  const [queueNumber, setQueueNumber] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedServiceObj = SERVICES.find((s) => s.id === selectedService)
  const isInformation = selectedServiceObj?.name.toLowerCase().includes("information")

  const handleServiceSelect = async (serviceId: number) => {
    setSelectedService(serviceId)
    setScanInput("")
    setError(null)

    // Pour Information (détecté par nom), générer immédiatement le ticket sans scanner
    const serviceObj = SERVICES.find((s) => s.id === serviceId)
    const isInfoService = serviceObj?.name.toLowerCase().includes("information")
    if (isInfoService) {
      setLoading(true)
      try {
        // Générer un pseudo ticket_number pour Information (p.ex. "XX" + random)
        const pseudoTicketNumber = `XX${Math.floor(Math.random() * 1000000)
          .toString()
          .padStart(6, "0")}`
        const ticket = await generateQueueTicket(serviceId, pseudoTicketNumber)
        if (ticket) {
          setQueueNumber(ticket.queue_number)
        } else {
          setError("Erreur lors de la génération du ticket")
          setSelectedService(null)
        }
      } catch (err) {
        setError("Erreur lors de la génération du ticket")
        console.error(err)
        setSelectedService(null)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleScan = async () => {
    if (!scanInput.trim()) {
      setError("Veuillez scanner un numéro de vol")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const ticket = await generateQueueTicket(selectedService!, scanInput.toUpperCase())
      if (ticket) {
        setQueueNumber(ticket.queue_number)
      } else {
        setError("Erreur lors de la génération du ticket")
      }
    } catch (err) {
      setError("Erreur lors de la génération du ticket")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSelectedService(null)
    setQueueNumber(null)
    setScanInput("")
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="space-y-1">
            <h1 className="text-5xl font-bold text-slate-900">Borne d'Enregistrement</h1>
            <p className="text-slate-600">Sélectionnez votre service</p>
          </div>
          <Link href="/">
            <Button
              variant="outline"
              size="lg"
              className="text-slate-900 border-slate-900 hover:bg-white/50 bg-white/30 backdrop-blur-md"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Retour
            </Button>
          </Link>
        </div>

        {queueNumber ? (
          <div className="max-w-md mx-auto">
            <div className="glass-light rounded-3xl p-12 text-center space-y-8">
              <div className="space-y-2">
                <p className="text-slate-600 text-lg">Votre Ticket</p>
                <h2 className="text-6xl font-bold text-blue-600">{queueNumber}</h2>
              </div>

              <div className="glass rounded-2xl p-6 space-y-3">
                <p className="text-sm text-slate-700">Service</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {selectedServiceObj?.name}
                </p>
              </div>

              <div className="bg-green-500/20 backdrop-blur-md rounded-xl p-4 border border-green-400/30">
                <p className="text-green-800 font-semibold">Ticket émis avec succès!</p>
                <p className="text-sm text-green-700">Veuillez vous diriger vers le comptoir</p>
              </div>

              <Button
                onClick={handleReset}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg rounded-xl"
              >
                Émettre un Autre Ticket
              </Button>
            </div>
          </div>
        ) : selectedService ? (
          <div className="max-w-md mx-auto">
            {isInformation ? (
              <div className="glass-light rounded-3xl p-12 text-center space-y-8">
                <div className="space-y-2">
                  <p className="text-slate-600 text-lg">Génération du ticket...</p>
                </div>
                {loading && <div className="text-blue-600">Veuillez patienter...</div>}
                {error && <p className="text-red-600 font-semibold">{error}</p>}
                <Button
                  onClick={() => handleReset()}
                  className="w-full h-12 bg-slate-600 hover:bg-slate-700 text-white font-semibold text-lg rounded-xl"
                >
                  Retour
                </Button>
              </div>
            ) : (
              <div className="glass-light rounded-3xl p-12 text-center space-y-8">
                <div className="space-y-2">
                  <p className="text-slate-600 text-lg">Scanner votre numéro de vol</p>
                  <p className="text-sm text-slate-500">{selectedServiceObj?.name}</p>
                </div>

                <input
                  type="text"
                  placeholder="Scannez le code..."
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleScan()}
                  autoFocus
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg text-center text-2xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {error && <p className="text-red-600 font-semibold">{error}</p>}

                <Button
                  onClick={handleScan}
                  disabled={loading || !scanInput.trim()}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold text-lg rounded-xl"
                >
                  {loading ? "Chargement..." : "Générer Ticket"}
                </Button>

                <Button
                  onClick={() => handleReset()}
                  className="w-full h-12 bg-slate-600 hover:bg-slate-700 text-white font-semibold text-lg rounded-xl"
                >
                  Retour
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
            {SERVICES.map((service) => {
              const IconComponent = service.Icon
              return (
                <button
                  key={service.id}
                  onClick={() => handleServiceSelect(service.id)}
                  disabled={loading}
                  className={`bg-gradient-to-br ${service.color} rounded-2xl p-8 text-white hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group backdrop-blur-sm disabled:opacity-50`}
                >
                  <div className="space-y-4">
                    <IconComponent className="h-16 w-16 group-hover:scale-110 transition-transform" />
                    <h3 className="text-2xl font-bold">{service.name}</h3>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
