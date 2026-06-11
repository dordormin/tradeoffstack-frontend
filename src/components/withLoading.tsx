import React from 'react';

export function withLoading<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  interface WithLoadingProps {
    loading?: boolean;
  }

  const WithLoadingComponent: React.FC<P & WithLoadingProps> = (props) => {
    const { loading, ...remainingProps } = props;

    if (loading) {
      return (
        <div className="flex items-center justify-center p-8 w-full min-h-[150px]">
          <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    return <WrappedComponent {...(remainingProps as P)} />;
  };

  WithLoadingComponent.displayName = `withLoading(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WithLoadingComponent;
}
