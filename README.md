# ezcon ( react easy context )

- You can declare useState(`ezState`) and useRef(`ezRef`) globally, use `Provider` to specify `the scope of the hook`.
- It's based on the default `react context`.
- `type inferred` based on the `useState` and `useRef`.
- You can use `scope providers`.
- If the `same Provider` is nested and used, an `Error` is thrown.
- You can use `combination of Providers`.

[![NPM](https://img.shields.io/npm/v/ezcon.svg)](https://www.npmjs.com/package/ezcon) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save ezcon
```

---

## Usage 1 : `ezState`

```tsx
import { ezState } from 'ezcon'

const ezState1 = ezState(0)

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

#### Click the button in ScopeTest2 four times.

```log
ScopeTest1 call 1
ScopeTest1 call 2
ScopeTest1 call 3
ScopeTest1 call 4
```

---

## Usage 2 : `ezCombineProvider()`

```tsx
import { ezState, ezRef, ezCombineProvider } from 'ezcon'

export const ezTest = {
  state1: ezState(0),
  state2: ezState(() => 0),
  state3: ezState(() => 0),
  ref1: ezRef(0)
} as const

export const ScopeTestProvider = ezCombineProvider(
  [ezTest.state1, ezTest.state2, ezTest.state3, ezTest.ref1],
  () => console.log('hello ezcon Provider hook')
)

export function App() {
  return (
    <>
      <ScopeTestProvider>
        <ScopeTest1 />
        <ScopeTest2 />
      </ScopeTestProvider>
      <OutsideScope />
    </>
  )
}
```

```tsx
function ScopeTest1() {
  const value1 = ezTest.state1.useValue()
  const value2 = ezTest.state2.useValue()
  const value3 = ezTest.state3.useValue()
  const refObj1 = ezTest.ref1.useMutableRefObject()
  console.log('ScopeTest1 call', value1, value2, value3, refObj1.current)
  return <div />
}
function ScopeTest2() {
  // const value1 = ezTest.state1.useValue()
  const value2 = ezTest.state2.useValue()
  const value3 = ezTest.state3.useValue()
  const refObj1 = ezTest.ref1.useMutableRefObject()

  const dispatch1 = ezTest.state1.useDispatch()
  console.log('ScopeTest2 call')
  return <button onClick={() => dispatch1((p) => p + 1)} />
}
function OutsideScope() {
  const value1 = ezTest.state1.useValue()
  const value2 = ezTest.state2.useValue()
  const value3 = ezTest.state3.useValue()
  const refObj1 = ezTest.ref1.useMutableRefObject()
  console.log('OutsideScope call')
  return <div />
}
```

#### Click the button in ScopeTest2 four times.

```log
hello ezcon Provider hook
ScopeTest1 call 1 0 0 0
ScopeTest1 call 2 0 0 0
ScopeTest1 call 3 0 0 0
ScopeTest1 call 4 0 0 0
```

---

## My migration Example 1

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
export const ezModal = ezState<ReactNode>(null)
```

```tsx
<ezModal.Provider>{props.children}</ezModal.Provider>
```

```tsx
const setNode = ezModal.useDispatch()
const node = ezModal.useValue()
```

---

## My migration Example 2 `ezCombineProvider`

### before

```tsx
export const ctxPBL = {
  summaryArr: createContext<nsPageBoard.Summary[]>([]),
  pageItemArr: createContext<nsPageBoard.PageItem[]>([]),
  refetch: createContext(() => {}),
} as const;

export const ProviderPBL = (props: { children: ReactNode }) => {
  // ...
  useEffect(() => {
    // ...
  }, [...]);

  const q = useQueryGet(...);
  const summaryArr: nsPageBoard.Summary[] = q.data?.summaryArr ?? [];
  const pageItemArr: nsPageBoard.PageItem[] = q.data?.pageItemArr ?? [];
  return (
    <ctxPBL.summaryArr.Provider value={summaryArr}>
      <ctxPBL.pageItemArr.Provider value={pageItemArr}>
        <ctxPBL.refetch.Provider value={useCallback(() => q.refetch(), [q])}>
          {props.children}
        </ctxPBL.refetch.Provider>
      </ctxPBL.pageItemArr.Provider>
    </ctxPBL.summaryArr.Provider>
  );
};

```

```tsx
const pageItemArr = useContext(ctxPBL.pageItemArr)
const summaryArr = useContext(ctxPBL.summaryArr)
const pblRefetch = useContext(ctxPBL.refetch)
```

### after

```tsx
export const ezPBL = {
  summaryArr: ezState<nsPageBoard.Summary[]>([]),
  pageItemArr: ezState<nsPageBoard.PageItem[]>([]),
  refetch: ezRef(() => {}),
} as const;


// ezCombineProvider
export const ProviderPBL = ezCombineProvider(
  [ezPBL.summaryArr, ezPBL.pageItemArr, ezPBL.refetch],
  // Hook to run when the provider is registered.
  () => {
    // ...
    useEffect(() => {
      // ...
    }, [...]);

    const q = useQueryGet(...);

    // ezState
    const dispatchSummaryArr = ezPBL.summaryArr.useDispatch();
    const disPatchPageItemArr = ezPBL.pageItemArr.useDispatch();
    useEffect(() => {
      if (q.data) {
        dispatchSummaryArr(q.data.summaryArr ?? []);
        disPatchPageItemArr(q.data.pageItemArr ?? []);
      }
    }, [q.data, disPatchPageItemArr, dispatchSummaryArr]);

    // ezRef
    ezPBL.refetch.useMutableRefObject().current = q.refetch;

);
```

```tsx
const summaryArr = ezPBL.summaryArr.useValue()
const pageItemArr = ezPBL.pageItemArr.useValue()
const refetchPBL = ezPBL.refetch.useMutableRefObject().current
```

---

## My migration Example 3 `useState`

### after

```tsx
export const ezMyTheme = {
  theme: ezState<MyTheme>(factoryMyTheme(null)),
  toggle: ezRef<() => void>(() => {})
} as const

export const ProviderMyTheme = ezCombineProvider(
  [ezMyTheme.theme, ezMyTheme.toggle],
  () => {
    const [myThemeMode, setMyThemeMode] = useState<MyThemeMode>(null) // useState

    ezMyTheme.toggle.useMutableRefObject().current = () => {
      setMyThemeMode((p) =>
        p === null || p === 'light mode' ? 'dark mode' : 'light mode'
      )
    }

    const dispatchMyTheme = ezMyTheme.theme.useDispatch()
    useEffect(() => {
      if (myThemeMode === null) {
        const value = localStorage.getItem(MyLsKey.myThemeMode)
        switch (value) {
          case 'dark mode':
            setMyThemeMode('dark mode')
            break
          case 'light mode':
          default:
            setMyThemeMode('light mode')
            break
        }
      } else {
        localStorage.setItem(MyLsKey.myThemeMode, myThemeMode)
        dispatchMyTheme(factoryMyTheme(myThemeMode))
      }
    }, [myThemeMode, dispatchMyTheme])
  }
)
```

## License

MIT © [stacew](https://github.com/stacew)
