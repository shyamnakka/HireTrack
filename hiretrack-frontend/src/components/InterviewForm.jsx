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

export const InterviewForm = ({
  initialValues = {},
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel = 'Submit'
}) => {
  const isSubmittingRef = useRef(false);

  // Form states
  const [roundName, setRoundName] = useState(initialValues.round_name || '');
  const [interviewDate, setInterviewDate] = useState(toLocalDatetimeLocal(initialValues.interview_date));
  const [interviewMode, setInterviewMode] = useState(initialValues.interview_mode || 'Online');
  const [meetingLink, setMeetingLink] = useState(initialValues.meeting_link || '');
  const [result, setResult] = useState(initialValues.result || 'Pending');
  const [preparationNotes, setPreparationNotes] = useState(initialValues.preparation_notes || '');
  const [postInterviewFeedback, setPostInterviewFeedback] = useState(initialValues.post_interview_feedback || '');

  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;

    if (!roundName.trim()) {
      errs.round_name = 'Round name is required';
    } else if (roundName.length < 2 || roundName.length > 100) {
      errs.round_name = 'Round name must be between 2 and 100 characters';
    }

    if (!interviewDate) {
      errs.interview_date = 'Interview date and time are required';
    }

    if (meetingLink.trim() && !urlRegex.test(meetingLink.trim())) {
      errs.meeting_link = 'Please enter a valid website URL';
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
    // Empty strings are normalized to null
    const payload = {
      round_name: roundName.trim(),
      interview_date: toISOTimestamp(interviewDate),
      interview_mode: interviewMode,
      meeting_link: meetingLink.trim() || null,
      result: result,
      preparation_notes: preparationNotes.trim() || null,
      post_interview_feedback: postInterviewFeedback.trim() || null
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      console.error('Interview form submission error caught in lock:', err);
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const modeOptions = [
    { value: 'Online', label: 'Online' },
    { value: 'In-Person', label: 'In-Person' },
    { value: 'Telephonic', label: 'Telephonic' }
  ];

  const resultOptions = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Cleared', label: 'Cleared' },
    { value: 'Failed', label: 'Failed' },
    { value: 'Cancelled', label: 'Cancelled' }
  ];

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Round Name *"
          id="round_name"
          value={roundName}
          onChange={(e) => setRoundName(e.target.value)}
          error={errors.round_name}
          disabled={submitting}
          placeholder="e.g. Technical Round 1"
        />
        <Input
          label="Interview Date & Time *"
          id="interview_date"
          type="datetime-local"
          value={interviewDate}
          onChange={(e) => setInterviewDate(e.target.value)}
          error={errors.interview_date}
          disabled={submitting}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select
          label="Interview Mode"
          id="interview_mode"
          options={modeOptions}
          value={interviewMode}
          onChange={(e) => setInterviewMode(e.target.value)}
          disabled={submitting}
        />
        <Select
          label="Result"
          id="result"
          options={resultOptions}
          value={result}
          onChange={(e) => setResult(e.target.value)}
          disabled={submitting}
        />
        <Input
          label="Meeting Link"
          id="meeting_link"
          value={meetingLink}
          onChange={(e) => setMeetingLink(e.target.value)}
          error={errors.meeting_link}
          disabled={submitting}
          placeholder="https://meet.google.com/abc-defg-hij"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Textarea
          label="Preparation Notes"
          id="preparation_notes"
          value={preparationNotes}
          onChange={(e) => setPreparationNotes(e.target.value)}
          disabled={submitting}
          rows={3}
          placeholder="Topics to study, questions to ask..."
        />
        <Textarea
          label="Post-Interview Feedback"
          id="post_interview_feedback"
          value={postInterviewFeedback}
          onChange={(e) => setPostInterviewFeedback(e.target.value)}
          disabled={submitting}
          rows={3}
          placeholder="How did it go? Things to improve..."
        />
      </div>

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

export default InterviewForm;
