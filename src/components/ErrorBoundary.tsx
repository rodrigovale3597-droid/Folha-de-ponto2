import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<any, any> {
  render() {
    return (this as any).props.children;
  }
}
