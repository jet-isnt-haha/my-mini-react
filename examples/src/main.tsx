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
} from "../which-react";
import "./index.css";

// function FunctionComponent() {
//   const [count1, setCount1] = useReducer((x) => x + 1, 0);
//   const [count2, setCount2] = useState(1);
//   // const arr = count1 % 2 === 0 ? [0, 1, 2, 3, 4] : [0, 1, 2, 3];
//   const arr = count2 % 2 === 0 ? [0, 1, 2, 3, 4] : [3, 2, 0, 4, 1];

//   return (
//     <div>
//       <h3>函数组件</h3>
//       <button
//         onClick={() => {
//           setCount2(count2 + 1);
//         }}
//       >
//         {count2}
//       </button>
//       <ul>
//         {arr.map((item) => (
//           <li key={"li" + item}>{item}</li>
//         ))}
//       </ul>
//     </div>
//   );
// }

function FunctionComponent() {
  const [count1, setCount1] = useReducer((x) => x + 1, 0);
  const [count2, setCount2] = useState(0);
  let ref = useRef(0);
  // const addClick = useCallback(() => {
  //   let sum = 0;
  //   for (let i = 0; i < count1; ++i) {
  //     sum += i;
  //   }
  //   return sum;
  // }, [count1]);
  // const expensive = useMemo(() => {
  //   console.log("compute");
  //   return addClick();
  // }, [addClick]);
  useLayoutEffect(() => {
    console.log("useLayoutEffect");
  }, [count1]);
  useEffect(() => {
    console.log("useEffect");
  }, [count2]);
  return (
    <div className="border">
      <h1>Function Component</h1>
      <button onClick={() => setCount1()}>{count1}</button>
      <button onClick={() => setCount2(count2 + 1)}>{count2}</button>
      <Child count1={count1} count2={count2} />
    </div>
  );
}
function Child({ count1, count2 }: { count1: number; count2: number }) {
  useLayoutEffect(() => {
    console.log("useLayoutEffect Child");
  }, [count1]);
  useEffect(() => {
    console.log("useEffect Child");
  }, [count2]);

  return <div>Child</div>;
}
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <FunctionComponent />
);
