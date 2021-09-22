import React from 'react';

import log from '../log';
import {
  deleteCookie,
  detectAppDomainType,
  damlHubEnvironment,
  DomainType,
  getCookieValue,
} from '../utils';

import { PartyToken } from '../party-token/PartyToken';

import { PartiesInput } from './PartiesInput';

const DABL_LEDGER_ACCESS_TOKEN = 'DABL_LEDGER_ACCESS_TOKEN';
const DAMLHUB_LEDGER_ACCESS_TOKEN = 'DAMLHUB_LEDGER_ACCESS_TOKEN';

interface LoginMethod<RenderFn> {
  text?: React.ReactChild; // Override the text (if applicable)
  render?: RenderFn;
}

interface LoginOptions {
  method: {
    button?: LoginMethod<() => React.ReactElement>;
    token?: LoginMethod<(onSubmit: () => void) => React.ReactElement>;
    file?: LoginMethod<() => React.ReactElement>;
  };
}

export const damlHubLogout = (): void => {
  if (detectAppDomainType() === DomainType.LEGACY_DOMAIN) {
    deleteCookie(DABL_LEDGER_ACCESS_TOKEN, 'projectdabl.com');
    deleteCookie(DAMLHUB_LEDGER_ACCESS_TOKEN, 'projectdabl.com');
  } else if (detectAppDomainType() === DomainType.APP_DOMAIN) {
    deleteCookie(DAMLHUB_LEDGER_ACCESS_TOKEN);
  }
};

/*
 * The type is engineered to allow for the following logic re: callback prop requirements.
 * Essentially, we want `onLogin` to be required at all times _except_ if _only_
 * `withFile` is given.
 *
 *
 * |-------------------------------------------------------------------------|
 * | withFile | (withButton || withToken) | required callback props          |
 * |-------------------------------------------------------------------------|
 * | T        | T                         | onLogin, onPartiesLoad           |
 * | T        | F                         | onPartiesLoad                    |
 * | F        | T                         | onLogin                          |
 * | F        | F                         | onLogin                          |
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
    const DAMLHUB_LEDGER_ACCESS_TOKEN = getCookieValue('DAMLHUB_LEDGER_ACCESS_TOKEN');
    const DABL_LEDGER_ACCESS_TOKEN = getCookieValue('DABL_LEDGER_ACCESS_TOKEN');
    const tokenFromCookie = DAMLHUB_LEDGER_ACCESS_TOKEN || DABL_LEDGER_ACCESS_TOKEN;

    log('button-login:effect').info(
      !!tokenFromCookie
        ? `Found token in browser cookie: ${tokenFromCookie}`
        : 'No cookie found - user has not authenticated'
    );

    const hubEnv = damlHubEnvironment();
    const ledgerId = hubEnv?.ledgerId;

    if (tokenFromCookie) {
      try {
        const at = new PartyToken(tokenFromCookie);
        if (
          !!ledgerId &&
          ledgerId !== at.ledgerId &&
          detectAppDomainType() === DomainType.LEGACY_DOMAIN
        ) {
          log('button-login:effect').warn(
            `Token's ledger ID (${at.ledgerId}) does not match the current running ledger's ID of ${ledgerId}. Deleting cookies...`
          );
          damlHubLogout();
        } else {
          onLogin && onLogin(at);
        }
      } catch (error) {
        onLogin && onLogin(undefined, JSON.stringify(error));
      }
    }
  }, [window.location]);

  const handleButtonLogin = () => {
    const damlHubCookieToken = getCookieValue(DAMLHUB_LEDGER_ACCESS_TOKEN);
    const legacyCookieToken = getCookieValue(DABL_LEDGER_ACCESS_TOKEN);

    const tokenFromCookie = damlHubCookieToken || legacyCookieToken;

    log('button-login:click-handler').info(
      !!tokenFromCookie
        ? `Found token in browser cookie: ${tokenFromCookie}`
        : 'No cookie found - user has not authenticated'
    );

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
    log('login').warn('<DamlHubLogin> supplied with `withParties`, but not `onPartiesLoad`');
  }

  if (showFile && onPartiesLoad) {
    const baseComponent = (
      <React.Fragment key="damlhub-login-parties-input">
        {showButton && <p>{text}</p>}
        <PartiesInput
          onPartiesLoad={(creds, err) => {
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
    } catch (error) {
      onLogin && onLogin(undefined, JSON.stringify(error));
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
