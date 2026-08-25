"use client";

import { forwardRef, TextareaHTMLAttributes, InputHTMLAttributes } from "react";

interface FieldWrapperProps {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

export function FieldWrapper({ label, error, hint, children }: FieldWrapperProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-mist">{label}</span>
      {children}
      <div className="mt-1.5 min-h-[1.1rem] text-xs">
        {error ? (
          <span className="text-red-400">{error}</span>
        ) : hint ? (
          <span className="text-mist/60">{hint}</span>
        ) : null}
      </div>
    </label>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { error?: boolean };

export const TextInput = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full rounded-xl border bg-surface/80 px-4 py-3.5 text-[15px] text-beam placeholder:text-mist/50 transition-colors focus:bg-surface ${
        error ? "border-red-400/60" : "border-line focus:border-brand/60"
      } ${className}`}
      {...props}
    />
  )
);
TextInput.displayName = "TextInput";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean };

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className = "", ...props }, ref) => (
    <textarea
      ref={ref}
      className={`w-full resize-none rounded-xl border bg-surface/80 px-4 py-3.5 text-[15px] leading-relaxed text-beam placeholder:text-mist/50 transition-colors focus:bg-surface ${
        error ? "border-red-400/60" : "border-line focus:border-brand/60"
      } ${className}`}
      {...props}
    />
  )
);
TextArea.displayName = "TextArea";
