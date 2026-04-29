import { useState } from 'react'
import './App.css'
import { SpaceGrid } from './components/space-grid'
import { BookingPage } from './components/booking-page'
import { type Space, type ActiveReservation } from './types'
import { CalendarDays, MapPin } from 'lucide-react'

function App() {
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null)
  const [activeReservation, setActiveReservation] = useState<ActiveReservation | null>(null)

  const handleSelect = (space: Space, res: ActiveReservation) => {
    setSelectedSpace(space)
    setActiveReservation(res)
  }

  const handleCancel = () => {
    setSelectedSpace(null)
    setActiveReservation(null)
  }

  return (
    <div className="workspace-shell">
      <header className="border-b border-atomic-border/40 bg-atomic-surface/80 backdrop-blur">
        <div className="workspace-container py-5 sm:py-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-atomic-accentDark">Coworking reservations</p>
              <h1 className="mt-1 text-3xl font-bold text-atomic-ink sm:text-4xl">AtomicDesk</h1>
              <p className="mt-2 max-w-2xl text-sm font-medium text-atomic-muted sm:text-base">
                Reserve focused desks and meeting rooms in a calm, ready-to-work space.
              </p>
            </div>

            <nav className="flex flex-wrap items-center gap-3" aria-label="Workspace details">
              <span className="workspace-pill gap-2">
                <MapPin size={15} aria-hidden="true" />
                Copenhagen studio
              </span>
              <span className="workspace-pill gap-2">
                <CalendarDays size={15} aria-hidden="true" />
                Today availability
              </span>
            </nav>
          </div>
        </div>
      </header>

      <main className="workspace-container py-8 sm:py-10">
        {selectedSpace && activeReservation ? (
          <BookingPage
            space={selectedSpace}
            reservation={activeReservation}
            onCancel={handleCancel}
            onBookingComplete={handleCancel}
          />
        ) : (
          <SpaceGrid onSelect={handleSelect} />
        )}
      </main>
    </div>
  )
}

export default App
