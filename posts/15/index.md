**React.createElement**

```js
// 创建一个元素对象
React.createElement(
  type,
  [props],
  [...children]
)

const element = React.createElement(
  "h1",
  { title: "foo" },
  "Hello"
)

// equal to

const element = {
  type: "h1",
  props: {
    title: "foo",
    children: "Hello",
  },
}
```

**ReactDOM.render** 

```js
ReactDOM.render(element, container[, callback])

const element = {
  type: "h1",
  props: {
    title: "foo",
    children: "Hello",
  },
}

const container = document.getElementById("root")

const node = document.createElement(element.type)
node["title"] = element.props.title

const text = document.createTextNode("")
text["nodeValue"] = element.props.children

node.appendChild(text)
container.appendChild(node)
```



