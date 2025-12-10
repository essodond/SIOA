"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, DessertIcon as PassportIcon, Briefcase, Info, Crown, Search, Accessibility } from "lucide-react"

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
  const [ticketNumber, setTicketNumber] = useState<string | null>(null)

  const handleServiceSelect = (serviceId: number) => {
    setSelectedService(serviceId)
    const ticketNum = `${String(serviceId).padStart(2, "0")}${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")}`
    setTicketNumber(ticketNum)
  }

  const handleReset = () => {
    setSelectedService(null)
    setTicketNumber(null)
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

        {ticketNumber ? (
          <div className="max-w-md mx-auto">
            <div className="glass-light rounded-3xl p-12 text-center space-y-8">
              <div className="space-y-2">
                <p className="text-slate-600 text-lg">Votre Ticket</p>
                <h2 className="text-6xl font-bold text-blue-600">{ticketNumber}</h2>
              </div>

              <div className="glass rounded-2xl p-6 space-y-3">
                <p className="text-sm text-slate-700">Service</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {SERVICES.find((s) => s.id === selectedService)?.name}
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
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
            {SERVICES.map((service) => {
              const IconComponent = service.Icon
              return (
                <button
                  key={service.id}
                  onClick={() => handleServiceSelect(service.id)}
                  className={`bg-gradient-to-br ${service.color} rounded-2xl p-8 text-white hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group backdrop-blur-sm`}
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
