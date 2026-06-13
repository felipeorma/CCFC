import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TriangleAlert as AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Validate inputs
      if (!username.trim()) {
        throw new Error('Username is required');
      }
      if (!password.trim()) {
        throw new Error('Password is required');
      }
      
      // Attempt to sign in
      const result = await signIn(username, password);
      
      // If successful, navigate to home page
      if (result) {
        navigate('/');
      }
    } catch (err: any) {
      // Handle specific Supabase authentication errors
      if (err.message?.includes('Invalid login credentials')) {
        setError('Incorrect username or password. Please try again.');
      } else if (err.message?.includes('Failed to fetch')) {
        setError('Unable to connect to authentication service. Please check your internet connection and try again.');
      } else {
        setError('An error occurred while signing in. Please try again later.');
      }
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="flex flex-col items-center justify-center gap-4 mb-6">
            <img
              src="/Gemini_Generated_Image_2pj6ev2pj6ev2pj6.png"
              alt="Cavalry Football Center Logo"
              className="w-96 h-auto object-contain"
            />
          </div>
          <p className="text-text-secondary">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-error bg-opacity-10 border border-error text-error px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-text-secondary mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              placeholder="Enter your username"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`btn-primary w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-text-secondary">
          <p>Use username: <strong>Felipe</strong> or <strong>Coach</strong> to sign in.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;