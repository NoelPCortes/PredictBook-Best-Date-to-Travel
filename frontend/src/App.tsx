import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import HomePage from './pages/HomePage'

export default function App() {
  // TODO: Add a signed-in check for /home when authentication is implemented.
  return <BrowserRouter><Routes><Route path="/" element={<LandingPage />} /><Route path="/signin" element={<SignInPage />} /><Route path="/signup" element={<SignUpPage />} /><Route path="/home" element={<HomePage />} /></Routes></BrowserRouter>
}



