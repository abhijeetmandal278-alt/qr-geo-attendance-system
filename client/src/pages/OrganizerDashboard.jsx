import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function OrganizerDashboard() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadEvents();
  }, []);

  function loadEvents() {
    setLoading(true);
    api
      .get('/events/mine')
      .then((res) => setEvents(res.data.events || []))
      .catch(() => setError('Could not load your events'))
      .finally(() => setLoading(false));
  }

  async function handleDelete(id, name) {
    const confirmed = window.confirm(`Delete "${name}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await api.delete(`/events/${id}`);
      loadEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete event');
    }
  }

  return (
    <div className="page">
      <div className="navbar">
        <h2>My Events</h2>
        <div className="navbar-user">
          <span>Hi, {user?.name}</span>
          <button className="btn btn-secondary btn-sm" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <button
        className="btn btn-primary"
        onClick={() => navigate('/organizer/events/new')}
        style={{ marginBottom: 20 }}
      >
        + Create New Event
      </button>

      {loading && <p className="card-meta">Loading events...</p>}
      {error && <p className="form-error-text">{error}</p>}
      {!loading && events.length === 0 && !error && <p className="card-meta">You haven't created any events yet.</p>}

      {events.map((ev) => (
        <div key={ev._id} className="card">
          <h3>{ev.name}</h3>
          <p className="card-meta">📍 {ev.venue}</p>
          <p className="card-meta">
            🗓️ {new Date(ev.date).toLocaleDateString()} at {ev.time}
          </p>
          <p className="card-meta">📏 Geofence: {ev.geofenceRadius}m</p>
          <div className="card-actions">
            <Link to={`/organizer/events/${ev._id}`}>
              <button className="btn btn-primary btn-sm">View QR & Attendees</button>
            </Link>
            <Link to={`/organizer/events/${ev._id}/edit`}>
              <button className="btn btn-secondary btn-sm">Edit</button>
            </Link>
            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(ev._id, ev.name)}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}