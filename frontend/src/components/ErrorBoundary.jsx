import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="my-6 p-6 bg-white border border-crimson/30 rounded-3xl shadow-sm text-center animate-fade">
          <div className="w-12 h-12 bg-crimson-soft rounded-2xl flex items-center justify-center mx-auto mb-3 text-crimson">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-sm font-bold text-walnut">Something went wrong rendering scan results</h3>
          <p className="text-xs text-slate mt-1 max-w-md mx-auto">
            {this.state.error?.message || 'An unexpected error occurred while parsing the packaging details.'}
          </p>
          <button
            onClick={this.handleReset}
            className="mt-4 px-4 py-2 bg-terracotta hover:bg-terracotta-hover text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw size={13} />
            <span>Try Again</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
