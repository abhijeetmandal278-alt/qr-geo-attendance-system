import { Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './App.css';
import Login from './pages/Login';
import Register from './pages/Register';
import EventsList from './pages/EventsList';
import ScanAttendance from './pages/ScanAttendance';
import OrganizerDashboard from './pages/OrganizerDashboard';
import EventForm from './pages/EventForm';
import EventDetail from './pages/EventDetail';
import ProtectedRoute from './components/ProtectedRoute';

function Home() {
  const [healthStatus, setHealthStatus] = useState(null);
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealthStatus(data))
      .catch(() => setHealthStatus({ status: 'error', message: 'Backend not reachable' }));
  }, []);

  return (
    <div>
      <header className="app-header">
        <h1>📋 Attendify</h1>
        <p className="subtitle">QR-Based Geo-Tagged Attendance Management System</p>
      </header>
      <main className="app-main">
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>System Status</h3>
          {healthStatus ? (
            <div className={`status-row ${healthStatus.status === 'ok' ? 'status-ok' : 'status-error'}`}>
              <span className="status-icon">{healthStatus.status === 'ok' ? '✅' : '❌'}</span>
              <div>
                <strong>API:</strong> {healthStatus.message}
              </div>
            </div>
          ) : (
            <p className="card-meta">Checking backend connection...</p>
          )}
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <a href="/login">Login</a> &nbsp;or&nbsp; <a href="/register">Register</a> to get started.
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/events"
        element={
          <ProtectedRoute>
            <EventsList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/scan"
        element={
          <ProtectedRoute>
            <ScanAttendance />
          </ProtectedRoute>
        }
      />

      <Route
        path="/organizer/dashboard"
        element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <OrganizerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/organizer/events/new"
        element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <EventForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/organizer/events/:id/edit"
        element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <EventForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/organizer/events/:id"
        element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <EventDetail />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;