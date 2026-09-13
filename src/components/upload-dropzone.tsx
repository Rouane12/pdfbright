"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file: File) {
  const looksLikePdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (!looksLikePdf) {
    return "Please choose a PDF file.";
  }

  if (file.size === 0) {
    return "This PDF appears to be empty. Please choose another file.";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "This PDF is larger than the current 25 MB preview limit.";
  }

  return null;
}

export function UploadDropzone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFile(file: File | undefined) {
    if (!file) return;

    const validationError = validateFile(file);

    if (validationError) {
      setSelectedFile(null);
      setError(validationError);
      return;
    }

    setSelectedFile(file);
    setError(null);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    handleFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  }

  function removeFile() {
    setSelectedFile(null);
    setError(null);
  }

  return (
    <div className="w-full" id="upload">
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleInputChange}
        aria-label="Choose a PDF file"
      />

      <div
        className={`upload-zone ${selectedFile ? "upload-zone--selected" : ""} ${isDragging ? "upload-zone--active" : ""}`}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsDragging(false);
          }
        }}
        onDrop={handleDrop}
      >
        {selectedFile ? (
          <div className="selected-file-shell">
            <div className="document-icon document-icon--ready shrink-0" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M7 3.75h6.4L18 8.35v11.9H7V3.75Z" stroke="currentColor" strokeWidth="1.6" />
                <path d="M13 3.9v4.6h4.6" stroke="currentColor" strokeWidth="1.6" />
                <path d="m9.6 14 1.55 1.55 3.45-3.55" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="text-sm font-semibold text-slate-950">PDF selected</p>
              <p
                className="mt-1 max-w-full truncate text-base font-medium text-slate-800"
                title={selectedFile.name}
              >
                {selectedFile.name}
              </p>
              <p className="mt-1 text-sm text-slate-500">{formatFileSize(selectedFile.size)}</p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <button
                type="button"
                className="button button--primary"
                onClick={() => inputRef.current?.click()}
              >
                Replace PDF
              </button>
              <button type="button" className="button button--secondary" onClick={removeFile}>
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="document-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M7 3.75h6.4L18 8.35v11.9H7V3.75Z" stroke="currentColor" strokeWidth="1.6" />
                <path d="M13 3.9v4.6h4.6" stroke="currentColor" strokeWidth="1.6" />
                <path d="M9.6 13.2h5M9.6 16h3.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
            <p className="mt-5 text-xl font-semibold tracking-tight text-slate-950">
              Drop your PDF here
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">or choose a file from your device</p>
            <button
              type="button"
              className="button button--primary mt-6"
              onClick={() => inputRef.current?.click()}
            >
              Choose a PDF
            </button>
            <p className="mt-4 text-xs leading-5 text-slate-500">PDF only · Up to 25 MB</p>
          </div>
        )}
      </div>

      <div className={error ? "mt-4 min-h-6 text-center" : "sr-only"} aria-live="polite" aria-atomic="true">
        {error ? (
          <p className="text-sm font-medium text-rose-700">{error}</p>
        ) : selectedFile ? (
          <p>PDF selected successfully. Your original file has not been changed.</p>
        ) : null}
      </div>

      <p className="mt-4 text-center text-xs leading-5 text-slate-500">
        No signup required · Local processing where possible
      </p>
    </div>
  );
}
