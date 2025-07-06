import { ReactDOM, Fragment, Component, useReducer } from "../which-react";
import "./index.css";

function FunctionComponent() {
  const [count1, setCount1] = useReducer((x: any) => x + 1, 0);

  return (
    <div>
      <h3>函数组件</h3>
      <button
        onClick={() => {
          setCount1(1);
        }}
      >
        {count1}
      </button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <FunctionComponent />
);
