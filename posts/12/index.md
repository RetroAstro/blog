### 前言

自从 React 16.8 版本正式发布 React Hooks 以来已经过去一个多月了，而在这之前国内外对于 Hooks API 的讨论也一直是如火如荼地进行着。有些人觉得 Hooks API 很好用，而有些人却对它感到十分困惑。但 [Dan Abramov](https://github.com/gaearon) 说过，就像 React 在 2013 年刚出来的时候一样，Hooks API 也需要时间被开发者们接受和理解。为了加深自己对 React Hooks 的认识，于是便有了将相关资料整理成文的想法。本文主要是记录自己在学习 React Hooks 时认为比较重要的点和常见的坑，当然也会记录相关的最佳实践以便自己更加熟练地掌握此种 mental model ( 心智模型 ) 。如果你还不了解 React Hooks ，请先移步到[官方文档](https://reactjs.org/docs/hooks-intro.html)学习。 

### React Hooks 基本原理 

组件中的每次 render 都有其特定且独立的 props 和 state ( 可以把每一次 render 看作是函数组件的再次调用 )，如果组件中含有定时器、事件处理器、其他的 API 甚至 useEffect ，由于闭包的特性，在它们内部的代码都会立即捕获当前 render 的 props 和 state ，而不是最新的 props 和 state 。

让我们先来看一个最简单的例子，然后你就能够立刻理解上面那段话的意思了。

```jsx
// 先触发 handleAlertClick 事件
// 然后在 3 秒内增加 count 至 5
// 最后 alert 的结果仍为 0
function Counter() {
  const [count, setCount] = useState(0)

  function handleAlertClick() {
    setTimeout(() => {
      alert('You clicked on: ' + count)
    }, 3000)
  }
  
  // 最后的 document.title 为 5
  useEffect(
    () => {
      document.title = `You clicked ${count} times`
    }
  )
    
  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
      <button onClick={handleAlertClick}>
        Show alert
      </button>
    </div>
  )
}
```

虽然最后 alert 的结果为 0 ，但我们会发现最后的 **`document.title`** 却是 5 。了解 Hooks API 的人都知道，这是因为 useEffect 中的 effect 函数会在组件挂载和每次组件更新之后进行调用，所以我们获取到的 count 是最后一次 render 的 state ，它的值为 5 。如果我们给 useEffect 加上第二个参数 **`[]`** ，那最后我们的 **`document.title`** 就会是 0 ，这是因为此时的 useEffect 不依赖任何值，所以相应的 effect 函数只会在组件挂载的时候被调用一次。说了这么多，不如给一张图解释的清楚，下面的图完美诠释了 useEffect 与 React Hooks 生命周期的联系。

![hook-flow](./hook-flow.png)

从这张图中我们可以清楚地看到，每次 effect 函数调用之前都会先调用 cleanup 函数，而且 cleanup 函数只会在组件更新和组件卸载的时候调用，那么这个 cleanup 函数有什么作用呢？让我们来看一段代码。

```jsx
useEffect(() => {
  let didCancel = false

  const fetchData = async () => {
  	const result = await axios(url)
    
    if (!didCancel) {
        setData(result.data)
    }
  }

  fetchData()
  
  // 这里 return 的便是我们的 cleanup 函数
  return () => {
     didCancel = true
  }
}, [url])
```

这段代码解决了在网络请求中常见的竞态问题。假设我们没有调用 cleanup 函数，当我们连续调用两次 effect 函数时，由于请求数据到达时间的不确定，如果第一次请求的数据后到达，虽然我们想在浏览器屏幕上呈现的是第二次请求的数据，但结果却只会是第一次请求的数据。再一次的，由于闭包的特性，当我们执行 **`didCancel = true`** 时，在前一次的 effect 函数中 **`setData(result)`** 就无法被执行，竞态问题也便迎刃而解。当然 cleanup 函数还有很多常见的应用场景，例如清理定时器、订阅源等。

上面那张图还有几个值得我们注意的点：

* 父组件的重渲染、state 或 context 的改变都会造成组件的更新。
* 在 useLayoutEffect 中的 effect 函数是在 DOM 更新渲染到浏览器屏幕之前调用的，如果我们要执行有副作用的代码，一般只用 useEffect 而不是 useLayoutEffect 。
* 传递给 useState 和 useReducer 的参数若为函数，则只会在组件挂载时调用一次。

然后我们来讲下 useEffect 的第二个参数：

它用于跟前一次 render 传入的 deps ( 依赖 ) 进行比较，为的是避免不必要的 effect 函数再次执行。useEffect 的运行机制应该是先比较 deps ，若有不同则执行先前的 cleanup 函数，然后再执行最新的 effect 函数，若相同则跳过上面的两个步骤。如果要用函数作为 useEffect 的第二个参数，则需要使用 useCallback ，其作用是为了避免该函数在组件更新时再次被创建，从而使 useEffect 第二个参数的作用失效。

在这里我的理解是由于两个同名函数比较时总会返回 false ，而且使用 useCallback 也需要第二个参数，因此我猜测 React 最终还是以值的比较来达到“缓存”函数的效果。

```js
var a = function foo () {}
var b = function foo () {}
a === b // false
```

为了方便理解，下面是一个使用 useCallback 的例子。

```jsx
// 使用 useCallback，并将其传递给子组件
function Parent() {
  const [query, setQuery] = useState('react')
  
  // 只有当 query 改变时，fetchData 才会发生改变
  const fetchData = useCallback(() => {
    const url = 'https://hn.algolia.com/api/v1/search?query=' + query
  }, [query])

  return <Child fetchData={fetchData} />
}

function Child({ fetchData }) {
  let [data, setData] = useState(null)

  useEffect(() => {
    fetchData().then(setData)
  }, [fetchData])
}
```

### React Hooks 网络请求最佳实践

最后我们要实现的功能：

* 动态请求
* 加载状态
* 错误处理
* 竞态处理

下面是以三种不同的方式实现的例子。

#### 常规 Hook

```jsx
function App() {
  const [data, setData] = useState({ hits: [] })
  const [query, setQuery] = useState('redux')
  const [url, setUrl] = useState('http://hn.algolia.com/api/v1/search?query=redux')
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    let didCancel = false
    
    const fetchData = async () => {
      setIsError(false)
      setIsLoading(true)

      try {
        const result = await axios(url)
        
        if (!didCancel) {
          setData(result.data)
        }
      } catch (error) {
        if (!didCancel) {
          setIsError(true)
        }
      }

      setIsLoading(false)
    }

    fetchData()
    
    return () => {
       didCanel = true
    }
  }, [url])

  return (
    <>
      <input
        type="text"
        value={query}
        onChange={event => setQuery(event.target.value)}
      />
      <button
        type="button"
        onClick={() =>
          setUrl(`http://hn.algolia.com/api/v1/search?query=${query}`)
        }
      >
        Search
      </button>

      {isError && <div>Something went wrong ...</div>}

      {isLoading ? (
        <div>Loading ...</div>
      ) : (
        <ul>
          {data.hits.map(item => (
            <li key={item.id}>
              <a href={item.url}>{item.title}</a>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
```

#### 抽象 custom Hook 

```jsx
const useDataApi = (initialUrl, initialData) => {
  const [data, setData] = useState(initialData)
  const [url, setUrl] = useState(initialUrl)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    let didCancel = false
    
    const fetchData = async () => {
      setIsError(false)
      setIsLoading(true)

      try {
        const result = await axios(url)
        
        if (!didCancel) {
          setData(result.data)
        }
      } catch (error) {
        if (!didCancel) {
          setIsError(true)
        }
      }

      setIsLoading(false)
    }

    fetchData()
    
    return () => {
       didCanel = true
    }
  }, [url])

  const doFetch = url => {
    setUrl(url)
  }

  return { data, isLoading, isError, doFetch }
}

function App() {
  const [query, setQuery] = useState('redux')
  const { data, isLoading, isError, doFetch } = useDataApi(
    'http://hn.algolia.com/api/v1/search?query=redux',
    { hits: [] }
  )

  return (
    <>
      <input
        type="text"
        value={query}
        onChange={event => setQuery(event.target.value)}
      />
      <button
        type="button"
        onClick={() =>
          doFetch(`http://hn.algolia.com/api/v1/search?query=${query}`)
        }
      >
        Search
      </button>

      {isError && <div>Something went wrong ...</div>}

      {isLoading ? (
        <div>Loading ...</div>
      ) : (
        <ul>
          {data.hits.map(item => (
            <li key={item.id}>
              <a href={item.url}>{item.title}</a>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
```

#### 使用 useReducer

```jsx
const dataFetchReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_INIT':
      return {
        ...state,
        isLoading: true,
        isError: false
      }
    case 'FETCH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload,
      }
    case 'FETCH_FAILURE':
      return {
        ...state,
        isLoading: false,
        isError: true,
      }
    default:
      throw new Error()
  }
}

const useDataApi = (initialUrl, initialData) => {
  const [url, setUrl] = useState(initialUrl)

  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: false,
    isError: false,
    data: initialData,
  })

  useEffect(() => {
    let didCancel = false

    const fetchData = async () => {
      dispatch({ type: 'FETCH_INIT' })

      try {
        const result = await axios(url)

        if (!didCancel) {
          dispatch({ type: 'FETCH_SUCCESS', payload: result.data })
        }
      } catch (error) {
        if (!didCancel) {
          dispatch({ type: 'FETCH_FAILURE' })
        }
      }
    }

    fetchData()

    return () => {
      didCancel = true
    }
  }, [url])

  const doFetch = url => {
    setUrl(url)
  }

  return { ...state, doFetch }
}
```

### 常见场景 React Hooks 实现 

#### 生命周期

组件挂载时调用

```jsx
const onMount = () => {
   // ...
}

useEffect(() => {
  onMount()
}, [])
```

组件卸载时调用

```jsx
const onUnmount = () => {
   // ...
}

useEffect(() => {
  return () => onUnmount()
}, [])
```

#### 使用 useRef 获取 state 

获取组件最新的 state 

```jsx
function Message() {
  const [message, setMessage] = useState('')
  const latestMessage = useRef('')

  useEffect(() => {
    latestMessage.current = message
  }, [message])

  const showMessage = () => {
    alert('You said: ' + latestMessage.current)
  }

  const handleSendClick = () => {
    setTimeout(showMessage, 3000)
  }

  const handleMessageChange = (e) => {
    setMessage(e.target.value)
  }

  return (
    <>
      <input value={message} onChange={handleMessageChange} />
      <button onClick={handleSendClick}>Send</button>
    </>
  )
}
```

获取组件前一次的 state 

```jsx
function Counter() {
  const [count, setCount] = useState(0)
  const prevCount = usePrevious(count)
  
  return <h1>Now: {count}, before: {prevCount}</h1>
}

function usePrevious(value) {
  const ref = useRef()
  
  useEffect(() => {
    ref.current = value
  })
  
  return ref.current
}
```

#### 使用 useMemo 避免组件重渲染

```jsx
function Parent({ a, b }) {
  const child1 = useMemo(() => <Child1 a={a} />, [a])
  const child2 = useMemo(() => <Child2 b={b} />, [b])
  
  return (
    <>
      {child1}
      {child2}
    </>
  )
}
```

#### 使用 useImperativeHandle 转发 ref

```jsx
function ParentInput() {
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current.focus()
  }, [])

  return (
    <div>
      <ChildInput ref={inputRef} />
    </div>
  )
}

function ChildInput(props, ref) {
  const inputRef = useRef(null)
  
  useImperativeHandle(ref, () => inputRef.current)

  return <input type="text" name="child input" ref={inputRef} />
}
```

#### 利用 Hooks 实现简单的状态管理

借助 Hooks 和 Context 我们可以轻松地实现状态管理，下面是我自己实现的一个简单状态管理工具，已发布到 npm 上，后续可能有大的改进，感兴趣的可以关注下 :smile:。

> [**chrox**](https://github.com/RetroAstro/chrox)

目前的源码只有几十行，所以给出的是 TS 的版本。

```tsx
import * as React from 'react'

type ProviderProps = {
  children: React.ReactNode
}

export default function createChrox (
  reducer: (state: object, action: object) => object, 
  initialState: object
) {
  const StateContext = React.createContext<object>({})
  const DispatchContext = React.createContext<React.Dispatch<object>>(() => {})

  const Provider: React.FC<ProviderProps> = props => {
    const [state, dispatch] = React.useReducer(reducer, initialState)

    return (
      <DispatchContext.Provider value={dispatch}>
         <StateContext.Provider value={state}>
            {props.children}
         </StateContext.Provider>
      </DispatchContext.Provider>
    )
  }

  const Context = {
    state: StateContext,
    dispatch: DispatchContext
  }

  return {
    Context,
    Provider
  }
}
```

下面是利用该状态管理工具实现的一个 counter 的例子。

```jsx
// reducer.js
export const initialState = {
  count: 0
}

export const countReducer = (state, action) => {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + 1 }
    case 'decrement':
      return { ...state, count: state.count - 1 }
    default:
      return { ...state }
  }
}
```

```jsx
import React, { useContext } from 'react'
import { render } from 'react-dom'
import createChrox from 'chrox'
import { countReducer, initialState } from './reducer'

const { Context, Provider } = createChrox(countReducer, initialState)

const Status = () => {
  const state = useContext(Context.state)
  
  return (
    <span>{state.count}</span>
  )
}

const Decrement = () => {
  const dispatch = useContext(Context.dispatch)
  
  return (
    <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
  )
}

const Increment = () => {
  const dispatch = useContext(Context.dispatch)
  
  return (
    <button onClick={() => dispatch({ type: 'increment' })}>+</button>
  )
}

const App = () => (
  <>
    <Decrement />
    <Status />
    <Increment />
  </>
)

render(
  <Provider>
    <App />
  </Provider>,
  document.getElementById('root')
)
```

从上面可以看到我是基于 useReducer + useContext 来实现的状态管理，至于为什么要这样做，那是因为这样做有两个主要的好处：

1. 当我们的 state 变得复杂起来，比如是一个嵌套着很多子数值类型的对象。使用 useReducer ，我们可以通过编写 reducer 函数 ( 如果 state 足够复杂甚至可以先拆分 reducer 最后再进行合并 ) 来轻松地实现状态管理。
2. useReducer 返回的 **`dispatch`** 函数只会在组件挂载的时候初始化，而在之后的组件更新中并不会发生改变 ( 值得注意的是 useRef 也具有相同的特性 ) ，因此它相当于一种更好的 useCallback 。当遇到很深的组件树时，我们可以通过两个不同的 Context 将 useReducer 返回的 **`state`** 和 **`dispatch`** 分离，这样如果组件树底层的某个组件只需要 **`dispatch`** 函数而不需要 **`state`** ，那么当 **`dispatch`** 函数调用时该组件是不会被重新渲染的，由此我们便达到了性能优化的效果。

### 结语

写完整篇文章，往回看发现 React Hooks 确实是一种独特的 mental model ，凭借着这种“可玩性”极高的模式，我相信开发者们肯定能探索出更多的最佳实践。不得不说 2019 年是 React 团队带给开发者惊喜最多的一年，因为仅仅是到今年中期，React 团队就会发布 Suspense、React Hooks、Concurrent Mode 三个重要的 API ，而这一目标早已实现了一半。也正是因为这个富有创造力的团队，让我此生无悔入 React 😂。

---

参考内容：

[Hooks FAQ](https://reactjs.org/docs/hooks-faq.html) 

[Why Isn’t X a Hook?](https://overreacted.io/why-isnt-x-a-hook/)

[Making setInterval Declarative with React Hooks](https://overreacted.io/making-setinterval-declarative-with-react-hooks/)

[How Are Function Components Different from Classes?](https://overreacted.io/how-are-function-components-different-from-classes/)

[A Complete Guide to useEffect](https://overreacted.io/a-complete-guide-to-useeffect/)

[How to fetch Data with React Hooks?](https://www.robinwieruch.de/react-hooks-fetch-data/)

