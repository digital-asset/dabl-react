import React from 'react';

export enum DomainType {
  APP_DOMAIN,
  LEGACY_DOMAIN,
  NON_HUB_DOMAIN,
}

export const detectAppDomainType = (): DomainType => {
  const { hostname: hn } = window.location;

  if (hn.includes('projectdabl') && hn.includes('.com')) {
    console.log('LEGACY DOMAIN DETECTED');
    return DomainType.LEGACY_DOMAIN;
  } else if (hn.includes('daml') && hn.includes('.app')) {
    console.log('APP DOMAIN DETECTED');
    return DomainType.APP_DOMAIN;
  } else {
    console.warn(
      'WARNING: App UI is not running on Daml Hub. This library may behave unexpectedly.'
    );
    return DomainType.NON_HUB_DOMAIN;
  }
};

export const isRunningOnHub = (): boolean => {
  return detectAppDomainType() !== DomainType.NON_HUB_DOMAIN;
};

export const getCookieValue = (name: string): string | undefined =>
  document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop();

export const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const asyncReader = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function (event) {
      if (event.target && typeof event.target.result === 'string') {
        resolve(event.target.result);
      }
    };

    reader.onerror = function (event) {
      reject(event);
    };

    reader.readAsText(file);
  });
};

export const usePolling = (fn: () => Promise<void>, interval: number, deps: any[]) => {
  React.useEffect(() => {
    if (!isRunningOnHub()) {
      console.warn('WARNING: Disabling polling, app is not running on Daml Hub.');
      return () => {};
    } else if (interval !== 0) {
      let intervalID = setInterval(fn, interval);
      return () => clearInterval(intervalID);
    } else {
      fn(); // Run once
      return () => {};
    }
  }, [interval, ...deps]);
};
