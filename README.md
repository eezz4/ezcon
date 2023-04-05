# ezcon

react easy context `(ez con)`

- I made this for my personal use, but distribute it because I think it's useful.
- I haven't used it yet, so I don't know if there are any bugs.
- You can use `scope Providers`.
- You can probably use any `combination of Providers`.
- I made it so that providers would throw an error if they were nested.
- The parameter will be type inferred based on the `'useState'` and `'useRef'`.
- I like the name because it's easier than recoil.

[![NPM](https://img.shields.io/npm/v/ezcon.svg)](https://www.npmjs.com/package/ezcon) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save ezcon
```

## Usage 1 : `ezcon`

```tsx
import { ezcon } from 'ezcon'

const state1 = ezcon('useState', () => 0)

export function App() {
  return (
    <state1.Provider>
      <TestPage1 />
      <TestPage2 />
    </state1.Provider>
  )
}

function TestPage1() {
  const value1 = state1.useValue()
  console.log('TestPage1 call', value1)
  return <div>{value1}</div>
}

function TestPage2() {
  const dispatch1 = state1.useDispatch()
  console.log('TestPage2 call')
  return <button onClick={() => dispatch1((p) => p + 1)} />
}
```

##### Click the button 4 times

```log
TestPage1 call 1
TestPage1 call 2
TestPage1 call 3
TestPage1 call 4
```

## Usage 2 : `ezconProviderCombine()`

```tsx
import { ezcon, ezconProviderCombine } from './ezcon'

export const state1 = ezcon('useState', () => 0)
export const state2 = ezcon('useState', () => 0)
export const state3 = ezcon('useState', () => 0)
export const ref1 = ezcon('useRef', () => 0)
export const TestPagesCombineProvider = ezconProviderCombine(
  state1,
  state2,
  state3,
  ref1
)

export function App() {
  return (
    <>
      <TestPagesCombineProvider>
        <TestPage1 />
        <TestPage2 />
      </TestPagesCombineProvider>
      <OtherPage />
    </>
  )
}
```

```tsx
function TestPage1() {
  const value1 = state1.useValue()
  const value2 = state2.useValue()
  const value3 = state3.useValue()
  const mutableRef1 = ref1.useRef()
  console.log('TestPage1 call', value1, value2, value3, mutableRef1.current)
  return <div />
}
function TestPage2() {
  // const value1 = state1.useValue();
  const value2 = state2.useValue()
  const value3 = state3.useValue()
  const mutableRef1 = ref1.useRef()
  const dispatch1 = state1.useDispatch()
  console.log('TestPage2 call')
  return <button onClick={() => dispatch1((p) => p + 1)} />
}
function OtherPage() {
  const value1 = state1.useValue()
  const value2 = state2.useValue()
  const value3 = state3.useValue()
  const mutableRef1 = ref1.useRef()
  console.log('OtherPage call')
  return <div />
}
```

##### Click the button 4 times

```log
TestPage1 call 1 0 0 0
TestPage1 call 2 0 0 0
TestPage1 call 3 0 0 0
TestPage1 call 4 0 0 0
```

## License

MIT © [stacew](https://github.com/stacew)
