import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { isModuleLoadError, recoverModuleLoad } from "@/lib/moduleRecovery";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);
    recoverModuleLoad(error);
  }

  componentDidMount() {
    window.onerror = (message, source, lineno, colno, error) => {
      console.error("[Global Error]", { message, source, lineno, colno, error });
      recoverModuleLoad(error ?? message);
    };

    window.onunhandledrejection = (event: PromiseRejectionEvent) => {
      console.error("[Unhandled Promise Rejection]", event.reason);
      recoverModuleLoad(event.reason);
    };
  }

  handleReset = () => {
    // React.lazy caches a rejected import; resetting boundary state alone
    // would immediately throw the same error again.
    if (isModuleLoadError(this.state.error)) {
      window.location.reload();
      return;
    }
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-5">
          <Card className="max-w-md w-full shadow-lg" data-testid="error-boundary-fallback">
            <CardContent className="p-8 text-center space-y-5">
              <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-7 h-7 text-destructive" />
              </div>
              <div className="space-y-2">
                <h2 className="font-serif text-xl font-bold text-foreground">
                  Something went wrong
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  An unexpected error occurred. Please try refreshing the page.
                </p>
              </div>
              {this.state.error && (
                <p className="text-xs text-muted-foreground bg-muted rounded-md p-3 text-left break-words font-mono" data-testid="text-error-message">
                  {this.state.error.message}
                </p>
              )}
              <div className="flex flex-col gap-2">
                <Button onClick={this.handleReset} data-testid="button-try-again">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  data-testid="button-reload-page"
                >
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
