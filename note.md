





`createRoot`

接收的参数：`container`与 `options`。

返回类型：`RootType`（即 `ReactDOMRoot`的实例）



`createRoot` API

允许在浏览器的DOM节点中创建根节点以显示React组件。

```js
import {createRoot} from "react-dom/client";

const root = createRoot(document.getElementById("root"));
```



```js
export type RootType={
    render(children:ReactNodeList):void,
    unmount():void,
    _internalRoot:FiberRoot|null
}
```

```js
function ReactDOMRoot(internalRoot:FiberRoot){
    this._internalRoot = internalRoot;
}
```

createRoot函数内的内容

1.检查container是否是DOM

如果不是，**throw new Error('createRoot(...):Target container is not a DOM element.');**

![image-20250702134536625](note.assets/image-20250702134536625.png)



2.检查options

```js
 if (options !== null && options !== undefined) {
    if (__DEV__) {
      if ((options: any).hydrate) {
        console.warn(
          'hydrate through createRoot is deprecated. Use ReactDOMClient.hydrateRoot(container, <App />) instead.',
        );
      } else {
        if (
          typeof options === 'object' &&
          options !== null &&
          (options: any).$$typeof === REACT_ELEMENT_TYPE
        ) {
          console.error(
            'You passed a JSX element to createRoot. You probably meant to ' +
              'call root.render instead. ' +
              'Example usage:\n\n' +
              '  let root = createRoot(domContainer);\n' +
              '  root.render(<App />);',
          );
        }
      }
    }
    if (options.unstable_strictMode === true) {
      isStrictMode = true;
    }
    if (options.identifierPrefix !== undefined) {
      identifierPrefix = options.identifierPrefix;
    }
    if (options.onUncaughtError !== undefined) {
      onUncaughtError = options.onUncaughtError;
    }
    if (options.onCaughtError !== undefined) {
      onCaughtError = options.onCaughtError;
    }
    if (options.onRecoverableError !== undefined) {
      onRecoverableError = options.onRecoverableError;
    }
    if (enableDefaultTransitionIndicator) {
      if (options.onDefaultTransitionIndicator !== undefined) {
        onDefaultTransitionIndicator = options.onDefaultTransitionIndicator;
      }
    }
    if (options.unstable_transitionCallbacks !== undefined) {
      transitionCallbacks = options.unstable_transitionCallbacks;
    }
  }
```





3.`createContainer`创建 `FiberRoot`，即源码里的root

这里的`containerInfo`就是根dom节点。这个变量在 `createRoot`里叫 `container`，道者里换名成了 `containerInfo`。



![image-20250702134807463](note.assets/image-20250702134807463.png)

`createContainer`里具体内容如下：

 ![image-20250702135245753](note.assets/image-20250702135245753.png)

![image-20250702135254603](note.assets/image-20250702135254603.png)

`createContainer`中创建 `createFiberRoot`并将其返回，

其返回类型为 `FiberRoot`

![image-20250702135550143](note.assets/image-20250702135550143.png)

`createFiberRoot`  内部`FiberRoot`通过new FiberRootNode()创建实例

![image-20250702135924377](note.assets/image-20250702135924377.png)

![image-20250702140406286](note.assets/image-20250702140406286.png)

`createFiberRoot`  内部 `createHostRootFiber`创建原生标签的根 `Fiber`

`createHostRootFiber`的返回类型为 `Fiber`

注意这里创建的 `Fiber`只是属于根部的 `Fiber`。和上面 `FiberRoot`不同，`FiberRoot`与 `Fiber`是两个类型

![image-20250702141918873](note.assets/image-20250702141918873.png)

![image-20250702140713160](note.assets/image-20250702140713160.png)



`createHostRootFiber`内部 `createFiber`为通用构造fiber函数返回类型为 `Fiber`

![image-20250702141214552](note.assets/image-20250702141214552.png![image-20250702141342353](note.assets/image-20250702141342353.png)

![image-20250702141223520](note.assets/image-20250702141223520.png)

![image-20250702141456834](note.assets/image-20250702141456834.png)



回到 `createFiberRoot`内部接下来

循环构造 root 与 uninitializedFiber

root.current 是 `Fiber`

uninitializedFiber.stateNode是根FiberRoot

![image-20250702141945088](note.assets/image-20250702141945088.png)



`createFiberRoot`内部

初始化 `initializeUpdateQueue`

类似fiber，updatequeues 也是成对出现的，一个已经完成的即对应目前页面，一个正在工作中的

![image-20250702142539446](note.assets/image-20250702142539446.png)

![image-20250702142721078](note.assets/image-20250702142721078.png)

到这里 `createFiberRoot`函数大部分结束，即也是 `createContainer`函数大部分结束



回到 `createRoot`

4.markContainerAsRoot 标记 Container是根Fiber

这个函数给container根DOM节点赋值根Fiber

![image-20250702143419628](note.assets/image-20250702143419628.png)![image-20250702143440212](note.assets/image-20250702143440212.png)

```js

const randomKey = Math.random().toString(36).slice(2);
const internalContainerInstanceKey = '__reactContainer$' + randomKey;
```

这个属性值在函数中用于 `getClosestInstanceFromNode`和 `getInstanceFromNode`中会用于根据根DOM取Fiber值

对应还有两个函数：

![image-20250702143808018](note.assets/image-20250702143808018.png)



5.从container层监听 listenToAllSupportedEvents



6.最后返回一个 `ReactDOMRoot`实例

![image-20250702144025697](note.assets/image-20250702144025697.png)

![image-20250702144035848](note.assets/image-20250702144035848.png)

具体流程：

![react-resource](../react-resource.svg)
