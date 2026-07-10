import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getApplications, createApplication } from '../api/applications';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { ApplicationForm } from '../components/ApplicationForm';
import { MapPin, Calendar, DollarSign, Plus } from 'lucide-react';

export const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal / Form states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getApplications();
      setApplications(data);
    } catch (err) {
      console.error('Error loading applications:', err);
      setError('Failed to load applications. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleCreateSubmit = async (payload) => {
    setSubmitting(true);
    setFormError(null);
    try {
      await createApplication(payload);
      setIsCreateOpen(false);
      fetchApplications();
    } catch (err) {
      console.error('Error creating application:', err);
      if (err.response && err.response.status === 422) {
        setFormError('Invalid data format submitted. Please review your fields.');
      } else {
        setFormError(err.response?.data?.detail || 'Failed to create application.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Selected': return 'emerald';
      case 'Rejected': return 'rose';
      case 'Withdrawn': return 'slate';
      case 'Applied': return 'indigo';
      default: return 'amber'; // Online Assessment, Technical Interview, HR Interview
    }
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        dateStyle: 'medium'
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount, currency) => {
    if (amount === null || amount === undefined) return 'N/A';
    return `${currency} ${Number(amount).toLocaleString()}`;
  };

  if (loading && applications.length === 0) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2 w-1/3">
            <div className="h-8 bg-slate-200 rounded w-3/4" />
            <div className="h-4 bg-slate-200 rounded w-1/2" />
          </div>
          <div className="h-10 bg-slate-200 rounded w-32" />
        </div>
        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-56 bg-slate-200 rounded-lg border border-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Applications"
        subtitle="Manage and track all your job applications in one place"
        actions={
          <Button onClick={() => setIsCreateOpen(true)} className="inline-flex items-center gap-1.5 h-10 shadow-sm">
            <Plus className="w-4 h-4" /> Add Application
          </Button>
        }
      />

      {error && (
        <Card className="border-rose-200 bg-rose-50/20 text-center py-10 px-4 max-w-lg mx-auto mt-10">
          <h2 className="text-lg font-bold text-rose-800 mb-2">Error Loading Applications</h2>
          <p className="text-sm text-rose-600 mb-6">{error}</p>
          <Button onClick={fetchApplications} className="h-10">Retry Loading</Button>
        </Card>
      )}

      {!error && applications.length === 0 ? (
        <EmptyState
          title="No applications tracked yet"
          description="Add job applications to start tracking interviews and deadlines."
          actionButton={
            <Button onClick={() => setIsCreateOpen(true)} className="h-10">
              Add Your First Application
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((app) => (
            <Card key={app.id} className="hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex flex-col justify-between border border-slate-200 p-6 bg-white rounded-lg">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <Badge color={getStatusColor(app.status)}>{app.status}</Badge>
                </div>
                <h3 className="text-lg font-bold text-slate-900 truncate tracking-tight">
                  <Link to={`/applications/${app.id}`} className="hover:text-indigo-600 transition-colors">
                    {app.company_name}
                  </Link>
                </h3>
                <p className="text-sm text-slate-500 font-semibold mb-5 truncate">{app.job_role}</p>

                <div className="space-y-2.5 text-xs text-slate-500 font-medium">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2.5 text-slate-400 shrink-0" />
                    <span className="truncate">{app.job_location || 'Remote / N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2.5 text-slate-400 shrink-0" />
                    <span>Applied on {formatDateOnly(app.applied_date)}</span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-2.5 text-slate-400 shrink-0" />
                    <span>Package: {formatCurrency(app.package_amount, app.package_currency)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <Link to={`/applications/${app.id}`} className="w-full">
                  <Button variant="secondary" className="w-full text-xs h-9">
                    View Details
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Application Modal Overlay */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto animate-modal-scale">
            <h2 className="text-xl font-bold text-slate-900 mb-4 tracking-tight border-b border-slate-100 pb-3">Add Job Application</h2>
            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-sm font-medium">
                {formError}
              </div>
            )}
            <ApplicationForm
              onSubmit={handleCreateSubmit}
              onCancel={() => setIsCreateOpen(false)}
              submitting={submitting}
              submitLabel="Add Application"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;
