"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { type Flight, type Counter, flights, counters, getTAEStatus } from "@/lib/sioa-data"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertCircle, TrendingUp, Clock, Users } from "lucide-react"

export default function AdminDashboard() {
  const [flightData, setFlightData] = useState<Flight[]>(flights)
  const [counterData, setCounterData] = useState<Counter[]>(counters)
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(flights[0])

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setFlightData((prev) =>
        prev.map((flight) => ({
          ...flight,
          tae: Math.max(5, flight.tae + Math.floor(Math.random() * 5) - 2),
          taeStatus: getTAEStatus(Math.max(5, flight.tae + Math.floor(Math.random() * 5) - 2)),
        })),
      )
    }, 15000)

    return () => clearInterval(interval)
  }, [])

  const getTAEColor = (status: string) => {
    switch (status) {
      case "green":
        return "bg-green-50 border-green-300 text-green-700"
      case "yellow":
        return "bg-yellow-50 border-yellow-300 text-yellow-700"
      case "red":
        return "bg-red-50 border-red-300 text-red-700"
      default:
        return "bg-gray-50 border-gray-300 text-gray-700"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "on-time":
        return "Ponctuel"
      case "delayed":
        return "Retardé"
      case "boarding":
        return "Embarquement"
      case "closed":
        return "Fermé"
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="icon" className="mr-4">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Administration SIOA</h1>
          <div className="text-sm text-gray-600">Système SALT/ANAC</div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Vols Actifs</p>
                <p className="text-3xl font-bold text-gray-900">{flightData.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500 opacity-30" />
            </div>
          </div>

          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Comptoirs Actifs</p>
                <p className="text-3xl font-bold text-gray-900">
                  {counterData.filter((c) => c.status !== "closed").length}/{counterData.length}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-500 opacity-30" />
            </div>
          </div>

          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">TAE Moyen</p>
                <p className="text-3xl font-bold text-gray-900">
                  {Math.round(flightData.reduce((sum, f) => sum + f.tae, 0) / flightData.length)} min
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500 opacity-30" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Flights Management */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Gestion des Vols</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {flightData.map((flight) => (
                <div
                  key={flight.id}
                  onClick={() => setSelectedFlight(flight)}
                  className={`glass-light rounded-lg p-4 cursor-pointer transition-all ${
                    selectedFlight?.id === flight.id ? "ring-2 ring-blue-500" : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-900">{flight.number}</span>
                        <span className="text-sm font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                          {getStatusBadge(flight.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{flight.destination}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{flight.departureTime}</p>
                      <p className="text-xs text-gray-500">Terminal {flight.terminal}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {flight.counters.map((c) => (
                        <span key={c} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          {c}
                        </span>
                      ))}
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-semibold border ${getTAEColor(flight.taeStatus)}`}
                    >
                      TAE: {flight.tae} min
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Flight Details */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Détails du Vol</h2>
            {selectedFlight && (
              <div className="glass-light rounded-lg p-6 space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <p className="text-2xl font-bold text-gray-900">{selectedFlight.number}</p>
                  <p className="text-gray-600">{selectedFlight.destination}</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Départ</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedFlight.departureTime}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Statut</p>
                    <p className="text-lg font-semibold text-gray-900">{getStatusBadge(selectedFlight.status)}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">TAE</p>
                    <div
                      className={`inline-block px-3 py-2 rounded-lg text-lg font-bold border ${getTAEColor(selectedFlight.taeStatus)}`}
                    >
                      {selectedFlight.tae} minutes
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Comptoirs</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedFlight.counters.map((c) => (
                        <span key={c} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {selectedFlight.taeStatus === "red" && (
                  <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">TAE élevée - Alerte superviseur recommandée</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Counters Status */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">État des Comptoirs</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-3">
            {counterData.map((counter) => (
              <div
                key={counter.id}
                className={`glass rounded-lg p-3 text-center cursor-pointer transition-all border-2 ${
                  counter.status === "busy"
                    ? "border-orange-300 bg-orange-50"
                    : counter.status === "available"
                      ? "border-green-300 bg-green-50"
                      : counter.status === "break"
                        ? "border-yellow-300 bg-yellow-50"
                        : "border-gray-300 bg-gray-50"
                }`}
              >
                <p className="font-bold text-lg text-gray-900">{counter.number}</p>
                <p className="text-xs font-medium text-gray-600 mt-1">
                  {counter.status === "busy"
                    ? "Occupé"
                    : counter.status === "available"
                      ? "Libre"
                      : counter.status === "break"
                        ? "Pause"
                        : "Fermé"}
                </p>
                <p className="text-xs text-gray-500 mt-1">{counter.service}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
