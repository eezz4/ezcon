# ezcon

react easy context `(ez con)`

- I made this for my personal use, but distribute it because I think it's useful.
- I haven't used it yet, so I don't know if there are any bugs.
- It's based on the default `react Context`, so there are no library dependencies.
- The parameter will be `type inferred` based on the `'useState'` and `'useRef'`.
- If the `same provider` is nested and used, an error is thrown.
- You can use `scope Providers`.
- You can probably use any `combination of Providers`.
- I like the name because it's easier than recoil.

[![NPM](https://img.shields.io/npm/v/ezcon.svg)](https://www.npmjs.com/package/ezcon) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save ezcon
```

## Usage 1 : `ezcon`

```tsx
import { ezcon } from 'ezcon'

const ezState1 = ezcon('useState', () => 0)

export function App() {
  return (
    <ezState1.Provider>
      <ScopeTest1 />
      <ScopeTest2 />
    </ezState1.Provider>
  )
}

function ScopeTest1() {
  const value1 = ezState1.useValue()
  console.log('ScopeTest1 call', value1)
  return <div />
}

function ScopeTest2() {
  const dispatch1 = ezState1.useDispatch()
  console.log('ScopeTest2 call')
  return <button onClick={() => dispatch1((p) => p + 1)} />
}
```

##### Click the button in ScopeTest2 four times.

```log
ScopeTest1 call 1
ScopeTest1 call 2
ScopeTest1 call 3
ScopeTest1 call 4
```

## Usage 2 : `ezconProviderCombine()`

```tsx
import { ezcon, ezconProviderCombine } from './ezcon'

export const ezState1 = ezcon('useState', () => 0)
export const ezState2 = ezcon('useState', () => 0)
export const ezState3 = ezcon('useState', () => 0)
export const ezRef1 = ezcon('useRef', () => 0)
export const ScopeTestCombineProvider = ezconProviderCombine(
  () => undefined,
  ezState1,
  ezState2,
  ezState3,
  ezRef1
)

export function App() {
  return (
    <>
      <ScopeTestCombineProvider>
        <ScopeTest1 />
        <ScopeTest2 />
      </ScopeTestCombineProvider>
      <OutsideScope />
    </>
  )
}
```

```tsx
function ScopeTest1() {
  const value1 = ezState1.useValue()
  const value2 = ezState2.useValue()
  const value3 = ezState3.useValue()
  const refObj1 = ezRef1.useMutableRefObject()
  console.log('ScopeTest1 call', value1, value2, value3, refObj1.current)
  return <div />
}
function ScopeTest2() {
  // const value1 = ezState1.useValue();
  const value2 = ezState2.useValue()
  const value3 = ezState3.useValue()
  const refObj1 = ezRef1.useMutableRefObject()

  const dispatch1 = ezState1.useDispatch()
  console.log('ScopeTest2 call')
  return <button onClick={() => dispatch1((p) => p + 1)} />
}
function OutsideScope() {
  const value1 = ezState1.useValue()
  const value2 = ezState2.useValue()
  const value3 = ezState3.useValue()
  const refObj1 = ezRef1.useMutableRefObject()
  console.log('OutsideScope call')
  return <div />
}
```

##### Click the button in ScopeTest2 four times.

```log
ScopeTest1 call 1 0 0 0
ScopeTest1 call 2 0 0 0
ScopeTest1 call 3 0 0 0
ScopeTest1 call 4 0 0 0
```

## My Migration Example 1

### before

```tsx
export const ctxModal = {
  node: createContext<ReactNode>(null),
  setNode: createContext<Dispatch<SetStateAction<ReactNode>>>(() => {})
} as const

export const ProviderModal = (props: { children: ReactNode }) => {
  const [node, setNode] = useState<ReactNode>(null)
  return (
    <ctxModal.setNode.Provider value={setNode}>
      <ctxModal.node.Provider value={node}>
        {props.children}
      </ctxModal.node.Provider>
    </ctxModal.setNode.Provider>
  )
}
```

```tsx
<ProviderModal>{props.children}</ProviderModal>
```

```tsx
const setNode = useContext(ctxModal.setNode)
const node = useContext(ctxModal.node)
```

### after

```tsx
export const ezModal = ezcon('useState', () => null as ReactNode)
```

```tsx
<ezModal.Provider>{props.children}</ezModal.Provider>
```

```tsx
const setNode = ezModal.useDispatch()
const node = ezModal.useValue()
```

## License

MIT © [stacew](https://github.com/stacew)
