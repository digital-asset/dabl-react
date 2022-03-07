import DamlHub, { DamlHubLogin } from '@daml/hub-react';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <DamlHubLogin onLogin={(creds, error) => {
          if (!creds) {
            console.log("Something went wrong: ", error);
          } else {
            console.log("User credentials: ", creds);
          }
        }} />

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
        </DamlHub>
      </header>
    </div>
  );
}

export default App;
