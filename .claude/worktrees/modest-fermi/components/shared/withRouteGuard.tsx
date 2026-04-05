import { ComponentType } from "react";
import RouteGuard from "./RouteGuard";

interface WithRouteGuardOptions {
  requiredStatus?: 'ACTIVE' | 'WAITING' | 'INACTIVE' | 'ANY';
  fallback?: React.ReactNode;
  showLoader?: boolean;
}

export function withRouteGuard<P extends object>(
  Component: ComponentType<P>,
  options: WithRouteGuardOptions = {}
) {
  const { requiredStatus = 'ACTIVE', fallback, showLoader = true } = options;

  const WrappedComponent = (props: P) => {
    return (
      <RouteGuard 
        requiredStatus={requiredStatus} 
        fallback={fallback}
        showLoader={showLoader}
      >
        <Component {...props} />
      </RouteGuard>
    );
  };

  // Set display name for debugging
  WrappedComponent.displayName = `withRouteGuard(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Predefined route guards for common use cases
export const withActiveUserGuard = <P extends object>(Component: ComponentType<P>) =>
  withRouteGuard(Component, { requiredStatus: 'ACTIVE' });

export const withAnyUserGuard = <P extends object>(Component: ComponentType<P>) =>
  withRouteGuard(Component, { requiredStatus: 'ANY' });

export const withLimitedUserGuard = <P extends object>(Component: ComponentType<P>) =>
  withRouteGuard(Component, { requiredStatus: 'WAITING' });

export const withCompanyUserGuard = <P extends object>(Component: ComponentType<P>) =>
  withRouteGuard(Component, { 
    requiredStatus: 'ACTIVE'
  });

// New guard for users with limited access (WAITING, INACTIVE)
export const withLimitedAccessGuard = <P extends object>(Component: ComponentType<P>) =>
  withRouteGuard(Component, { 
    requiredStatus: 'WAITING' 
  });
