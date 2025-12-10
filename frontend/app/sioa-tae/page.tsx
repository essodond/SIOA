"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { flights, getTAEStatus } from "@/lib/sioa-data"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Activity } from "lucide-react"

export default function TAEScreen() {
  const [displayFlights, setDisplayFlights] = useState(flights)
  const [activeIndex, setActiveIndex] = useState(0)

  // Real-time polling simulation - updates every 10 seconds
  useEffect(() => {
    const pollInterval = setInterval(() => {
      setDisplayFlights((prev) =>
        prev.map((flight) => {
          const newTae = Math.max(5, flight.tae + Math.floor(Math.random() * 6) - 2)
          return {
            ...flight,
            tae: newTae,
            taeStatus: getTAEStatus(newTae),
          }
        }),
      )
    }, 10000)

    return () => clearInterval(pollInterval)
  }, [])

  // Auto-rotate through flights every 8 seconds
  useEffect(() => {
    const rotateInterval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % displayFlights.length)
    }, 8000)

    return () => clearInterval(rotateInterval)
  }, [displayFlights.length])

  const activeFlight = displayFlights[activeIndex]

  const getBackgroundColor = (status: string) => {
    switch (status) {
      case "green":
        return "from-green-50 to-green-100"
      case "yellow":
        return "from-yellow-50 to-yellow-100"
      case "red":
        return "from-red-50 to-red-100"
      default:
        return "from-blue-50 to-blue-100"
    }
  }

  const getBorderColor = (status: string) => {
    switch (status) {
      case "green":
        return "border-green-400"
      case "yellow":
        return "border-yellow-400"
      case "red":
        return "border-red-400"
      default:
        return "border-blue-400"
    }
  }

  const getTextColor = (status: string) => {
    switch (status) {
      case "green":
        return "text-green-700"
      case "yellow":
        return "text-yellow-700"
      case "red":
        return "text-red-700"
      default:
        return "text-blue-700"
    }
  }

  const getStatusText = (status: string) => {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-700 bg-black/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-green-400 animate-pulse" />
            <span className="text-white font-semibold">Affichage TAE - Mise à jour en temps réel</span>
          </div>
          <div className="w-10" />
        </div>
      </div>

      {/* Main Display */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div
          className={`w-full max-w-4xl bg-gradient-to-br ${getBackgroundColor(activeFlight.taeStatus)} border-4 ${getBorderColor(activeFlight.taeStatus)} rounded-3xl p-12 shadow-2xl transform transition-all duration-500`}
        >
          <div className="text-center space-y-8">
            {/* Flight Number */}
            <div className="space-y-2">
              <p className={`text-xl font-semibold ${getTextColor(activeFlight.taeStatus)} uppercase tracking-widest`}>
                Vol
              </p>
              <p className={`text-7xl font-black ${getTextColor(activeFlight.taeStatus)}`}>{activeFlight.number}</p>
            </div>

            {/* Destination */}
            <div className="space-y-2">
              <p className="text-3xl font-semibold text-gray-700">{activeFlight.destination}</p>
              <p className="text-lg text-gray-600">{activeFlight.departureTime}</p>
            </div>

            {/* TAE Highlight */}
            <div className={`border-4 ${getBorderColor(activeFlight.taeStatus)} rounded-2xl p-8 my-8`}>
              <p className={`text-sm font-bold ${getTextColor(activeFlight.taeStatus)} uppercase tracking-wider mb-2`}>
                Temps d'Attente Estimé
              </p>
              <p className={`text-8xl font-black ${getTextColor(activeFlight.taeStatus)}`}>{activeFlight.tae}</p>
              <p className={`text-2xl font-semibold ${getTextColor(activeFlight.taeStatus)} mt-3`}>minutes</p>
            </div>

            {/* Status */}
            <div className="flex items-center justify-center gap-4">
              <div
                className={`w-4 h-4 rounded-full ${activeFlight.taeStatus === "green" ? "bg-green-500" : activeFlight.taeStatus === "yellow" ? "bg-yellow-500" : "bg-red-500"} animate-pulse`}
              />
              <p className={`text-2xl font-bold ${getTextColor(activeFlight.taeStatus)}`}>
                {getStatusText(activeFlight.status)}
              </p>
            </div>

            {/* Counters */}
            <div className="flex justify-center gap-2 flex-wrap">
              {activeFlight.counters.map((counter) => (
                <span
                  key={counter}
                  className={`px-6 py-2 rounded-full font-bold text-lg border-2 ${getBorderColor(activeFlight.taeStatus)} ${getBackgroundColor(activeFlight.taeStatus)}`}
                >
                  {counter}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Flight List - Bottom Navigation */}
      <div className="border-t border-gray-700 bg-black/40 backdrop-blur-sm p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {displayFlights.map((flight, index) => (
              <button
                key={flight.id}
                onClick={() => setActiveIndex(index)}
                className={`flex-shrink-0 px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all border-2 ${
                  index === activeIndex
                    ? `border-2 border-white bg-white text-gray-900`
                    : `border-2 border-gray-600 bg-gray-800 text-gray-200 hover:border-gray-400`
                }`}
              >
                {flight.number} - {flight.destination}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Update Indicator */}
      <div className="text-center py-2 bg-black/60 text-gray-400 text-xs font-mono">
        Mise à jour en temps réel · Données actualisées toutes les 10 secondes
      </div>
    </div>
  )
}
