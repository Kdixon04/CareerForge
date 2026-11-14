'use client';

export function PrintResumeButton() {
  return (
    <button
      className="cf-button"
      type="button"
      onClick={() => window.print()}
    >
      Print or save as PDF
    </button>
  );
}