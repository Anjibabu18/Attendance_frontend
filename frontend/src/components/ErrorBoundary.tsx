import React from 'react';
import { Box, Typography, Button } from '@mui/material';

interface Props {
  children: React.ReactNode;
}
interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, bgcolor: 'background.default', minHeight: '100vh', color: 'text.primary' }}>
          <Typography variant="h5" sx={{ color: 'error.main', mb: 2 }}>UI Crashed</Typography>
          <Typography sx={{ mb: 2, fontFamily: 'monospace', fontSize: 12, bgcolor: 'rgba(255,0,0,0.1)', p: 2, borderRadius: 2 }}>
            {this.state.error?.toString()}
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>Reload Page</Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
