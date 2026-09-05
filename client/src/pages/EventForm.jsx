import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const emptyForm = {
  name: '',
  venue: '',
  date: '',
  time: '',
  latitude: '',
  longitude: '',
  geofenceRadius: 100,
  description: '',
};

export default function EventForm() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!isEditMode) return;

    api
      .get(`/events/${id}`)
      .then((res) => {
        const ev = res.data.event;
        setForm({
          name: ev.name || '',
          venue: ev.venue || '',
          date: ev.date ? ev.date.substring(0, 10) : '',
          time: ev.time || '',
          latitude: ev.latitude ?? '',
          longitude: ev.longitude ?? '',
          geofenceRadius: ev.geofenceRadius ?? 100,
          description: ev.description || '',
        });
      })
      .catch(() => setErrors(['Could not load event details']))
      .finally(() => setLoading(false));
  }, [id, isEditMode]);

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleGenerateDescription() {
    if (!form.name || !form.venue) {
      alert('Please enter the event name and venue first.');
      return;
    }
    setGenerating(true);
    try {
      const res = await api.post('/ai/generate-description', {
        name: form.name,
        venue: form.venue,
        date: form.date,
        time: form.time,
      });
      setForm({ ...form, description: res.data.description });
    } catch (err) {
      alert(err.response?.data?.error || 'AI generation failed');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);

    const payload = {
      ...form,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      geofenceRadius: parseInt(form.geofenceRadius, 10),
    };

    try {
      if (isEditMode) {
        await api.put(`/events/${id}`, payload);
      } else {
        await api.post('/events', payload);
      }
      navigate('/organizer/dashboard');
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      const apiMessage = err.response?.data?.message;
      setErrors(apiErrors || (apiMessage ? [apiMessage] : ['Failed to save event']));
    }
  }

  if (loading) return <p className="card-meta" style={{ textAlign: 'center', marginTop: '3rem' }}>Loading...</p>;

  return (
    <div className="page-narrow">
      <div className="card">
        <h2 className="auth-title">{isEditMode ? 'Edit Event' : 'Create New Event'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Event Name</label>
            <input className="form-input" value={form.name} onChange={update('name')} required />
          </div>

          <div className="form-group">
            <label className="form-label">Venue</label>
            <input className="form-input" value={form.venue} onChange={update('venue')} required />
          </div>

          <div className="form-group">
            <div className="form-row">
              <label className="form-label" style={{ marginBottom: 0 }}>Description</label>
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={generating}
                className="btn btn-secondary btn-sm"
              >
                {generating ? 'Generating...' : '✨ Generate with AI'}
              </button>
            </div>
            <textarea
              placeholder="Event description (or click 'Generate with AI' above)"
              className="form-textarea"
              value={form.description}
              onChange={update('description')}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={form.date} onChange={update('date')} required />
          </div>

          <div className="form-group">
            <label className="form-label">Time</label>
            <input
              placeholder="e.g. 10:00 AM"
              className="form-input"
              value={form.time}
              onChange={update('time')}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Latitude</label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 12.8230"
              className="form-input"
              value={form.latitude}
              onChange={update('latitude')}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Longitude</label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 80.0444"
              className="form-input"
              value={form.longitude}
              onChange={update('longitude')}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Geofence Radius (meters)</label>
            <input
              type="number"
              className="form-input"
              value={form.geofenceRadius}
              onChange={update('geofenceRadius')}
              required
            />
          </div>

          {errors.length > 0 && (
            <ul className="form-error-list">
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}

          <button type="submit" className="btn btn-primary btn-block">
            {isEditMode ? 'Save Changes' : 'Create Event'}
          </button>
        </form>
      </div>
    </div>
  );
}