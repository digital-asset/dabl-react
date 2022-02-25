import logo from './logo.svg';
import './App.css';

import DamlHub, { DamlHubLogin } from '@daml/hub-react';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <DamlHubLogin onLogin={(creds, error) => {
          if (!creds) {
            console.log("Something went wrong: ", error);
          } else {
            console.log("User credentials: ", creds);
          }
        }} />
{/*
        <DamlHub>
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </DamlHub> */}
      </header>
    </div>
  );
}

export default App;
