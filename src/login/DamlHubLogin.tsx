import React from 'react';

import { PartyToken } from '../party-token/PartyToken';
import { detectAppDomainType, DomainType, getCookieValue } from '../utils';

import { PartiesInput } from './PartiesInput';

interface LoginMethod<RenderFn> {
  text?: React.ReactChild; // Override the text (if applicable)
  render?: RenderFn;
}

interface LoginOptions {
  wrapper?: React.ReactElement; // A component to wrap around each individual method component
  method: {
    button?: LoginMethod<() => React.ReactElement>;
    token?: LoginMethod<(onSubmit: () => void) => React.ReactElement>;
    file?: LoginMethod<() => React.ReactElement>;
  };
}

const LOGGED_IN_KEY = '.hub/v1/auth/logged-in';

const isLoggedIn = (): boolean => {
  return !!sessionStorage.getItem(LOGGED_IN_KEY);
};

const setLoginMarker = (c: string): void => {
  console.log('CALLING SET LOGIN MARKER FROM: ', c);
  sessionStorage.setItem(LOGGED_IN_KEY, 'true');
};

export const damlHubLogout = (): void => {
  sessionStorage.removeItem(LOGGED_IN_KEY);
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

/*
 * The type is engineered to allow for the following logic.
 * Essentially, we want `onLogin` to be required at all times _except_ if _only_
 * `withFile` is given.
 *
 *
 * |-------------------------------------------------------------------------|
 * | withFile | (withButton || withToken) | callbacks                        |
 * |-------------------------------------------------------------------------|
 * | T        | T                         | required(onLogin, onPartiesLoad) |
 * | T        | F                         | required(onPartiesLoad)          |
 * | F        | T                         | required(onLogin)                |
 * | F        | F                         | required(onLogin)                |
 * |-------------------------------------------------------------------------|
 */
type DamlHubLoginProps =
  | {
      options?: LoginOptions;
      withButton?: boolean;
      withToken?: boolean;
      withFile: boolean;
      onLogin?: (credentials?: PartyToken, err?: string) => void;
      onPartiesLoad: (parties?: PartyToken[], err?: string) => void;
    }
  | {
      options: {
        method: {
          button?: LoginMethod<() => React.ReactElement>;
          token?: LoginMethod<(onSubmit: () => void) => React.ReactElement>;
          file: LoginMethod<() => React.ReactElement>;
        };
      };
      withButton?: boolean;
      withToken?: boolean;
      withFile?: boolean;
      onLogin?: (credentials?: PartyToken, err?: string) => void;
      onPartiesLoad: (parties?: PartyToken[], err?: string) => void;
    }
  | {
      options?: LoginOptions;
      withButton?: boolean;
      withToken?: boolean;
      withFile?: boolean;
      onLogin: (credentials?: PartyToken, err?: string) => void;
      onPartiesLoad?: (parties?: PartyToken[], err?: string) => void;
    };

// let aa: DamlHubLoginProps;

// // Should work
// aa = { onLogin: (c, e) => console.log(c, e) };
// aa = { withFile: true, onPartiesLoad: (p, e) => console.log(p, e) };
// aa = { withToken: true, onLogin: (c, e) => console.log(c, e) };
// aa = {
//   withFile: true,
//   onPartiesLoad: (p, e) => console.log(p, e),
//   withToken: true,
//   onLogin: (c, e) => console.log(c, e),
// };
// aa = {
//   onLogin: (c, e) => console.log(c, e),
//   options: {
//     method: {
//       button: {
//         render: () => <input />,
//       },
//     },
//   },
// };
// aa = {
//   onLogin: (c, e) => console.log(c, e),
//   options: {
//     method: {
//       token: {
//         render: () => <input />,
//       },
//     },
//   },
// };
// aa = {
//   onLogin: (c, e) => console.log(c, e),
//   options: {
//     method: {
//       button: {
//         render: () => <input />,
//       },
//       token: {
//         render: () => <input />,
//       },
//     },
//   },
// };
// aa = {
//   onPartiesLoad: (c, e) => console.log(c, e),
//   options: {
//     method: {
//       file: {
//         render: () => <input />,
//       },
//     },
//   },
// };

// // Should fail
// aa = {};
// aa = { withFile: true, onLogin: (c, e) => console.log(c, e) };
// aa = { withToken: true, onPartiesLoad: (p, e) => console.log(p, e) };
// aa = {
//   // withFile: true,
//   withToken: true,
//   onLogin: (c, e) => console.log(c, e),
//   onPartiesLoad: (p, e) => console.log(p, e),
// };

/**
 *
 * DamlHubLogin component. Provides three different
 * login method props: `withButton`, `withToken`, or `withParties`.
 *
 * Provides a callback with credentials after a login.
 */
export const DamlHubLogin: React.FC<DamlHubLoginProps> = props => {
  return (
    <div id="daml-hub-login">
      <ButtonLogin {...props} />
      <FileLogin {...props} />
      <TokenLogin {...props} />
    </div>
  );
};

const normalizeDisplayOpt = (
  props: Omit<DamlHubLoginProps, 'onLogin'>
): { button: boolean; token: boolean; file: boolean } => {
  const { options, withButton, withToken, withFile } = props;

  const showToken =
    !!withToken || !!options?.method?.token?.render || !!options?.method?.token?.text;
  const showFile = !!withFile || !!options?.method?.file?.render || !!options?.method?.file?.text;
  const showButton =
    showToken || showFile
      ? !!withButton || !!options?.method?.button?.text || !!options?.method?.button?.render
      : true;

  return {
    button: showButton,
    token: showToken,
    file: showFile,
  };
};

const ButtonLogin: React.FC<DamlHubLoginProps> = props => {
  const { button: showButton } = normalizeDisplayOpt(props);
  const { options, onLogin } = props;

  let text = options?.method?.button?.text || 'Log in with Daml Hub';

  React.useEffect(() => {
    console.log('Location changed: ', window.location);
    const DAMLHUB_LEDGER_ACCESS_TOKEN = getCookieValue('DAMLHUB_LEDGER_ACCESS_TOKEN');
    const DABL_LEDGER_ACCESS_TOKEN = getCookieValue('DABL_LEDGER_ACCESS_TOKEN');
    const tokenFromCookie = DAMLHUB_LEDGER_ACCESS_TOKEN || DABL_LEDGER_ACCESS_TOKEN;

    if (!isLoggedIn()) {
      return;
    }

    if (tokenFromCookie) {
      try {
        const at = new PartyToken(tokenFromCookie);
        onLogin && onLogin(at);
      } catch (err) {
        onLogin && onLogin(undefined, err);
      }
    } else {
      console.log('cookie not found');
    }
  }, [window.location]);

  const handleButtonLogin = () => {
    setLoginMarker('button log in!');

    const DAMLHUB_LEDGER_ACCESS_TOKEN = getCookieValue('DAMLHUB_LEDGER_ACCESS_TOKEN');
    const DABL_LEDGER_ACCESS_TOKEN = getCookieValue('DABL_LEDGER_ACCESS_TOKEN');
    const tokenFromCookie = DAMLHUB_LEDGER_ACCESS_TOKEN || DABL_LEDGER_ACCESS_TOKEN;

    if (!tokenFromCookie) {
      if (detectAppDomainType() === DomainType.APP_DOMAIN) {
        window.location.assign(`/.hub/v1/auth/login`);
      } else {
        const ledgerId = window.location.hostname.split('.')[0];
        window.location.assign(`https://login.projectdabl.com/auth/login?ledgerId=${ledgerId}`);
      }
    } else {
      onLogin && onLogin(new PartyToken(tokenFromCookie));
    }
  };

  if (showButton) {
    if (options?.method?.button?.render) {
      const comp = options.method.button.render();
      return React.cloneElement(comp, {
        onClick: handleButtonLogin,
        children: [
          ...React.Children.toArray(comp.props.children),
          <span key="damlhub-login-custom-button-text">{text}</span>,
        ],
      });
    } else {
      return (
        <a id="log-in-with-hub" onClick={handleButtonLogin}>
          {text}
        </a>
      );
    }
  } else {
    return null;
  }
};

const FileLogin: React.FC<Omit<DamlHubLoginProps, 'onLogin'>> = props => {
  const { file: showFile, button: showButton } = normalizeDisplayOpt(props);
  const { options, onPartiesLoad } = props;

  let text = options?.method?.file?.text || (
    <span>
      Alternatively, login with <code className="link">parties.json</code> located in the Daml Hub
      Identities tab:
    </span>
  );

  if (showFile && !onPartiesLoad) {
    console.warn('WARNING: <DamlHubLogin> supplied with `withParties`, but not `onPartiesLoad`');
  }

  if (showFile && onPartiesLoad) {
    const baseComponent = (
      <React.Fragment key="damlhub-login-parties-input">
        {showButton && <p>{text}</p>}
        <PartiesInput
          onPartiesLoad={(creds, err) => {
            if (creds.length > 0) {
              setLoginMarker('file login!!!');
            }
            onPartiesLoad(creds, err);
          }}
        />
      </React.Fragment>
    );

    if (options?.method?.file?.render) {
      const comp = options.method.file.render();
      return (
        <>
          {showButton && <p>{text}</p>}
          {React.cloneElement(comp, {
            children: [baseComponent, ...React.Children.toArray(comp.props.children)],
          })}
        </>
      );
    } else {
      return baseComponent;
    }
  } else {
    return null;
  }
};

const TokenLogin: React.FC<DamlHubLoginProps> = props => {
  const { token: showToken } = normalizeDisplayOpt(props);
  const { options, onLogin } = props;

  const [jwtInput, setJwtInput] = React.useState('');

  const text = options?.method?.token?.text || 'Log in with Access Token';

  const handleTokenLogin = () => {
    try {
      const at = new PartyToken(jwtInput);
      onLogin && onLogin(at);
      setLoginMarker('token login!!!');
    } catch (err) {
      onLogin && onLogin(undefined, err);
    }
  };

  if (showToken) {
    if (options?.method?.token?.render) {
      const comp = options.method.token.render(handleTokenLogin);
      return React.cloneElement(comp, {
        children: [
          <label key="damlhub-login-token-label" htmlFor="token">
            {text}:
          </label>,
          ...React.Children.toArray(comp.props.children),
        ],
      });
    } else {
      return (
        <form id="log-in-with-token">
          <label htmlFor="token">{text}:</label>
          <input
            type="password"
            name="token"
            value={jwtInput}
            onChange={e => setJwtInput(e.target.value)}
            placeholder="JWT Token"
          ></input>
          <button type="submit" onClick={handleTokenLogin}>
            Submit
          </button>
        </form>
      );
    }
  } else {
    return null;
  }
};
