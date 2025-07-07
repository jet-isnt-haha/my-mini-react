import { ReactDOM, Fragment, Component, useReducer } from "../which-react";
import "./index.css";

function FunctionComponent() {
  const [count1, setCount1] = useReducer((x) => x + 1, 0);

  return (
    <div>
      {/* <h3>函数组件</h3> */}
      {count1 % 2 === 0 ? (
        <button
          onClick={() => {
            setCount1();
          }}
        >
          {count1}
        </button>
      ) : (
        <span>React</span>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <FunctionComponent />
);
