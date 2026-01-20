import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import './App.css';
import { ChatPanel } from './components/ChatPanel';

function App() {
  return (
    <div className="page">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Onyx AI demo</p>
          <h1>Chat console with Onyx</h1>
          <p className="lede">
            A minimal chat UI wired to the Onyx OpenAI-compatible Chat API. Set
            your API key, run the app, and start chatting.
          </p>
        </div>
        <div className="hero-meta">
          <div className="meta">
            <span className="label">Endpoint</span>
            <span className="value">https://ai.onyx.dev/v1</span>
          </div>
          <div className="meta">
            <span className="label">Model</span>
            <span className="value">onyx</span>
          </div>
        </div>
      </header>

      <main>
        <ChatPanel />
      </main>
    </div>
  );
}

export default App;
