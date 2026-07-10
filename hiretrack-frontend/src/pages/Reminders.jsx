import React, { useState, useEffect, useCallback } from 'react';
import { getReminders, createReminder, updateReminder, deleteReminder } from '../api/reminders';
import { getApplications } from '../api/applications';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import { ReminderForm } from '../components/ReminderForm';
import { Calendar, Trash2, Edit2, CheckSquare, Square, Plus } from 'lucide-react';

export const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form Modals states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [remindersData, appsData] = await Promise.all([
        getReminders(),
        getApplications().catch(err => {
          console.error('Failed to load applications for selector:', err);
          return [];
        })
      ]);
      setReminders(remindersData);
      setApplications(appsData);
    } catch (err) {
      console.error('Error fetching reminders page data:', err);
      setError('Failed to load reminders. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create handler
  const handleCreateSubmit = async (payload) => {
    setSubmitting(true);
    setFormError(null);
    try {
      await createReminder(payload);
      setIsCreateOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error creating reminder:', err);
      if (err.response && err.response.status === 422) {
        setFormError('Invalid data format submitted.');
      } else {
        setFormError(err.response?.data?.detail || 'Failed to create reminder.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Edit handler
  const handleEditSubmit = async (payload) => {
    setSubmitting(true);
    setFormError(null);
    try {
      await updateReminder(selectedReminder.id, payload);
      setIsEditOpen(false);
      setSelectedReminder(null);
      fetchData();
    } catch (err) {
      console.error('Error updating reminder:', err);
      if (err.response && err.response.status === 422) {
        setFormError('Invalid data format submitted.');
      } else {
        setFormError(err.response?.data?.detail || 'Failed to update reminder.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle is_completed state handler
  const handleToggleComplete = async (reminder) => {
    try {
      await updateReminder(reminder.id, { is_completed: !reminder.is_completed });
      // Optimistically update state
      setReminders(prev =>
        prev.map(r => (r.id === reminder.id ? { ...r, is_completed: !r.is_completed } : r))
      );
    } catch (err) {
      console.error('Failed to toggle reminder status:', err);
      window.alert('Failed to update completion status.');
      fetchData(); // Rollback to actual database state
    }
  };

  // Delete handler
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteReminder(selectedReminder.id);
      setIsDeleteOpen(false);
      setSelectedReminder(null);
      fetchData();
    } catch (err) {
      console.error('Error deleting reminder:', err);
      window.alert('Failed to delete reminder.');
    } finally {
      setDeleting(false);
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

  if (loading && reminders.length === 0) {
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
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 bg-slate-200 rounded-lg border border-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reminders"
        subtitle="Manage and track application deadlines, follow-ups, and custom tasks"
        actions={
          <Button onClick={() => setIsCreateOpen(true)} className="inline-flex items-center gap-1.5 h-10 shadow-sm">
            <Plus className="w-4 h-4" /> Add Reminder
          </Button>
        }
      />

      {error && (
        <Card className="border-rose-200 bg-rose-50/20 text-center py-10 px-4 max-w-lg mx-auto mt-10">
          <h2 className="text-lg font-bold text-rose-800 mb-2">Error Loading Reminders</h2>
          <p className="text-sm text-rose-600 mb-6">{error}</p>
          <Button onClick={fetchData} className="h-10">Retry Loading</Button>
        </Card>
      )}

      {!error && reminders.length === 0 ? (
        <EmptyState
          title="No reminders scheduled"
          description="Schedule deadlines, interview tasks, or follow-ups to stay on track."
          actionButton={
            <Button onClick={() => setIsCreateOpen(true)} className="h-10">
              Set Your First Reminder
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reminders.map((rem) => {
            const associatedApp = applications.find(app => app.id === rem.application_id);
            return (
              <Card
                key={rem.id}
                className={`flex flex-col justify-between border border-slate-200 p-6 bg-white rounded-lg transition-all duration-200 ${
                  rem.is_completed 
                    ? 'opacity-60 border-slate-150 bg-slate-50/30 shadow-none' 
                    : 'hover:-translate-y-0.5 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <button
                      onClick={() => handleToggleComplete(rem)}
                      className="inline-flex items-center text-slate-500 hover:text-indigo-650 transition-colors cursor-pointer focus:outline-none shrink-0"
                      title={rem.is_completed ? 'Mark as Incomplete' : 'Mark as Complete'}
                      aria-label={rem.is_completed ? 'Mark as Incomplete' : 'Mark as Complete'}
                    >
                      {rem.is_completed ? (
                        <CheckSquare className="w-5 h-5 text-indigo-600 mr-2 shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400 mr-2 shrink-0" />
                      )}
                      <span className={`text-xs font-bold uppercase tracking-wider ${rem.is_completed ? 'line-through text-slate-400' : 'text-slate-500'}`}>
                        {rem.is_completed ? 'Completed' : 'Pending'}
                      </span>
                    </button>
                    <Badge color={rem.application_id ? 'indigo' : 'slate'} className="max-w-[150px] truncate block text-right">
                      {rem.application_id && associatedApp
                        ? `${associatedApp.company_name} — ${associatedApp.job_role}`
                        : 'General'}
                    </Badge>
                  </div>

                  <h3 className={`text-base font-bold text-slate-900 tracking-tight leading-snug ${rem.is_completed ? 'line-through text-slate-400' : ''}`}>
                    {rem.title}
                  </h3>

                  {rem.description && (
                    <p className={`text-sm text-slate-650 mt-2 whitespace-pre-line leading-relaxed font-medium ${rem.is_completed ? 'line-through text-slate-400' : ''}`}>
                      {rem.description}
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center text-xs text-slate-500 space-x-1.5 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDateTime(rem.reminder_date)}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setSelectedReminder(rem);
                        setIsEditOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-605 hover:bg-slate-100 rounded-md focus:outline-none transition-colors cursor-pointer"
                      title="Edit Reminder"
                      aria-label="Edit Reminder"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedReminder(rem);
                        setIsDeleteOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md focus:outline-none transition-colors cursor-pointer"
                      title="Delete Reminder"
                      aria-label="Delete Reminder"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Reminder Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto animate-modal-scale">
            <h2 className="text-xl font-bold text-slate-900 mb-4 tracking-tight border-b border-slate-100 pb-3">Add Reminder</h2>
            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-sm font-medium">
                {formError}
              </div>
            )}
            <ReminderForm
              applications={applications}
              onSubmit={handleCreateSubmit}
              onCancel={() => setIsCreateOpen(false)}
              submitting={submitting}
              submitLabel="Save Reminder"
            />
          </div>
        </div>
      )}

      {/* Edit Reminder Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto animate-modal-scale">
            <h2 className="text-xl font-bold text-slate-900 mb-4 tracking-tight border-b border-slate-100 pb-3">Edit Reminder</h2>
            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-sm font-medium">
                {formError}
              </div>
            )}
            <ReminderForm
              initialValues={selectedReminder}
              applications={applications}
              onSubmit={handleEditSubmit}
              onCancel={() => {
                setIsEditOpen(false);
                setSelectedReminder(null);
              }}
              submitting={submitting}
              submitLabel="Save Changes"
            />
          </div>
        </div>
      )}

      {/* Delete Reminder Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-md w-full p-6 text-center animate-modal-scale">
            <h2 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Delete Reminder</h2>
            <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">
              Are you sure you want to permanently delete this reminder? This action cannot be undone. Associated applications and interviews will remain unaffected.
            </p>
            <div className="flex justify-center space-x-3">
              <Button variant="secondary" onClick={() => {
                setIsDeleteOpen(false);
                setSelectedReminder(null);
              }} disabled={deleting} className="h-10">
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete} disabled={deleting} className="h-10">
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reminders;
