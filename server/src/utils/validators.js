// Simple email regex — sufficient for basic validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate register input fields.
 * @param {object} body - req.body
 * @returns {{ valid: boolean, error?: string }}
 */
const validateRegisterInput = ({ name, email, password, registrationId, role }) => {
  if (!name || !email || !password || !registrationId) {
    return { valid: false, error: 'All fields are required (name, email, password, registrationId)' };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, error: 'Please provide a valid email address' };
  }

  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' };
  }

  if (role && !['attendee', 'organizer'].includes(role)) {
    return { valid: false, error: 'Role must be either "attendee" or "organizer"' };
  }

  return { valid: true };
};

/**
 * Validate login input fields.
 * @param {object} body - req.body
 * @returns {{ valid: boolean, error?: string }}
 */
const validateLoginInput = ({ email, password }) => {
  if (!email || !password) {
    return { valid: false, error: 'Email and password are required' };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, error: 'Please provide a valid email address' };
  }

  return { valid: true };
};

module.exports = { validateRegisterInput, validateLoginInput };
