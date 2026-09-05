import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';

export default function EventDetail() {
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [stats, setStats] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => loadData(false), 5000);
    return () => clearInterval(interval);
  }, [id]);

  function loadData(showLoading) {
    if (showLoading) setLoading(true);

    Promise.all([
      api.get(`/events/${id}`),
      api.get(`/attendance/event/${id}/stats`),
      api.get(`/attendance/event/${id}`),
    ])
      .then(([eventRes, statsRes, attendanceRes]) => {
        setEvent(eventRes.data.event);
        setStats(statsRes.data.stats || statsRes.data);
        setAttendance(
          attendanceRes.data.attendance ||
          attendanceRes.data.records ||
          attendanceRes.data.data ||
          (Array.isArray(attendanceRes.data) ? attendanceRes.data : [])
        );
      })
      .catch(() => setError('Could not load event details'))
      .finally(() => {
        if (showLoading) setLoading(false);
      });
  }

  async function handleExportCSV() {
    try {
      const res = await api.get(`/attendance/event/${id}/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${event.name.replace(/[^a-z0-9]/gi, '_')}_attendance.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export CSV');
    }
  }

  const filteredAttendance = attendance.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.user?.name?.toLowerCase().includes(q) ||
      a.user?.email?.toLowerCase().includes(q) ||
      a.user?.registrationId?.toLowerCase().includes(q)
    );
  });

  if (loading) return <p className="card-meta" style={{ textAlign: 'center', marginTop: '3rem' }}>Loading...</p>;
  if (error) return <p className="form-error-text" style={{ textAlign: 'center', marginTop: '3rem' }}>{error}</p>;

  return (
    <div className="page">
      <Link to="/organizer/dashboard" className="back-link">← Back to My Events</Link>
      <h2>{event.name}</h2>
      <p className="card-meta">
        📍 {event.venue} &nbsp; 🗓️ {new Date(event.date).toLocaleDateString()} at {event.time} &nbsp; 📏{' '}
        {event.geofenceRadius}m radius
      </p>
      {event.description && (
        <p className="card-meta" style={{ marginTop: 8, fontStyle: 'italic' }}>{event.description}</p>
      )}

      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', margin: '24px 0' }}>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ marginBottom: 12 }}>Event QR Code</h3>
          <div className="qr-box">
            <QRCodeSVG value={event.qrCode} size={200} />
          </div>
          <p className="qr-caption">Attendees scan this to mark their attendance</p>
        </div>

        {stats && (
          <div className="stats-row" style={{ alignItems: 'flex-start' }}>
            <div className="stat-card">
              <div className="stat-value">{stats.totalRegistrations}</div>
              <div className="stat-label">Registrations</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.totalAttendees}</div>
              <div className="stat-label">Attendees</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.attendancePercentage}%</div>
              <div className="stat-label">Attendance %</div>
            </div>
          </div>
        )}
      </div>

            <div className="card card-static">
        <div className="navbar" style={{ marginBottom: 12 }}>
          <h3 style={{ color: 'var(--text)' }}>
            Attendees
            <span className="badge-live">
              <span className="badge-dot" /> Live
            </span>
          </h3>
          <button onClick={handleExportCSV} className="btn btn-secondary btn-sm">
            ⬇ Export CSV
          </button>
        </div>

        <input
          placeholder="Search by name, email, or registration ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />

        {filteredAttendance.length === 0 ? (
          <p className="card-meta">No attendance records{search ? ' matching your search' : ' yet'}.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Registration ID</th>
                  <th>Email</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.map((a) => (
                  <tr key={a._id}>
                    <td>{a.user?.name}</td>
                    <td>{a.user?.registrationId}</td>
                    <td>{a.user?.email}</td>
                    <td>{new Date(a.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}