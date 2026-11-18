import { useMemo } from 'react'
import { readRecentRoutes } from '../../api/recentRoutes'
import { useAuth } from '../../api/authState'
import AppNavbar from '../../components/AppNavbar'
import AirportCalendar from '../../components/AirportCalendar'
import { useSignOut } from '../../components/useSignOut'
import DateBreakdown from './DateBreakdown'
import RecommendedDates from './RecommendedDates'

export default function TrafficCalendarPage() {
  const { profile } = useAuth()
  const bookings = useMemo(() => profile ? readRecentRoutes(profile.id) : [], [profile])
  const { signOut, isSigningOut } = useSignOut()
  return <div className="traffic-calendar-page">
    <AppNavbar userName={profile?.username ?? ''} onSignOut={signOut} isSigningOut={isSigningOut} />
    <main className="record-page"><h1 className="traffic-calendar-title">Traffic Calendar</h1><AirportCalendar key={profile?.id} sidebar bookingRoutes={bookings} airlineFilter showFlightDirections renderDetails={selection => <DateBreakdown {...selection} />} renderBefore={selection => <RecommendedDates {...selection} />} /></main>
  </div>
}
