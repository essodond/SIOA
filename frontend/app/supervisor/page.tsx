"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingUp, Users, Clock, CheckCircle2 } from "lucide-react"
import { getCounters, getTicketStatistics, Counter, TicketStatistics } from "@/lib/api"

export default function SupervisorPage() {
  const [counters, setCounters] = useState<Counter[]>([])
  const [ticketStats, setTicketStats] = useState<TicketStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const fetchedCounters = await getCounters()
        const fetchedTicketStats = await getTicketStatistics()
        setCounters(fetchedCounters)
        setTicketStats(fetchedTicketStats)
      } catch (err) {
        setError("Failed to fetch data")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">Erreur: {error}</div>
  }

  const totalQueued = ticketStats?.total_waiting_tickets || 0
  const activeCounters = counters.filter((c) => c.status === "OCCUPE" || c.status === "LIBRE").length
  // For avgWaitTime and totalServed, we don't have direct API support yet, so we'll keep placeholders or remove them.
  // For now, let's set them to 0 or derive them if possible from available data.
  const avgWaitTime = 0 // Placeholder
  const totalServed = 0 // Placeholder

  const getStatusColor = (status: string) => {
    switch (status) {
      case "LIBRE":
        return "bg-emerald-100 text-emerald-700 border-emerald-200"
      case "OCCUPE":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "FERME":
        return "bg-slate-100 text-slate-600 border-slate-200"
      default:
        return "bg-slate-100 text-slate-600"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "LIBRE":
        return "Libre"
      case "OCCUPE":
        return "Occupé"
      case "FERME":
        return "Fermé"
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold text-slate-900">Tableau de Bord</h1>
            <p className="text-slate-500 mt-1">Surveillance des files d'attente</p>
          </div>
          <Link href="/">
            <Button
              variant="outline"
              size="lg"
              className="text-slate-700 border-slate-300 hover:bg-slate-100 bg-transparent"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Retour
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total en Attente</p>
                <p className="text-3xl font-semibold text-slate-900 mt-2">{totalQueued}</p>
              </div>
              <div className="bg-blue-100 rounded-lg p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Comptoirs Actifs</p>
                <p className="text-3xl font-semibold text-slate-900 mt-2">{activeCounters}</p>
              </div>
              <div className="bg-emerald-100 rounded-lg p-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Temps Moyen</p>
                <p className="text-3xl font-semibold text-slate-900 mt-2">{avgWaitTime}m</p>
              </div>
              <div className="bg-amber-100 rounded-lg p-3">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Traité</p>
                <p className="text-3xl font-semibold text-slate-900 mt-2">{totalServed}</p>
              </div>
              <div className="bg-violet-100 rounded-lg p-3">
                <TrendingUp className="h-6 w-6 text-violet-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Détails des Comptoirs</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Comptoir</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">État</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Ticket Courant</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">En Attente</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Temps Moyen</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Traité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {counters.map((counter) => (
                  <tr key={counter.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{counter.name}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(counter.status)}`}
                      >
                        {getStatusLabel(counter.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{counter.assigned_company ? counter.assigned_company.name : "N/A"}</td>
                    <td className="px-6 py-4 text-slate-600">{counter.status === "OCCUPE" ? "Oui" : "Non"}</td>
                    <td className="px-6 py-4 text-slate-600">N/A</td> {/* Placeholder for current ticket */}
                    <td className="px-6 py-4 text-slate-600">N/A</td> {/* Placeholder for queued */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Tickets en Attente par Compagnie</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Compagnie</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Code</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Tickets</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ticketStats?.waiting_tickets_by_company.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{item.flight__company__name}</td>
                      <td className="px-6 py-4 text-slate-600">{item.flight__company__code}</td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold border border-blue-200">
                          {item.count}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Tickets en Attente par Service</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Service</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Tickets</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ticketStats?.waiting_tickets_by_service.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{item.service__name}</td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold border border-blue-200">
                          {item.count}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-100">
          <p className="text-sm text-amber-900 font-medium">
            Les données affichées sont en temps réel. Actualisez la page pour les dernières mises à jour.
          </p>
        </div>
      </div>
    </div>
  )
}
