import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getApplication, updateApplication, deleteApplication } from '../api/applications';
import { getInterviewsByApplication, createInterview, updateInterview, deleteInterview } from '../api/interviews';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { ApplicationForm } from '../components/ApplicationForm';
import { InterviewForm } from '../components/InterviewForm';
import { ArrowLeft, MapPin, Calendar, DollarSign, Globe, Edit2, Trash2, Link as LinkIcon, Plus, ExternalLink } from 'lucide-react';

export const ApplicationDetails = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Application Edit / Delete Modal states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Interview CRUD states
  const [isCreateIntOpen, setIsCreateIntOpen] = useState(false);
  const [isEditIntOpen, setIsEditIntOpen] = useState(false);
  const [isDeleteIntOpen, setIsDeleteIntOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [intSubmitting, setIntSubmitting] = useState(false);
  const [intDeleting, setIntDeleting] = useState(false);
  const [intFormError, setIntFormError] = useState(null);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [appData, interviewsData] = await Promise.all([
        getApplication(applicationId),
        getInterviewsByApplication(applicationId).catch(err => {
          console.error('Failed to load nested interviews:', err);
          return [];
        })
      ]);
      setApplication(appData);
      setInterviews(interviewsData);
    } catch (err) {
      console.error('Error fetching application details:', err);
      if (err.response && err.response.status === 404) {
        setError('Application not found or access is unauthorized.');
      } else {
        setError('Failed to load application details.');
      }
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // App handlers
  const handleEditSubmit = async (payload) => {
    setSubmitting(true);
    setFormError(null);
    try {
      const updated = await updateApplication(applicationId, payload);
      setApplication(updated);
      setIsEditOpen(false);
      fetchDetails();
    } catch (err) {
      console.error('Error updating application:', err);
      if (err.response && err.response.status === 422) {
        setFormError('Invalid data format submitted.');
      } else {
        setFormError(err.response?.data?.detail || 'Failed to update application.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteApplication(applicationId);
      setIsDeleteOpen(false);
      navigate('/applications');
    } catch (err) {
      console.error('Error deleting application:', err);
      window.alert('Failed to delete application. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Interview handlers
  const handleCreateIntSubmit = async (payload) => {
    setIntSubmitting(true);
    setIntFormError(null);
    try {
      await createInterview(applicationId, payload);
      setIsCreateIntOpen(false);
      fetchDetails();
    } catch (err) {
      console.error('Error creating interview:', err);
      if (err.response && err.response.status === 422) {
        setIntFormError('Invalid data format submitted.');
      } else {
        setIntFormError(err.response?.data?.detail || 'Failed to create interview.');
      }
    } finally {
      setIntSubmitting(false);
    }
  };

  const handleEditIntSubmit = async (payload) => {
    setIntSubmitting(true);
    setIntFormError(null);
    try {
      await updateInterview(selectedInterview.id, payload);
      setIsEditIntOpen(false);
      setSelectedInterview(null);
      fetchDetails();
    } catch (err) {
      console.error('Error updating interview:', err);
      if (err.response && err.response.status === 422) {
        setIntFormError('Invalid data format submitted.');
      } else {
        setIntFormError(err.response?.data?.detail || 'Failed to update interview.');
      }
    } finally {
      setIntSubmitting(false);
    }
  };

  const handleDeleteInt = async () => {
    setIntDeleting(true);
    try {
      await deleteInterview(selectedInterview.id);
      setIsDeleteIntOpen(false);
      setSelectedInterview(null);
      fetchDetails();
    } catch (err) {
      console.error('Error deleting interview:', err);
      window.alert('Failed to delete interview round.');
    } finally {
      setIntDeleting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Selected': return 'emerald';
      case 'Rejected': return 'rose';
      case 'Withdrawn': return 'slate';
      case 'Applied': return 'indigo';
      default: return 'amber';
    }
  };

  const getResultColor = (result) => {
    switch (result) {
      case 'Cleared': return 'emerald';
      case 'Failed': return 'rose';
      case 'Cancelled': return 'slate';
      default: return 'amber'; // Pending
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

  const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const date = new Date(isoString);
      return date.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch {
      return isoString;
    }
  };

  const formatCurrency = (amount, currency) => {
    if (amount === null || amount === undefined) return 'N/A';
    return `${currency} ${Number(amount).toLocaleString()}`;
  };

  if (loading && !application) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Back Link Skeleton */}
        <div className="h-4 bg-slate-200 rounded w-1/6" />
        {/* Header Skeleton */}
        <div className="flex justify-between items-center mt-4">
          <div className="space-y-2 w-1/3">
            <div className="h-8 bg-slate-200 rounded w-3/4" />
            <div className="h-4 bg-slate-200 rounded w-1/2" />
          </div>
          <div className="h-10 bg-slate-200 rounded w-48" />
        </div>
        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 h-96 bg-slate-200 rounded-lg border border-slate-200" />
          <div className="h-48 bg-slate-200 rounded-lg border border-slate-200" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-rose-200 bg-rose-50/20 text-center py-10 px-4 max-w-lg mx-auto mt-10 animate-fade-up">
        <h2 className="text-xl font-bold text-rose-800 mb-2">Error Loading Details</h2>
        <p className="text-sm text-rose-600 mb-6">{error}</p>
        <Link to="/applications">
          <Button variant="secondary" className="h-10">Back to Applications</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <div className="flex items-center space-x-2">
        <Link to="/applications" className="text-slate-500 hover:text-indigo-600 inline-flex items-center text-sm font-semibold transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to applications
        </Link>
      </div>

      {/* Title Header */}
      <PageHeader
        title={application.company_name}
        subtitle={application.job_role}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setIsEditOpen(true)} className="inline-flex items-center gap-1.5 h-10 shadow-sm">
              <Edit2 className="w-4 h-4" /> Edit Details
            </Button>
            <Button variant="danger" onClick={() => setIsDeleteOpen(true)} className="inline-flex items-center gap-1.5 h-10 shadow-sm">
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details and Interviews */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 shadow-sm bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-4 border-b border-slate-100 pb-3">Application Details</h2>
            <div className="space-y-5">
              {application.notes && (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Notes</span>
                  <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed font-medium">{application.notes}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm pt-2">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-3 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Job Location</span>
                    <span className="text-slate-800 font-semibold">{application.job_location || 'Remote / N/A'}</span>
                  </div>
                </div>

                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-3 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Applied Date</span>
                    <span className="text-slate-800 font-semibold">{formatDateOnly(application.applied_date)}</span>
                  </div>
                </div>

                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-3 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Compensation Package</span>
                    <span className="text-slate-800 font-semibold">{formatCurrency(application.package_amount, application.package_currency)}</span>
                  </div>
                </div>

                {application.job_url && (
                  <div className="flex items-center">
                    <Globe className="w-5 h-5 mr-3 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Job Link</span>
                      <a
                        href={application.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-500 font-semibold inline-flex items-center gap-1 transition-colors"
                      >
                        Visit Job Posting <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Nested Interviews Timeline Section */}
          <Card className="border border-slate-200 shadow-sm bg-white p-6">
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Interview Timeline</h2>
              <Button variant="secondary" className="text-xs px-3 py-1.5 inline-flex items-center gap-1 h-8" onClick={() => setIsCreateIntOpen(true)}>
                <Plus className="w-3.5 h-3.5" /> Schedule Round
              </Button>
            </div>
            {interviews.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-lg bg-slate-50/50 px-4">
                <p className="text-sm text-slate-500 font-medium">No interview rounds scheduled yet.</p>
                <Button className="mt-4 text-xs h-9" variant="secondary" onClick={() => setIsCreateIntOpen(true)}>
                  Schedule Your First Round
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {interviews.map((int) => (
                  <div key={int.id} className="p-4 border border-slate-150 rounded-lg bg-slate-50/40 hover:border-slate-300 transition-all flex flex-col space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{int.round_name}</h4>
                        <div className="flex items-center text-xs text-slate-500 mt-1 space-x-1.5 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formatDateTime(int.interview_date)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                        <Badge color="slate">{int.interview_mode}</Badge>
                        <Badge color={getResultColor(int.result)}>{int.result}</Badge>
                      </div>
                    </div>

                    {int.meeting_link && (
                      <div className="text-xs font-semibold p-2 bg-indigo-50/40 rounded border border-indigo-100/40 flex items-center">
                        <LinkIcon className="w-3.5 h-3.5 text-indigo-500 mr-2 shrink-0" />
                        <span className="text-slate-500 mr-1.5 font-bold">Meeting:</span>
                        <a
                          href={int.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-550 font-bold inline-flex items-center gap-0.5 transition-colors"
                        >
                          Join meeting <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {(int.preparation_notes || int.post_interview_feedback) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-3 border-t border-slate-100">
                        {int.preparation_notes && (
                          <div>
                            <span className="text-slate-400 font-bold block mb-1 uppercase tracking-wider">Preparation Notes</span>
                            <p className="text-slate-600 whitespace-pre-line leading-relaxed font-medium">{int.preparation_notes}</p>
                          </div>
                        )}
                        {int.post_interview_feedback && (
                          <div>
                            <span className="text-slate-400 font-bold block mb-1 uppercase tracking-wider">Post-Round Feedback</span>
                            <p className="text-slate-600 whitespace-pre-line leading-relaxed font-medium">{int.post_interview_feedback}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end gap-1.5 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setSelectedInterview(int);
                          setIsEditIntOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md focus:outline-none transition-colors cursor-pointer"
                        title="Edit Round"
                        aria-label="Edit Round"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedInterview(int);
                          setIsDeleteIntOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md focus:outline-none transition-colors cursor-pointer"
                        title="Delete Round"
                        aria-label="Delete Round"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar Info Panel */}
        <div className="space-y-6">
          <Card className="border border-slate-200 shadow-sm bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-4 border-b border-slate-100 pb-3">Application Status</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-sm text-slate-500 font-medium">Current Status:</span>
                <Badge color={getStatusColor(application.status)} className="text-sm px-3.5 py-1">
                  {application.status}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-400 font-semibold">
                <span>Created at:</span>
                <span>{formatDateOnly(application.created_at)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Application Modal Overlay */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto animate-modal-scale">
            <h2 className="text-xl font-bold text-slate-900 mb-4 tracking-tight border-b border-slate-100 pb-3">Edit Job Application</h2>
            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-sm font-medium">
                {formError}
              </div>
            )}
            <ApplicationForm
              initialValues={application}
              onSubmit={handleEditSubmit}
              onCancel={() => setIsEditOpen(false)}
              submitting={submitting}
              submitLabel="Save Changes"
            />
          </div>
        </div>
      )}

      {/* Delete Application Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-md w-full p-6 text-center animate-modal-scale">
            <h2 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Delete Job Application</h2>
            <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">
              Deleting this application will also remove its interview rounds. Linked reminders will be kept as general reminders.
            </p>
            <div className="flex justify-center space-x-3">
              <Button variant="secondary" onClick={() => setIsDeleteOpen(false)} disabled={deleting} className="h-10">
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete} disabled={deleting} className="h-10">
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Interview Modal Overlay */}
      {isCreateIntOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto animate-modal-scale">
            <h2 className="text-xl font-bold text-slate-900 mb-4 tracking-tight border-b border-slate-100 pb-3">Schedule Interview Round</h2>
            {intFormError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-sm font-medium">
                {intFormError}
              </div>
            )}
            <InterviewForm
              onSubmit={handleCreateIntSubmit}
              onCancel={() => setIsCreateIntOpen(false)}
              submitting={intSubmitting}
              submitLabel="Schedule Round"
            />
          </div>
        </div>
      )}

      {/* Edit Interview Modal Overlay */}
      {isEditIntOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto animate-modal-scale">
            <h2 className="text-xl font-bold text-slate-900 mb-4 tracking-tight border-b border-slate-100 pb-3">Edit Interview Round</h2>
            {intFormError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-sm font-medium">
                {intFormError}
              </div>
            )}
            <InterviewForm
              initialValues={selectedInterview}
              onSubmit={handleEditIntSubmit}
              onCancel={() => {
                setIsEditIntOpen(false);
                setSelectedInterview(null);
              }}
              submitting={intSubmitting}
              submitLabel="Save Changes"
            />
          </div>
        </div>
      )}

      {/* Delete Interview Confirmation Modal */}
      {isDeleteIntOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-md w-full p-6 text-center animate-modal-scale">
            <h2 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Delete Interview Round</h2>
            <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">
              Are you sure you want to permanently delete this interview round? This action cannot be undone.
            </p>
            <div className="flex justify-center space-x-3">
              <Button variant="secondary" onClick={() => {
                setIsDeleteIntOpen(false);
                setSelectedInterview(null);
              }} disabled={intDeleting} className="h-10">
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteInt} disabled={intDeleting} className="h-10">
                {intDeleting ? 'Deleting...' : 'Delete Permanently'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationDetails;
