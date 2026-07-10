import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { updateCurrentUser, deleteCurrentUser } from '../api/auth';
import { Eye, EyeOff, ShieldAlert } from 'lucide-react';

export const Profile = () => {
  const { user, setUser, logoutUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(false);
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isSubmittingRef = useRef(false);
  const isDeletingRef = useRef(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const validate = () => {
    const errs = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name.trim()) {
      errs.name = 'Name is required';
    } else if (name.trim().length < 2 || name.trim().length > 100) {
      errs.name = 'Name must be between 2 and 100 characters';
    }

    if (!email.trim()) {
      errs.email = 'Email is required';
    } else if (!emailRegex.test(email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    if (password && (password.length < 8 || password.length > 128)) {
      errs.password = 'Password must be between 8 and 128 characters';
    }

    const firstError = Object.values(errs)[0];
    if (firstError) {
      setFormError(firstError);
      return false;
    }
    return true;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    setFormError(null);
    setFormSuccess(false);

    if (!validate()) return;

    isSubmittingRef.current = true;
    setSubmitting(true);

    // Build payload. Strategy: Full editable payload (name, email).
    // Send password only if it is explicitly typed in by the user.
    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase() // Email normalization
    };

    if (password) {
      payload.password = password;
    }

    try {
      const updatedUser = await updateCurrentUser(payload);
      setUser(updatedUser);
      setPassword(''); // Clear password field
      setFormSuccess(true);
    } catch (err) {
      console.error('Error updating profile:', err);
      if (err.response && err.response.status === 409) {
        setFormError('That email address is already registered.');
      } else if (err.response && err.response.status === 422) {
        setFormError('Invalid format or validation constraints failed.');
      } else {
        setFormError('Failed to update profile. Please try again.');
      }
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (isDeletingRef.current) return;
    isDeletingRef.current = true;
    setDeleting(true);

    try {
      await deleteCurrentUser();
      setIsDeleteOpen(false);
      
      // Perform frontend session cleanup
      logoutUser(); // Clears localStorage, deletes headers, and sets user to null
      navigate('/login');
    } catch (err) {
      console.error('Error deleting account:', err);
      window.alert('Failed to delete account. Please try again.');
    } finally {
      isDeletingRef.current = false;
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile Settings"
        subtitle="View your personal details and account settings"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="border border-slate-200 shadow-sm bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-4 border-b border-slate-100 pb-3">Profile Details</h3>
            
            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-sm font-medium">
                {formError}
              </div>
            )}
            
            {formSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-sm font-medium">
                Profile updated successfully.
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-5" noValidate>
              <Input
                label="Name *"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
              />
              <Input
                label="Email *"
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />

              {/* Password field with show/hide toggle */}
              <div className="flex flex-col space-y-1 w-full">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">
                  New Password (Optional)
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to keep current password"
                    disabled={submitting}
                    className="w-full pl-3 pr-10 py-2 border rounded-md text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white border-slate-300 text-slate-900"
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
              </div>
              
              <div className="pt-2 flex justify-end">
                <Button type="submit" disabled={submitting} className="h-10">
                  {submitting ? 'Saving...' : 'Update Profile'}
                </Button>
              </div>
            </form>
          </Card>

          <Card className="border border-slate-200 shadow-sm bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-2">Account Actions</h3>
            <p className="text-sm text-slate-500 mb-4 font-medium">
              Sign out of your active workspace session.
            </p>
            <div className="flex justify-end">
              <Button onClick={logoutUser} variant="secondary" className="h-10">
                Sign Out / Logout
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border border-rose-200 bg-rose-50/20 p-6 rounded-lg">
            <div className="flex items-center gap-2 text-rose-700 mb-3">
              <ShieldAlert className="h-5 w-5" />
              <h3 className="text-lg font-bold">Danger Zone</h3>
            </div>
            <p className="text-sm text-slate-600 mb-5 font-medium leading-relaxed">
              Permanently delete your account. This action is irreversible. All applications, interviews, general reminders, and linked reminders will be permanently removed.
            </p>
            <Button variant="danger" className="w-full h-10 shadow-sm" onClick={() => setIsDeleteOpen(true)}>
              Delete Account
            </Button>
          </Card>
        </div>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-md w-full p-6 text-center animate-modal-scale">
            <h2 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Delete Account Permanently?</h2>
            <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">
              Are you sure you want to permanently delete your account? This action cannot be undone. All job applications, scheduled interviews, and reminders will be lost.
            </p>
            <div className="flex justify-center space-x-3">
              <Button variant="secondary" onClick={() => setIsDeleteOpen(false)} disabled={deleting} className="h-10">
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteAccount} disabled={deleting} className="h-10">
                {deleting ? 'Deleting Account...' : 'Permanently Delete Account'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
