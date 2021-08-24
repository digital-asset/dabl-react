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

export const damlHubEnvironment = (): {
  hostname: string;
  baseURL: string | undefined;
  wsURL: string | undefined;
  ledgerId: string | undefined;
} => {
  const hostname = window.location.hostname.split('.').slice(1).join('.');
  const ledgerId =
    detectAppDomainType() === DomainType.LEGACY_DOMAIN
      ? window.location.hostname.split('.')[0]
      : undefined;
  const baseURL = hubBaseURL();
  const wsURL = hubWsURL();

  return { hostname, baseURL, wsURL, ledgerId };
};

const hubBaseURL = (): string | undefined => {
  if (detectAppDomainType() === DomainType.APP_DOMAIN) {
    return `${window.location.origin}/`;
  } else if (detectAppDomainType() === DomainType.LEGACY_DOMAIN) {
    const ledgerId = window.location.hostname.split('.')[0];
    const hubHostname = window.location.hostname.split('.').slice(1).join('.');
    return `https://api.${hubHostname}/data/${ledgerId}/`;
  } else {
    return undefined;
  }
};

const hubWsURL = (): string | undefined => {
  if (detectAppDomainType() === DomainType.APP_DOMAIN) {
    return `wss://${window.location.hostname}/`;
  } else if (detectAppDomainType() === DomainType.LEGACY_DOMAIN) {
    const ledgerId = window.location.hostname.split('.')[0];
    const hubHostname = window.location.hostname.split('.').slice(1).join('.');
    return `wss://api.${hubHostname}/data/${ledgerId}/`;
  } else {
    return undefined;
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

export const usePolling = (fn: () => Promise<void>, interval: number) => {
  React.useEffect(() => {
    if (!isRunningOnHub()) {
      console.warn('WARNING: Disabling polling, app is not running on Daml Hub.');
      return () => {};
    } else if (interval > 0) {
      let intervalID = setInterval(fn, interval);
      return () => clearInterval(intervalID);
    } else {
      fn(); // Run once
      return () => {};
    }
  }, [fn, interval]);
};

// function raiseParamsToHash(loginRoute: string) {
//   const url = new URL(window.location.href);

//   // When DABL login redirects back to app, hoist the query into the hash route.
//   // This allows react-router's HashRouter to see and parse the supplied params

//   // i.e., we want to turn
//   // ledgerid.projectdabl.com/?party=party&token=token/#/
//   // into
//   // ledgerid.projectdabl.com/#/?party=party&token=token
//   if (url.search !== '' && url.hash === `#/${loginRoute}`) {
//     window.location.href = `${url.origin}${url.pathname}#/${loginRoute}${url.search}`;
//   }
// }
