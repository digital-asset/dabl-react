import React from 'react';

import log from './log';

export enum DomainType {
  APP_DOMAIN,
  LOCALHOST,
  NON_HUB_DOMAIN,
}

export const detectAppDomainType = (): DomainType => {
  const { hostname: hn } = window.location;

  if (hn.includes('daml') && hn.includes('.app')) {
    log('domain').debug('App running on daml.app domain');
    return DomainType.APP_DOMAIN;
  } else if (hn.includes('localhost') || /^127(\.\d{1,3}){3}$/.exec(hn)) {
    log('domain').debug('App running on localhost');
    return DomainType.LOCALHOST;
  } else {
    log('domain').debug('App UI does not seem to be running on Daml Hub');
    return DomainType.NON_HUB_DOMAIN;
  }
};

/**
 * Fetch information about the Daml Hub environment that
 * the library is running against. Includes hostname,
 * baseURL, wsURL, and a ledgerId (if discoverable).
 *
 * Set 'nonHubDomain' to true if running your app on a hub ledger with a
 * ledger not provided by Daml Hub.
 *
 * Returns undefined if not running on Hub
 */
export const damlHubEnvironment = (
  nonHubDomain: boolean = false
):
  | {
      hostname: string;
      baseURL: string | undefined;
      wsURL: string | undefined;
      ledgerId: string | undefined;
    }
  | undefined => {
  const hostname = window.location.hostname.split('.').slice(1).join('.');
  const ledgerId = undefined;
  const baseURL = hubBaseURL();
  const wsURL = hubWsURL();

  return isRunningOnHub(nonHubDomain) ? { hostname, baseURL, wsURL, ledgerId } : undefined;
};

const hubBaseURL = (): string | undefined => {
  const domainType = detectAppDomainType();
  return domainType === DomainType.APP_DOMAIN || domainType === DomainType.NON_HUB_DOMAIN
    ? `${window.location.origin}/`
    : undefined;
};

const hubWsURL = (): string | undefined => {
  const domainType = detectAppDomainType();
  return domainType === DomainType.APP_DOMAIN || domainType === DomainType.NON_HUB_DOMAIN
    ? `wss://${window.location.hostname}/`
    : undefined;
};

/**
 * Determine if the app is running on Daml Hub via domain detection. Set 'nonHubDomain' to
 * true if running your app on a hub ledger with a ledger not provided by Daml Hub
 * @returns boolean
 */
export const isRunningOnHub = (nonHubDomain: boolean = false): boolean => {
  const domainType = detectAppDomainType();
  return nonHubDomain ? domainType !== DomainType.LOCALHOST : domainType === DomainType.APP_DOMAIN;
};

export const deleteCookie = (name: string, domain?: string): void => {
  let base = `${name}=; expires=Thu, 01-Jan-1970 00:00:01 GMT; path=/; secure;`;
  if (domain) {
    base = base + `domain=${domain};`;
  }
  document.cookie = base;
};

export const getCookieValue = (name: string): string | undefined =>
  document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop();

export const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const asyncFileReader = (file: File): Promise<string> => {
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

export const usePolling = (
  fn: () => Promise<void>,
  interval: number,
  nonHubDomain: boolean = false
) => {
  React.useEffect(() => {
    if (!isRunningOnHub(nonHubDomain)) {
      log('polling').debug('Disabling polling, app is not running on Daml Hub');
      return () => {};
    } else if (interval > 0) {
      fn();
      let intervalID = setInterval(fn, interval);
      return () => clearInterval(intervalID);
    } else {
      fn(); // Run once
      return () => {};
    }
  }, [fn, interval]);
};
