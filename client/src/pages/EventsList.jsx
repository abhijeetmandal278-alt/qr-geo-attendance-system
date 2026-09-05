import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function EventsList() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const { user, logout } = useAuth();

  useEffect(() => {
    api
      .get('/events/upcoming')
      .then((res) => setEvents(res.data.events || []))
      .catch(() => setError('Could not load events'));
  }, []);

  return (
    <div className="page">
      <div className="navbar">
        <h2>Upcoming Events</h2>
        <div className="navbar-user">
          <span>Hi, {user?.name}</span>
          <button className="btn btn-secondary btn-sm" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      {error && <p className="form-error-text">{error}</p>}
      {events.length === 0 && !error && <p className="card-meta">No upcoming events.</p>}

      {events.map((ev) => (
        <div key={ev._id} className="card">
          <h3>{ev.name}</h3>
          <p className="card-meta">📍 {ev.venue}</p>
          <p className="card-meta">
            🗓️ {new Date(ev.date).toLocaleDateString()} at {ev.time}
          </p>
          <div className="card-actions">
            <Link to="/scan">
              <button className="btn btn-primary btn-sm">Scan QR to Mark Attendance</button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}