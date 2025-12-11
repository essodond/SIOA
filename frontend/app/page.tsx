"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plane, Monitor, Settings, Smartphone, Radio } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="text-center pt-8 pb-6 border-b border-blue-200">
        <h1 className="text-4xl font-black text-blue-900">Système de Gestion Aéroportuaire</h1>
        <p className="text-gray-600 mt-2">SIOA - Borne Interactive et Gestion des Queues</p>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* SIOA Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Plane className="h-6 w-6 text-blue-600" />
            Système SIOA (Borne Interactive)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/sioa-kiosk" className="w-full">
              <Button className="w-full h-24 bg-blue-600 hover:bg-blue-700 text-white font-semibold flex flex-col items-center justify-center gap-2 rounded-xl">
                <Smartphone className="h-6 w-6" />
                Borne Interactive
              </Button>
            </Link>

            <Link href="/admin" className="w-full">
              <Button className="w-full h-24 bg-green-600 hover:bg-green-700 text-white font-semibold flex flex-col items-center justify-center gap-2 rounded-xl">
                <Settings className="h-6 w-6" />
                Admin (SALT/ANAC)
              </Button>
            </Link>

            <Link href="/sioa-tae" className="w-full">
              <Button className="w-full h-24 bg-orange-600 hover:bg-orange-700 text-white font-semibold flex flex-col items-center justify-center gap-2 rounded-xl">
                <Radio className="h-6 w-6" />
                Affichage TAE
              </Button>
            </Link>

            <Link href="/sioa-fids" className="w-full">
              <Button className="w-full h-24 bg-purple-600 hover:bg-purple-700 text-white font-semibold flex flex-col items-center justify-center gap-2 rounded-xl">
                <Monitor className="h-6 w-6" />
                Affichage FIDS
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
