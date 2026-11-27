import React from 'react';
import { Link } from 'react-router-dom';

interface SaasErrorPageProps {
  status?: 403 | 404 | 500;
  label?: string;
  detail?: string;
  onRetry?: () => void;
}

const DEFAULT_LABELS: Record<number, { label: string; detail: string }> = {
  403: {
    label: 'Access Restricted',
    detail: 'Your current role does not have permission to view this resource.',
  },
  404: {
    label: 'Page Not Found',
    detail: 'The requested page does not exist or has moved to a new location.',
  },
  500: {
    label: 'Internal Error',
    detail: 'Something unexpected occurred while rendering this surface. Please try again.',
  },
};

export const SaasErrorPage: React.FC<SaasErrorPageProps> = ({
  status = 404,
  label,
  detail,
  onRetry,
}) => {
  const defaults = DEFAULT_LABELS[status] || DEFAULT_LABELS[500];

  return (
    <div
      className="saas-error min-h-screen flex flex-col items-center justify-center px-6 py-16 text-center"
      style={{ backgroundColor: '#222222', color: '#f1f5f9' }}
    >
      <div className="max-w-xl w-full space-y-6">
        <div className="flex items-center justify-center gap-4 text-3xl sm:text-4xl font-semibold tracking-tight">
          <span className="font-mono text-white">{status}</span>
          <span className="text-slate-500" aria-hidden="true">
            |
          </span>
          <span className="text-slate-100">{label || defaults.label}</span>
        </div>

        <p className="text-lg text-slate-300 leading-relaxed">{detail || defaults.detail}</p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-6 py-3 min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-base font-semibold"
            >
              Try Again
            </button>
          )}
          <Link
            to="/dashboard"
            className="px-6 py-3 min-h-[44px] inline-flex items-center rounded-xl bg-white text-slate-900 hover:bg-slate-200 text-base font-semibold"
          >
            Open Command Center
          </Link>
          <Link
            to="/"
            className="px-6 py-3 min-h-[44px] inline-flex items-center rounded-xl border border-slate-500 text-slate-100 hover:bg-white/10 text-base font-medium"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
};

interface ErrorBoundaryState {
  hasError: boolean;
}

export class SaasErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <SaasErrorPage
          status={500}
          label="Internal Error"
          onRetry={() => {
            this.setState({ hasError: false });
            window.location.reload();
          }}
        />
      );
    }
    return this.props.children;
  }
}

export default SaasErrorPage;
