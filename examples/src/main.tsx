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

const CountContext = createContext(100);
const ThemeContext = createContext("red");

function FunctionComponent() {
  // const [count1, setCount1] = useReducer((x) => x + 1, 0);
  const [count2, setCount2] = useState(0);
  // let ref = useRef(0);
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
  // useLayoutEffect(() => {
  //   console.log("useLayoutEffect");
  // }, [count1]);
  // useEffect(() => {
  //   console.log("useEffect");
  // }, [count2]);

  return (
    <div className="border">
      <h1>函数组件</h1>
      <button
        onClick={() => {
          setCount2(count2 + 1);
        }}
      >
        {count2}
      </button>
      <ThemeContext.Provider value="green">
        <CountContext.Provider value={count2}>
          <CountContext.Provider value={count2 + 1}>
            <Child />
          </CountContext.Provider>
        </CountContext.Provider>
      </ThemeContext.Provider>
    </div>
  );
}
function Child() {
  const count = useContext(CountContext);
  const theme = useContext(ThemeContext);
  return (
    <div className={"border " + theme}>
      Child
      <p>{count}</p>
      <p>Consumer</p>
      <ThemeContext.Consumer>
        {(theme) => (
          <div className={theme}>
            <CountContext.Consumer>
              {(value) => <p>{value}</p>}
            </CountContext.Consumer>
          </div>
        )}
      </ThemeContext.Consumer>
      <p>第三种消费方式:ContextType,只能消费单一的context来源</p>
      <ClassComponent />
    </div>
  );
}

class ClassComponent extends Component {
  static contextType = CountContext;
  render() {
    console.log("classComponent render");
    return (
      <div className="border">
        <h1>Class 类组件</h1>
        <p>{this.context as number}</p>
      </div>
    );
  }
}
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <FunctionComponent />
);
