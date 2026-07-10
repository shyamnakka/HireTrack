import React, { useState, useRef } from 'react';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Select } from './Select';
import { Button } from './Button';

// Helper to convert backend UTC/offset timestamp to local browser datetime-local format
const toLocalDatetimeLocal = (isoString) => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const pad = (num) => String(num).padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  } catch {
    return '';
  }
};

// Helper to convert browser datetime-local string to ISO 8601 UTC timestamp
const toISOTimestamp = (localDatetimeString) => {
  if (!localDatetimeString) return null;
  try {
    const date = new Date(localDatetimeString);
    return date.toISOString();
  } catch {
    return null;
  }
};

export const ReminderForm = ({
  initialValues = {},
  applications = [],
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel = 'Submit'
}) => {
  const isSubmittingRef = useRef(false);

  // Form states
  const [title, setTitle] = useState(initialValues.title || '');
  const [description, setDescription] = useState(initialValues.description || '');
  const [reminderDate, setReminderDate] = useState(toLocalDatetimeLocal(initialValues.reminder_date));
  const [applicationId, setApplicationId] = useState(
    initialValues.application_id !== null && initialValues.application_id !== undefined
      ? String(initialValues.application_id)
      : ''
  );

  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!title.trim()) {
      errs.title = 'Title is required';
    } else if (title.length < 2 || title.length > 100) {
      errs.title = 'Title must be between 2 and 100 characters';
    }

    if (!reminderDate) {
      errs.reminder_date = 'Reminder date and time are required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    if (!validate()) return;

    isSubmittingRef.current = true;

    // Build the payload
    // If applicationId is empty string, we set it to null.
    // Otherwise, we convert it to a Number so the backend receives an integer.
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      reminder_date: toISOTimestamp(reminderDate),
      application_id: applicationId ? Number(applicationId) : null
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      console.error('Reminder form submission error caught in lock:', err);
    } finally {
      isSubmittingRef.current = false;
    }
  };

  // Build options for application selector
  const appOptions = [
    { value: '', label: 'General (No Association)' },
    ...applications.map(app => ({
      value: String(app.id),
      label: `${app.company_name} — ${app.job_role}`
    }))
  ];

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4" noValidate>
      <Input
        label="Title *"
        id="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
        disabled={submitting}
        placeholder="e.g. Online Assessment Deadline"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Reminder Date & Time *"
          id="reminder_date"
          type="datetime-local"
          value={reminderDate}
          onChange={(e) => setReminderDate(e.target.value)}
          error={errors.reminder_date}
          disabled={submitting}
        />
        <Select
          label="Associate with Application"
          id="application_id"
          options={appOptions}
          value={applicationId}
          onChange={(e) => setApplicationId(e.target.value)}
          disabled={submitting}
        />
      </div>

      <Textarea
        label="Description"
        id="description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={submitting}
        rows={4}
        placeholder="Add details, instructions or checklists..."
      />

      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default ReminderForm;
