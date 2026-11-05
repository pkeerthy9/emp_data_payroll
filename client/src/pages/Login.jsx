
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, MapPin } from 'lucide-react';
import api from '../services/api';
import './Login.css';

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });

      const { token, user } = response.data;

      // Save the authenticated user's login details.
      localStorage.setItem('trackpay_token', token);
      localStorage.setItem('trackpay_user', JSON.stringify(user));

      // Redirect users according to their assigned roles.
      if (user.role === 'admin') {
        navigate('/dashboard');
      } else if (user.role === 'employee') {
        navigate('/attendance');
      } else if (user.role === 'manager') {
        navigate('/manager-dashboard');
      } else {
        localStorage.removeItem('trackpay_token');
        localStorage.removeItem('trackpay_user');

        setError('Your account has an unsupported role.');
      }

    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to log in. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-decoration decoration-one" />
      <div className="login-decoration decoration-two" />

      <div className="login-card">
        <div className="login-brand-icon">
          <MapPin size={25} />
        </div>

        <h1>trackpay<span>.</span></h1>

        <p className="login-tagline">
          Track. Monitor. Calculate. Pay.
        </p>

        <div className="login-heading">
          <h2>Welcome back</h2>
          <p>
            Sign in to access your TrackPay workspace.
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <label>Email address</label>

          <div className="login-input">
            <Mail size={18} />

            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <label>Password</label>

          <div className="login-input">
            <Lock size={18} />

            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword
                ? <EyeOff size={18} />
                : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <p className="login-error">{error}</p>
          )}

          <button
            className="login-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in to TrackPay'}
          </button>
        </form>

        <p className="login-security">
          Secure access · TrackPay Workforce Management
        </p>
      </div>
    </div>
  );
}

export default Login;
