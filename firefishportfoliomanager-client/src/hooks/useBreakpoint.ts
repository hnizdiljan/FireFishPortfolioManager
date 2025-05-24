import { useState, useEffect } from 'react';

export interface Breakpoints {
  xs: boolean; // < 576px
  sm: boolean; // >= 576px
  md: boolean; // >= 768px
  lg: boolean; // >= 992px
  xl: boolean; // >= 1200px
  xxl: boolean; // >= 1600px
}

export interface BreakpointHook extends Breakpoints {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  current: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
}

const getBreakpoints = (width: number): Breakpoints => ({
  xs: width < 576,
  sm: width >= 576 && width < 768,
  md: width >= 768 && width < 992,
  lg: width >= 992 && width < 1200,
  xl: width >= 1200 && width < 1600,
  xxl: width >= 1600,
});

const getCurrentBreakpoint = (breakpoints: Breakpoints): 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' => {
  if (breakpoints.xxl) return 'xxl';
  if (breakpoints.xl) return 'xl';
  if (breakpoints.lg) return 'lg';
  if (breakpoints.md) return 'md';
  if (breakpoints.sm) return 'sm';
  return 'xs';
};

export const useBreakpoint = (): BreakpointHook => {
  const [width, setWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const breakpoints = getBreakpoints(width);
  const current = getCurrentBreakpoint(breakpoints);

  return {
    ...breakpoints,
    isMobile: breakpoints.xs || breakpoints.sm,
    isTablet: breakpoints.md,
    isDesktop: breakpoints.lg || breakpoints.xl || breakpoints.xxl,
    current,
  };
}; 