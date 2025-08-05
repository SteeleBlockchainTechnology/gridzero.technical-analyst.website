'use client'

import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom'
import VerificationPage from './components/VerificationPage'
import MainApp from './components/MainApp'

function AppContent() {
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkVerification = async () => {
      try {
        const response = await fetch('/api/check-verification', {
          credentials: 'include'
        });
        const data = await response.json();
        setIsVerified(data.verified);
      } catch (error) {
        console.error('Error checking verification:', error);
        setIsVerified(false);
      } finally {
        setLoading(false);
      }
    };

    checkVerification();
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <div className="text-white text-xl">Loading verification status...</div>
      </div>
    );
  }

  // Check if we're on the verification failed page
  if (location.pathname === '/verification-failed') {
    return <VerificationPage type="failed" />;
  }

  // If not verified, show unauthorized page
  if (!isVerified) {
    return <VerificationPage type="unauthorized" />;
  }

  // If verified, show the main app
  return <MainApp />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/*" element={<AppContent />} />
      </Routes>
    </Router>
  );
}
