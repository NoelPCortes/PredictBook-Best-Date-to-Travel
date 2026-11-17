import { useAuth } from '../../api/authState'
import AppNavbar from '../../components/AppNavbar'
import AirportCalendar from '../../components/AirportCalendar'
import { useSignOut } from '../../components/useSignOut'
import DateBreakdown from './DateBreakdown'

export default function TrafficCalendarPage() {
  const { profile } = useAuth()
  const { signOut, isSigningOut } = useSignOut()
  return <>
    <AppNavbar userName={profile?.username ?? ''} onSignOut={signOut} isSigningOut={isSigningOut} />
    <main className="record-page"><h1>Traffic Calendar</h1><AirportCalendar showFlightDirections renderDetails={selection => <DateBreakdown {...selection} />} /></main>
  </>
}
