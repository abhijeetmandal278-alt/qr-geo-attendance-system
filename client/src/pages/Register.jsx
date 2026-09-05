import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    registrationId: '',
    role: 'attendee',
  });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      navigate('/events');
    } catch (err) {
      setError(err.response?.data?.errors?.join(', ') || err.response?.data?.message || 'Registration failed');
    }
  }

  return (
    <div className="page-narrow">
      <div className="card">
        <h2 className="auth-title">Create your account</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" value={form.name} onChange={update('name')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={form.email} onChange={update('email')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={form.password}
              onChange={update('password')}
              required
              placeholder="Min 6 characters"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Registration ID</label>
            <input className="form-input" value={form.registrationId} onChange={update('registrationId')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" value={form.role} onChange={update('role')}>
              <option value="attendee">Attendee</option>
              <option value="organizer">Organizer</option>
            </select>
          </div>
          {error && <p className="form-error-text">{error}</p>}
          <button type="submit" className="btn btn-primary btn-block">
            Register
          </button>
        </form>
        <p className="form-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}