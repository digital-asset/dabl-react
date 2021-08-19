import React from 'react';

import { PartyToken } from '../party-info/PartyToken';
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

interface DamlHubLoginProps {
  options?: LoginOptions;
  withButton?: boolean;
  withToken?: boolean;
  withFile?: boolean;
  onLogin: (credentials?: PartyToken, err?: string) => void;
  onPartiesLoad?: (parties?: PartyToken[], err?: string) => void;
}

/**
 *
 * DamlHubLogin component. Provides three different
 * login method props: `withButton`, `withToken`, or `withParties`.
 *
 * Provides a callback with credentials after a login.
 */
export const DamlHubLogin: React.FC<DamlHubLoginProps> = ({
  options,
  /** Interactive Daml Hub login through a single button. Recommended for production cases. Default if no login method props are given. */
  withButton,
  /** Login with an access token copied from Daml Hub's Identities page. Good for testing app views as a different party. Mainly useful for development */
  withToken,
  /** Provide a parties.json file from the Daml Hub Identities page to login as any owned party. A more convenient form of `withToken`, for logging in as many different parties at once */
  withFile,
  /**
   * Callback with credentials, or any errors that occurred during authentication
   *
   * @param credentials
   * @param err
   */
  onLogin,
  onPartiesLoad,
}) => {
  return (
    <div id="daml-hub-login">
      <ButtonLogin {...{ options, withButton, withToken, withFile, onLogin }} />
      <FileLogin {...{ options, withButton, withToken, withFile, onPartiesLoad }} />
      <TokenLogin {...{ options, withButton, withToken, withFile, onLogin }} />
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

    if (tokenFromCookie) {
      try {
        const at = new PartyToken(tokenFromCookie);
        onLogin(at);
      } catch (err) {
        onLogin(undefined, err);
      }
    } else {
      console.log('cookie not found');
    }
  }, [window.location]);

  const handleButtonLogin = () => {
    if (detectAppDomainType() === DomainType.APP_DOMAIN) {
      window.location.assign(`/.hub/v1/auth/login`);
    } else {
      const ledgerId = window.location.hostname.split('.')[0];
      window.location.assign(`https://login.projectdabl.com/auth/login?ledgerId=${ledgerId}`);
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
        <PartiesInput onPartiesLoad={onPartiesLoad} />
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
      onLogin(at);
    } catch (err) {
      onLogin(undefined, err);
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
