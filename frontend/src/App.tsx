import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import SignInPage from './pages/SignInPage'

export default function App() {
  return <BrowserRouter><Routes><Route path="/" element={<LandingPage />} /><Route path="/signin" element={<SignInPage />} /></Routes></BrowserRouter>
}

