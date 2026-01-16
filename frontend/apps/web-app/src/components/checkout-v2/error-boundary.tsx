"use client";

import { Component, ReactNode } from 'react';
import { Card } from '@workspace/ui';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class CheckoutErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        console.error('[CheckoutErrorBoundary] Caught error:', error);
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: any) {
        // Log to error tracking service (e.g., Sentry)
        console.error('[CheckoutErrorBoundary] Error details:', {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <Card className="p-8 text-center border-red-500">
                    <h2 className="text-2xl font-bold mb-4 text-red-600">
                        אירעה שגיאה בטעינת הצ'קאאוט
                    </h2>
                    <p className="text-gray-600 mb-4">
                        מצטערים, משהו השתבש. אנא נסה שוב.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                    >
                        רענן דף
                    </button>
                    {this.state.error && (
                        <details className="mt-4 text-xs text-gray-500 text-left">
                            <summary className="cursor-pointer">פרטים טכניים</summary>
                            <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40">
                                {this.state.error.stack}
                            </pre>
                        </details>
                    )}
                </Card>
            );
        }

        return this.props.children;
    }
}
