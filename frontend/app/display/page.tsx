"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getCounters, getCounterTickets, Counter, Ticket } from "@/lib/api"

export default function DisplayPage() {
  const [counters, setCounters] = useState<Counter[]>([])
  const [ticketsByCounter, setTicketsByCounter] = useState<{ [key: number]: Ticket[] }>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  // ⏱️ AUTO-REFRESH: Fetch data every 2 seconds
  useEffect(() => {
    async function fetchData() {
      try {
        const fetchedCounters = await getCounters()
        setCounters(fetchedCounters)
        
        // Fetch tickets for each counter
        const ticketsMap: { [key: number]: Ticket[] } = {}
        for (const counter of fetchedCounters) {
          try {
            const tickets = await getCounterTickets(counter.id)
            ticketsMap[counter.id] = tickets
          } catch (err) {
            ticketsMap[counter.id] = []
          }
        }
        setTicketsByCounter(ticketsMap)
        setLoading(false)
      } catch (err) {
        console.error("Failed to fetch display data:", err)
      }
    }
    
    // Fetch immediately
    fetchData()
    
    // Refresh every 2 seconds
    const interval = setInterval(fetchData, 2000)
    return () => clearInterval(interval)
  }, [])

  // Rotate through counters every 8 seconds
  useEffect(() => {
    if (counters.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % counters.length)
      }, 8000)
      return () => clearInterval(interval)
    }
  }, [counters.length])

  if (loading || counters.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl">Chargement des comptoirs...</div>
      </div>
    )
  }

  const currentCounter = counters[currentIndex]
  const currentCounterTickets = ticketsByCounter[currentCounter.id] || []
  const calledTicket = currentCounterTickets.find((t) => t.status === "CALLED")
  const nextTickets = currentCounterTickets
    .filter((t) => t.status === "WAITING")
    .slice(0, 3)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold text-white">Affichage des Files</h1>
        <Link href="/">
          <Button
            variant="outline"
            size="sm"
            className="text-white border-white/30 hover:bg-white/10 bg-white/10 backdrop-blur-md"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div key={currentIndex} className="w-full max-w-2xl animate-in fade-in duration-1000">
          <div className="bg-gradient-to-br from-purple-600/40 to-blue-600/40 backdrop-blur-xl rounded-3xl shadow-2xl p-12 text-center space-y-8 border border-white/20">
            {/* Counter Name */}
            <div>
              <p className="text-purple-200 text-xl">Comptoir</p>
              <h2 className="text-5xl font-bold text-white">{currentCounter.name}</h2>
              <p className={`text-sm mt-2 ${
                currentCounter.status === "LIBRE" ? "text-green-400" : 
                currentCounter.status === "OCCUPE" ? "text-blue-400" : 
                "text-gray-400"
              }`}>
                {currentCounter.status === "LIBRE" ? "Libre" : 
                 currentCounter.status === "OCCUPE" ? "Occupé" : 
                 "Fermé"}
              </p>
            </div>

            {/* Current Ticket */}
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-12 border border-white/20">
              <p className="text-purple-100 text-lg mb-4">En Service</p>
              <p className="text-8xl font-bold text-white">
                {calledTicket ? calledTicket.queue_number : "—"}
              </p>
            </div>

            {/* Next Tickets */}
            {nextTickets.length > 0 && (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <p className="text-purple-200 text-sm mb-3">Tickets Suivants</p>
                <div className="flex justify-center gap-4">
                  {nextTickets.map((ticket) => (
                    <div key={ticket.id} className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 border border-white/30">
                      <p className="text-white text-3xl font-bold">{ticket.queue_number}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Indicators */}
      <div className="flex justify-center gap-3 mt-8">
        {counters.map((_, idx) => (
          <div
            key={idx}
            className={`h-3 rounded-full transition-all ${idx === currentIndex ? "bg-white w-8" : "bg-white/40 w-3"}`}
          />
        ))}
      </div>
    </div>
  )
}
