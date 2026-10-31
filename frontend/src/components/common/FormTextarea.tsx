import React, { forwardRef } from 'react';

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, error, helperText, required, className = '', id, rows = 3, ...rest }, ref) => {
    const inputId = id || `textarea-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="w-full space-y-1">
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>

        <textarea
          id={inputId}
          ref={ref}
          rows={rows}
          className={`w-full px-3 py-2 text-xs rounded-lg border transition-colors focus:outline-none resize-y ${
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20'
              : 'border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white'
          } ${className}`}
          {...rest}
        />

        {error ? (
          <p className="text-[11px] text-rose-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-slate-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

FormTextarea.displayName = 'FormTextarea';
