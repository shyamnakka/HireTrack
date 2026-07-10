import React, { useState, useRef } from 'react';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Select } from './Select';
import { Button } from './Button';

export const ApplicationForm = ({
  initialValues = {},
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel = 'Submit'
}) => {
  const isSubmittingRef = useRef(false);
  const [companyName, setCompanyName] = useState(initialValues.company_name || '');
  const [jobRole, setJobRole] = useState(initialValues.job_role || '');
  const [jobLocation, setJobLocation] = useState(initialValues.job_location || '');
  const [jobUrl, setJobUrl] = useState(initialValues.job_url || '');
  const [appliedDate, setAppliedDate] = useState(initialValues.applied_date || '');
  const [status, setStatus] = useState(initialValues.status || 'Applied');
  const [packageAmount, setPackageAmount] = useState(
    initialValues.package_amount !== undefined && initialValues.package_amount !== null
      ? String(initialValues.package_amount)
      : ''
  );
  const [packageCurrency, setPackageCurrency] = useState(initialValues.package_currency || 'INR');
  const [notes, setNotes] = useState(initialValues.notes || '');

  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;

    if (!companyName.trim()) {
      errs.company_name = 'Company name is required';
    } else if (companyName.length < 2 || companyName.length > 100) {
      errs.company_name = 'Company name must be between 2 and 100 characters';
    }

    if (!jobRole.trim()) {
      errs.job_role = 'Job role is required';
    } else if (jobRole.length < 2 || jobRole.length > 100) {
      errs.job_role = 'Job role must be between 2 and 100 characters';
    }

    if (jobUrl.trim() && !urlRegex.test(jobUrl.trim())) {
      errs.job_url = 'Please enter a valid website URL';
    }

    if (packageAmount.trim()) {
      const num = Number(packageAmount);
      if (isNaN(num)) {
        errs.package_amount = 'Package amount must be a number';
      } else if (num < 0) {
        errs.package_amount = 'Package amount cannot be negative';
      }
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
    // Empty strings are converted to null to respect backend database schemas
    const payload = {
      company_name: companyName.trim(),
      job_role: jobRole.trim(),
      job_location: jobLocation.trim() || null,
      job_url: jobUrl.trim() || null,
      applied_date: appliedDate || null,
      status: status,
      package_amount: packageAmount.trim() ? Number(packageAmount) : null,
      package_currency: packageCurrency,
      notes: notes.trim() || null
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      console.error('Form submission error caught in lock:', err);
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const statusOptions = [
    { value: 'Applied', label: 'Applied' },
    { value: 'Online Assessment', label: 'Online Assessment' },
    { value: 'Technical Interview', label: 'Technical Interview' },
    { value: 'HR Interview', label: 'HR Interview' },
    { value: 'Selected', label: 'Selected' },
    { value: 'Rejected', label: 'Rejected' },
    { value: 'Withdrawn', label: 'Withdrawn' }
  ];

  const currencyOptions = [
    { value: 'INR', label: 'INR' },
    { value: 'USD', label: 'USD' },
    { value: 'EUR', label: 'EUR' },
    { value: 'GBP', label: 'GBP' }
  ];

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Company Name *"
          id="company_name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          error={errors.company_name}
          disabled={submitting}
        />
        <Input
          label="Job Role *"
          id="job_role"
          value={jobRole}
          onChange={(e) => setJobRole(e.target.value)}
          error={errors.job_role}
          disabled={submitting}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Job Location"
          id="job_location"
          value={jobLocation}
          onChange={(e) => setJobLocation(e.target.value)}
          disabled={submitting}
        />
        <Input
          label="Job URL"
          id="job_url"
          value={jobUrl}
          onChange={(e) => setJobUrl(e.target.value)}
          error={errors.job_url}
          disabled={submitting}
          placeholder="https://company.com/careers"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Applied Date"
          id="applied_date"
          type="date"
          value={appliedDate}
          onChange={(e) => setAppliedDate(e.target.value)}
          disabled={submitting}
        />
        <Select
          label="Status"
          id="status"
          options={statusOptions}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          disabled={submitting}
        />
        <div className="flex gap-2">
          <Input
            label="Package Amount"
            id="package_amount"
            value={packageAmount}
            onChange={(e) => setPackageAmount(e.target.value)}
            error={errors.package_amount}
            disabled={submitting}
            placeholder="e.g. 1200000"
            className="flex-1"
          />
          <Select
            label="Currency"
            id="package_currency"
            options={currencyOptions}
            value={packageCurrency}
            onChange={(e) => setPackageCurrency(e.target.value)}
            disabled={submitting}
            className="w-24 shrink-0"
          />
        </div>
      </div>

      <Textarea
        label="Notes"
        id="notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        disabled={submitting}
        rows={4}
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

export default ApplicationForm;
