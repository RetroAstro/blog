## 前言

自从 React 16.8 版本正式发布 React Hooks 以来已经过去一个多月了，而在这之前国内外对于 Hooks API 的讨论也一直是如火如荼地进行着。有些人觉得 Hooks API 很好用，而有些人会对它感到十分困惑。但 [Dan Abramov](https://github.com/gaearon) 说过，就像 React 在 2013 年刚出来的时候一样，Hooks API 也需要时间被开发者们接受和理解。本文主要是记录自己在 React Hooks 学习中认为比较重要的点和常见的坑，当然也会记录相关的最佳实践以便自己更加熟练地掌握此种 mental model ( 心智模型 ) 。

### React Hooks 基本原理 

组件中的每次 render 都有其特定且独立的 props 和 state ( 可以把每一次 render 看作是函数组件的再次调用 )，如果组件中含有定时器、事件处理器、其他的 API 甚至 useEffect，由于闭包的特性，在它们内部的代码都会立即捕获当前 render 的 props 和 state ，而不是最新的 props 和 state 。

#### useEffect 与 React Hooks 生命周期的联系

![hook-flow](./hook-flow.png)

useEffect 的第二个参数：用于跟前一次 render 阶段传入的 deps 比较，为了避免不必要的 effect 执行。

如果要用函数作为 useEffect 的第二个参数，则需要使用 useCallback ，其作用是为了避免该函数在组件更新时重新被执行，从而使 useEffect 第二个参数的作用失效。

useEffect 的运行机制应该是先比较 deps ，若有不同则先 cleanup 先前的 effect ，然后再执行最新的 effect ，若相同则跳过上面的两个步骤。

### React Hooks 网络请求最佳实践 

* 基础要求
  * 动态请求
  * 加载状态
  * 错误处理
  * 竞态条件
* 实现方式
  * 常规 Hook
  * 抽象 custom Hook
  * 使用 useReducer

### 常见需求 React Hooks 实现 

* 生命周期
  * mount
  * unmount
* 获取 state
  * latest
  * previous
* 避免组件重渲染 ( **`useMemo`** ) 
* 转发 ref ( **`useImperativeHandle`** ) 
* 使用 Hooks 实现简单的状态管理工具 ( **`useReducer`** + **`useContext`** )





