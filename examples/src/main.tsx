import {
  ReactDOM,
  Fragment,
  Component,
  useReducer,
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  useLayoutEffect,
  createContext,
  useContext,
} from "../which-react";
import "./index.css";

function FunctionComponent() {
  const [count, setCount] = useReducer((x) => x + 1, 0);
  const [text1, setText1] = useState("aaa");

  return (
    <div className="border">
      <h1>函数组件</h1>
      <button
        onClick={(e) => {
          console.log("aaa", e);
          setCount();
        }}
      >
        {count}
      </button>
      <input
        value={text1}
        onChange={(e) => {
          setText1(e.target.value);
          console.log(e);
        }}
      />
      <p>{text1}</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <FunctionComponent />
);
