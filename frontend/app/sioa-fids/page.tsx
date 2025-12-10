"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { flights } from "@/lib/sioa-data"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Clock, MapPin, AlertCircle, CheckCircle } from "lucide-react"

export default function FIDSScreen() {
  const [displayFlights, setDisplayFlights] = useState(flights)
  const [visibleCount, setVisibleCount] = useState(4)

  // Real-time polling simulation - updates every 12 seconds
  useEffect(() => {
    const pollInterval = setInterval(() => {
      setDisplayFlights((prev) =>
        prev.map((flight) => {
          const statuses = ["on-time", "delayed", "boarding", "closed"] as const
          const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
          return {
            ...flight,
            status: randomStatus,
          }
        }),
      )
    }, 12000)

    return () => clearInterval(pollInterval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "on-time":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "delayed":
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case "boarding":
        return <Clock className="h-5 w-5 text-blue-600" />
      case "closed":
        return <AlertCircle className="h-5 w-5 text-gray-600" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "on-time":
        return { bg: "bg-green-100", text: "text-green-700", label: "Ponctuel" }
      case "delayed":
        return { bg: "bg-red-100", text: "text-red-700", label: "Retardé" }
      case "boarding":
        return { bg: "bg-blue-100", text: "text-blue-700", label: "Embarquement" }
      case "closed":
        return { bg: "bg-gray-100", text: "text-gray-700", label: "Fermé" }
      default:
        return { bg: "bg-gray-100", text: "text-gray-700", label: status }
    }
  }

  const getRowColor = (status: string) => {
    switch (status) {
      case "on-time":
        return "bg-white border-l-4 border-green-500"
      case "delayed":
        return "bg-red-50 border-l-4 border-red-500"
      case "boarding":
        return "bg-blue-50 border-l-4 border-blue-500"
      case "closed":
        return "bg-gray-50 border-l-4 border-gray-500"
      default:
        return "bg-white border-l-4 border-gray-500"
    }
  }

  const visibleFlights = displayFlights.slice(0, visibleCount)
  const statusBadge = getStatusBadge("on-time")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-700 bg-slate-800/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Affichage FIDS</h1>
          <div className="text-sm text-gray-400">Informations des Vols en Temps Réel</div>
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-6">
        <div className="glass-light rounded-2xl overflow-hidden shadow-2xl">
          {/* Table Header */}
          <div className="grid grid-cols-6 gap-4 px-8 py-5 bg-gradient-to-r from-slate-700 to-slate-600 border-b border-white/10">
            <div className="text-white font-bold text-sm uppercase tracking-wide">Vol</div>
            <div className="text-white font-bold text-sm uppercase tracking-wide">Destination</div>
            <div className="text-white font-bold text-sm uppercase tracking-wide">Départ</div>
            <div className="text-white font-bold text-sm uppercase tracking-wide">Terminal</div>
            <div className="text-white font-bold text-sm uppercase tracking-wide">Comptoirs</div>
            <div className="text-white font-bold text-sm uppercase tracking-wide text-right">Statut</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-gray-200/10">
            {visibleFlights.map((flight, index) => {
              const badge = getStatusBadge(flight.status)
              return (
                <div
                  key={flight.id}
                  className={`grid grid-cols-6 gap-4 px-8 py-6 items-center ${getRowColor(flight.status)} hover:bg-opacity-75 transition-all ${index % 2 === 0 ? "bg-opacity-50" : ""}`}
                >
                  {/* Flight Number */}
                  <div>
                    <p className="text-2xl font-black text-gray-900">{flight.number}</p>
                  </div>

                  {/* Destination */}
                  <div>
                    <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      {flight.destination}
                    </p>
                  </div>

                  {/* Departure Time */}
                  <div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-gray-600" />
                      <p className="text-lg font-semibold text-gray-900">{flight.departureTime}</p>
                    </div>
                  </div>

                  {/* Terminal */}
                  <div>
                    <span className="inline-block px-4 py-2 rounded-lg bg-blue-100 text-blue-700 font-bold text-center">
                      T{flight.terminal}
                    </span>
                  </div>

                  {/* Counters */}
                  <div>
                    <div className="flex flex-wrap gap-2">
                      {flight.counters.slice(0, 3).map((counter) => (
                        <span
                          key={counter}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded font-mono text-sm font-semibold"
                        >
                          {counter}
                        </span>
                      ))}
                      {flight.counters.length > 3 && (
                        <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded font-mono text-sm font-semibold">
                          +{flight.counters.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {getStatusIcon(flight.status)}
                      <span className={`inline-block px-4 py-2 rounded-lg font-bold text-sm ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer Info */}
          <div className="px-8 py-4 bg-slate-700/50 border-t border-white/10 flex items-center justify-between">
            <p className="text-sm text-gray-300">
              {visibleFlights.length} vols affichés sur {displayFlights.length}
            </p>
            <p className="text-xs text-gray-400 font-mono">Mise à jour: toutes les 12 secondes</p>
          </div>
        </div>
      </div>

      {/* Display Controls */}
      <div className="border-t border-gray-700 bg-slate-800/80 p-4">
        <div className="max-w-7xl mx-auto flex gap-3 justify-center">
          {[3, 5, 10].map((count) => (
            <Button
              key={count}
              onClick={() => setVisibleCount(count)}
              variant={visibleCount === count ? "default" : "outline"}
              className={`${
                visibleCount === count
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "border-gray-500 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {count} vols
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
