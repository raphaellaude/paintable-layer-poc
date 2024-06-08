import "./App.css";
import { AutomergeUrl, RawString } from "@automerge/automerge-repo";
import { useDocument } from "@automerge/automerge-repo-react-hooks";

interface CounterDoc {
  counter: RawString;
  items?: RawString[];
}

function App({ docUrl }: { docUrl: AutomergeUrl }) {
  const [doc, changeDoc] = useDocument<CounterDoc>(docUrl);

  return (
    <>
      <h1>Meet Automerge</h1>
      <div className="card">
        {doc ? (
          <div>
            <input
              onChange={(e) => {
                changeDoc((d) => (d.counter = new RawString(e.target.value)));
              }}
              value={doc.counter.val}
            />
            <button
              onClick={(e) => {
                e.preventDefault();
                changeDoc((d) => {
                  if (!d.items) {
                    d.items = [];
                  }
                  d.items.push(new RawString(doc.counter.val));
                  d.counter = new RawString("");
                });
              }}
            >
              Submit
            </button>
          </div>
        ) : null}
        {doc && doc.items && doc.items.length > 0 ? (
          <ul>
            {doc.items.map((item, index) => (
              <li key={index}>{item.val}</li>
            ))}
          </ul>
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
