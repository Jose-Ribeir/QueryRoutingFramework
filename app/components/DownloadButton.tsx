import React from 'react';

interface DownloadButtonProps {
  href: string;
  label: string;
  icon?: React.ReactNode;
  external?: boolean;
}

export default function DownloadButton({ href, label, icon, external }: DownloadButtonProps) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : { download: true })}
      className="inline-flex items-center px-6 py-3 bg-ppt-accent1 text-white font-medium rounded-lg hover:bg-ppt-accent4 transition-colors shadow-md hover:shadow-lg"
    >
      {icon && <span className="mr-2">{icon}</span>}
      {label}
      {external ? (
        <svg
          className="ml-2 w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      ) : (
        <svg
          className="ml-2 w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
      )}
    </a>
  );
}

