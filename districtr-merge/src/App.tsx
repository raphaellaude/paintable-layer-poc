import "./App.css";
import { AutomergeUrl, RawString } from "@automerge/automerge-repo";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { Assignments } from "./main";

interface Plan {
  name: RawString;
  assignments: Assignments;
}

function App({ docUrl }: { docUrl: AutomergeUrl }) {
  const [doc, changeDoc] = useDocument<Plan>(docUrl);

  return (
    <>
      <h1>Meet Automerge</h1>
      <div className="card">
        {doc ? (
          <div>
            <input
              onChange={(e) => {
                changeDoc((d) => (d.name = new RawString(e.target.value)));
              }}
              value={doc.name ? doc.name.val : undefined}
            />
            <button
              onClick={(e) => {
                e.preventDefault();
                changeDoc((d) => {
                  const key = doc.name.toString();
                  console.log(key);
                  const currentAssignment = d.assignments[key];
                  console.log(currentAssignment);

                  if (currentAssignment !== undefined) {
                    d.assignments[key] = currentAssignment + 1;
                  } else {
                    d.assignments[key] = 1;
                  }
                  d.name = new RawString("");
                });
              }}
            >
              Submit
            </button>
          </div>
        ) : null}
        {doc && doc.assignments ? (
          <ul>
            {Object.keys(doc.assignments).map((item, index) => (
              <li key={index}>
                {item}: {doc.assignments[item]}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </>
  );
}

export default App;
