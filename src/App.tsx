import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import SeasonAnalysis from './pages/SeasonAnalysis';
import PPDAEvolution from './pages/PPDAEvolution';
import ShotsEvolution from './pages/ShotsEvolution';
import TeamRankings from './pages/TeamRankings';
import PlayerRankings from './pages/PlayerRankings';
import TeamPlayComparison from './pages/TeamPlayComparison';
import PlayerComparison from './pages/PlayerComparison';
import ScatterPlots from './pages/ScatterPlots';
import TeamScatterPlot from './pages/TeamScatterPlot';
import Schedule from './pages/Schedule';
import Settings from './pages/Settings';
import ScoutReports from './pages/ScoutReports';
import Campograma from './pages/Campograma';
import Analysis from './pages/Analysis';
import UserManagement from './pages/UserManagement';
import Login from './pages/Login';
import AdminRoute from './components/AdminRoute';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Settings from './pages/Settings';
import UserManagement from './pages/UserManagement';
import AdminRoute from './components/AdminRoute';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Componente interno para trackear page_views
function GoogleAnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.gtag === 'function') {
      window.gtag('config', 'G-51TL8XYWFQ', {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);

  return null;
}

function App() {
  useEffect(() => {
    // Inyectar el script de GA4 al cargar la app
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=G-51TL8XYWFQ`;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-51TL8XYWFQ');
    `;
    document.head.appendChild(script2);
  }, []);

  return (
    <Router>
      <GoogleAnalyticsTracker />
      <AuthProvider>
        <AppProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="season-analysis" element={<SeasonAnalysis />}>
                <Route path="ppda" element={<PPDAEvolution />} />
                <Route path="shots" element={<ShotsEvolution />} />
                <Route path="team-rankings" element={<TeamRankings />} />
                <Route path="team-play-comparison" element={<TeamPlayComparison />} />
                <Route path="player-comparison" element={<PlayerComparison />} />
                <Route path="scatter-plots" element={<ScatterPlots />} />
                <Route path="team-scatter-plot" element={<TeamScatterPlot />} />
              </Route>
              <Route path="player-rankings" element={<PlayerRankings />} />
              <Route path="campograma" element={<Campograma />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="settings" element={<AdminRoute><Settings /></AdminRoute>} />
              <Route path="scout-reports" element={<ScoutReports />} />
              <Route path="analysis" element={<Analysis />} />
              <Route path="user-management" element={<AdminRoute><UserManagement /></AdminRoute>} />
            </Route>
          </Routes>
        </AppProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
