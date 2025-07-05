import { ReactDOM, Fragment, Component } from "../which-react";
import "./index.css";

let fragment = (
  <>
    <>2222</>
    333
  </>
);
// fragment = (
//   <Fragment key="jet">
//     <h1>111</h1>
//     <h2>222</h2>
//   </Fragment>
// );
class ClassComponent extends Component {
  render() {
    return (
      <div>
        <h3>ClassComponent</h3>
      </div>
    );
  }
}
function FunctionComponent() {
  return (
    <div>
      <h3>FunctionComponent</h3>
    </div>
  );
}
const jsx = (
  <div className="box border">
    <h1 className="border">omg</h1>
    {fragment}
    <FunctionComponent />
    <ClassComponent />
    <h2>111</h2>
    <h2>111</h2>
  </div>
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(jsx);
