import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as apiRegister } from '../api/auth';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Briefcase, Eye, EyeOff } from 'lucide-react';

export const Register = () => {
  const navigate = useNavigate();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Feedback states
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [apiError, setApiError] = useState(null);

  const isSubmittingRef = useRef(false);

  const validate = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name.trim()) {
      errors.name = 'Name is required';
    } else if (name.trim().length < 2 || name.trim().length > 100) {
      errors.name = 'Name must be between 2 and 100 characters';
    }

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8 || password.length > 128) {
      errors.password = 'Password must be between 8 and 128 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    setApiError(null);

    if (!validate()) return;

    isSubmittingRef.current = true;
    setSubmitting(true);
    try {
      // Normalizes email input to lowercase before sending to API
      await apiRegister(name.trim(), email.trim().toLowerCase(), password);
      navigate('/login?registered=true');
    } catch (err) {
      console.error('Registration error:', err);
      if (err.response) {
        if (err.response.status === 409) {
          setApiError('Email already registered.');
        } else if (err.response.status === 422) {
          setApiError('Invalid registration data details.');
        } else {
          setApiError(err.response.data?.detail || 'An unexpected error occurred. Please try again.');
        }
      } else {
        setApiError('Network error: Unable to contact the backend server.');
      }
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 relative overflow-hidden">
      {/* Decorative background radial accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-100/40 to-slate-100 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-md w-full space-y-8 animate-fade-up">
        {/* Brand Area */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200 mb-4">
            <Briefcase className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create your account</h2>
          <p className="mt-2 text-sm text-slate-600">
            Start tracking your job placement path
          </p>
        </div>

        <Card className="border border-slate-200 shadow-xl bg-white/90 backdrop-blur-xs">
          {apiError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-sm font-medium">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <Input
              label="Full Name"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Johnson"
              error={validationErrors.name}
              disabled={submitting}
            />

            <Input
              label="Email Address"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@student.edu"
              error={validationErrors.email}
              disabled={submitting}
            />

            {/* Password input with visibility toggle */}
            <div className="flex flex-col space-y-1 w-full">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={submitting}
                  className={`w-full pl-3 pr-10 py-2 border rounded-md text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white ${
                    validationErrors.password 
                      ? 'border-rose-300 text-rose-900 focus:ring-rose-500 focus:border-rose-500' 
                      : 'border-slate-300 text-slate-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {validationErrors.password && (
                <p className="text-xs text-rose-600 mt-1" id="password-error">
                  {validationErrors.password}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full h-10 mt-2" disabled={submitting}>
              {submitting ? 'Registering...' : 'Register Account'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm border-t border-slate-100 pt-5">
            <span className="text-slate-500">Already have an account? </span>
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
              Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Register;
