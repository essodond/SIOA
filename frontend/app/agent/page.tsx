"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Volume2, SkipForward, Phone, Clock } from "lucide-react"
import { getCounters, getCounterTickets, callTicket, serveTicket, skipTicket, Counter, Ticket } from "@/lib/api"


const ticketNumberToFrench = (ticket: string): string => {
  const digits = ticket.split("")
  const frenchDigits: { [key: string]: string } = {
    0: "zéro",
    1: "un",
    2: "deux",
    3: "trois",
    4: "quatre",
    5: "cinq",
    6: "six",
    7: "sept",
    8: "huit",
    9: "neuf",
  }
  return digits.map((d) => frenchDigits[d]).join(" ")
}

const ticketNumberToEnglish = (ticket: string): string => {
  const digits = ticket.split("")
  const englishDigits: { [key: string]: string } = {
    0: "zero",
    1: "one",
    2: "two",
    3: "three",
    4: "four",
    5: "five",
    6: "six",
    7: "seven",
    8: "eight",
    9: "nine",
  }
  return digits.map((d) => englishDigits[d]).join(" ")
}

const getCounterNumber = (counterName: string): string => {
  const match = counterName.match(/\d+/)
  return match ? match[0] : ""
}

export default function AgentPage() {
  const [counters, setCounters] = useState<Counter[]>([])
  const [selectedCounterId, setSelectedCounterId] = useState<number | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const currentCounter = counters.find((c) => c.id === selectedCounterId)
  const currentCalledTicket = tickets.find((t) => t.status === "CALLED")
  const waitingTickets = tickets.filter((t) => t.status === "WAITING").sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const fetchedCounters = await getCounters()
        setCounters(fetchedCounters)
        if (fetchedCounters.length > 0) {
          setSelectedCounterId(fetchedCounters[0].id)
        }
      } catch (err) {
        setError("Failed to load counters.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    async function fetchTickets() {
      if (selectedCounterId) {
        try {
          setLoading(true)
          const fetchedTickets = await getCounterTickets(selectedCounterId)
          setTickets(fetchedTickets)
        } catch (err) {
          setError("Failed to load tickets for the selected counter.")
          console.error(err)
        } finally {
          setLoading(false)
        }
      }
    }
    fetchTickets()
  }, [selectedCounterId])

  const refreshTickets = async () => {
    if (selectedCounterId) {
      try {
        const fetchedTickets = await getCounterTickets(selectedCounterId)
        setTickets(fetchedTickets)
      } catch (err) {
        setError("Failed to refresh tickets.")
        console.error(err)
      }
    }
  }

  const callNextTicketHandler = async () => {
    if (waitingTickets.length > 0 && currentCounter) {
      const nextTicket = waitingTickets[0]
      try {
        await callTicket(nextTicket.id)
        speak(`Le ticket ${ticketNumberToFrench(nextTicket.queue_number)} est attendu au comptoir ${getCounterNumber(currentCounter.name)}`, "fr-FR")
        setTimeout(() => {
          speak(`Ticket ${ticketNumberToEnglish(nextTicket.queue_number)} is called at counter ${getCounterNumber(currentCounter.name)}`, "en-US")
        }, 2000)
        refreshTickets()
      } catch (err) {
        setError("Failed to call next ticket.")
        console.error(err)
      }
    }
  }

  const serveCurrentTicketHandler = async () => {
    if (currentCalledTicket) {
      try {
        await serveTicket(currentCalledTicket.id)
        refreshTickets()
      } catch (err) {
        setError("Failed to serve ticket.")
        console.error(err)
      }
    }
  }

  const skipCurrentTicketHandler = async () => {
    if (currentCalledTicket) {
      try {
        await skipTicket(currentCalledTicket.id)
        refreshTickets()
      } catch (err) {
        setError("Failed to skip ticket.")
        console.error(err)
      }
    }
  }

  const speak = (text: string, lang = "fr-FR") => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang
      utterance.rate = 1
      window.speechSynthesis.speak(utterance)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">Error: {error}</div>
  if (!currentCounter) return <div className="min-h-screen flex items-center justify-center">Please select a counter.</div>

  const visibleTickets = tickets.filter(t => t.status !== "DONE" && t.status !== "CANCELLED").sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).slice(0, 5)

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-5xl font-bold text-slate-900">Console Agent</h1>
            <p className="text-slate-600 text-lg mt-2">{currentCounter.name}</p>
          </div>
          <Link href="/">
            <Button
              variant="outline"
              size="lg"
              className="glass text-slate-900 border-slate-200 hover:glass-light bg-transparent"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Retour
            </Button>
          </Link>
        </div>

        <div className="space-y-8">
          <div className="glass-light rounded-3xl p-12 text-center space-y-4 bg-gradient-to-br from-blue-50 to-blue-100">
            <p className="text-slate-600 text-sm font-medium uppercase tracking-widest">En service</p>
            <h2 className="text-9xl font-bold text-blue-600 tracking-tight">{currentCalledTicket?.queue_number || "—"}</h2>
            <p className="text-slate-600 text-lg">
              {currentCalledTicket
                ? `${waitingTickets.length} tickets en attente`
                : "Aucun ticket appelé"}
            </p>
          </div>

          <div className="glass rounded-2xl p-6 bg-slate-50 border border-slate-200">
            <h3 className="text-slate-700 text-sm font-medium uppercase tracking-widest mb-4">Files d'attente</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-3 px-4 text-slate-700 font-semibold">Ticket</th>
                    <th className="pb-3 px-4 text-slate-700 font-semibold">Service</th>
                    <th className="pb-3 px-4 text-slate-700 font-semibold">Arrivée</th>
                    <th className="pb-3 px-4 text-slate-700 font-semibold">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className={`border-b border-slate-100 hover:bg-slate-100 transition-colors ${
                        currentCalledTicket?.id === ticket.id ? "bg-blue-100" : ""
                      }`}
                    >
                      <td className="py-4 px-4">
                        <span className="text-slate-900 font-bold text-lg">{ticket.queue_number}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-slate-700">{ticket.service_name}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-slate-600 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {new Date(ticket.created_at).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            ticket.status === "CALLED"
                              ? "bg-blue-200 text-blue-900"
                              : ticket.status === "DONE"
                                ? "bg-green-200 text-green-900"
                                : "bg-slate-200 text-slate-900"
                          }`}
                        >
                          {ticket.status === "CALLED" ? "Appelé" : ticket.status === "DONE" ? "Servi" : "En attente"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-slate-700 text-sm font-medium uppercase tracking-widest">Comptoirs</p>
            <div className="grid grid-cols-3 gap-4">
              {counters.map((counter) => (
                <button
                  key={counter.id}
                  onClick={() => setSelectedCounterId(counter.id)}
                  className={`p-4 rounded-2xl font-semibold transition-all duration-200 ${
                    selectedCounterId === counter.id
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                      : "glass text-slate-700 hover:glass-light hover:text-slate-900 bg-slate-100 border border-slate-200"
                  }`}
                >
                  <div className="text-lg">{counter.name}</div>
                  <div className="text-sm opacity-75 mt-1">{tickets.filter(t => t.assigned_counter === counter.id && t.status === "WAITING").length} en attente</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <Button
              onClick={callNextTicketHandler}
              className="h-20 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold text-lg rounded-2xl shadow-lg shadow-green-500/30 transition-all"
            >
              <Volume2 className="mr-3 h-7 w-7" />
              Appeler
            </Button>
            <Button
              onClick={serveCurrentTicketHandler}
              className="h-20 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-lg rounded-2xl shadow-lg shadow-blue-500/30 transition-all"
            >
              <Phone className="mr-3 h-7 w-7" />
              Servi
            </Button>
            <Button
              onClick={skipCurrentTicketHandler}
              className="h-20 glass text-slate-900 border-slate-200 hover:glass-light font-semibold text-lg rounded-2xl bg-slate-100"
            >
              <SkipForward className="mr-3 h-7 w-7" />
              Ignorer
            </Button>
          </div>

          <div className="glass rounded-2xl p-6 space-y-3 bg-slate-50 border border-slate-200">
            <p className="text-slate-700 text-sm font-medium uppercase tracking-widest">Prochain ticket</p>
            <div className="flex items-center justify-between">
              <div className="text-5xl font-bold text-slate-900">
                {waitingTickets.length > 0 ? waitingTickets[0].queue_number : "—"}
              </div>
              <Phone className="h-8 w-8 text-slate-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
