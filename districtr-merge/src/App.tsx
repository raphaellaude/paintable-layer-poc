import "./App.css";
import { AutomergeUrl, RawString } from "@automerge/automerge-repo";
import { useDocument } from "@automerge/automerge-repo-react-hooks";

interface CounterDoc {
  counter: RawString;
}

function App({ docUrl }: { docUrl: AutomergeUrl }) {
  const [doc, changeDoc] = useDocument<CounterDoc>(docUrl);

  return (
    <>
      <h1>Meet Automerge</h1>
      <div className="card">
        {doc ? (
          <input
            onChange={(e) => {
              changeDoc((d) => (d.counter = new RawString(e.target.value)));
            }}
            value={doc.counter.val}
          />
        ) : null}
        <p>Open this page in another tab to watch the updates synchronize</p>
      </div>
      <p className="read-the-docs">
        Built with Automerge, Vite, React, and TypeScript
      </p>
    </>
  );
}

export default App;
