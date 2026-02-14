"use client";

import { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback: ReactNode;
  onError?: (error: Error) => void;
};

type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
    if (typeof window !== "undefined") {
      console.error("ErrorBoundary caught:", error);
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
