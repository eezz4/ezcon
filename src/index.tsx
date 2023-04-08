import React, { createContext, useContext, useRef, useState } from 'react'

interface ProviderInterface {
  (props: { children: React.ReactNode }): JSX.Element
}

/**
 * @description Provider & useValue & useDispatch
 */
export function ezState<IV>(initialState: IV | (() => IV)) {
  const contextValue = createContext<IV>(
    typeof initialState === 'function'
      ? (initialState as () => IV)()
      : initialState
  )
  const contextDispatch = createContext<
    React.Dispatch<React.SetStateAction<IV>>
  >(() => {
    throw new Error('Dispatch function not provided')
  })

  const contextNestedChecker = createContext(false)
  const Provider: ProviderInterface = (props: {
    children: React.ReactNode
  }) => {
    if (useContext(contextNestedChecker))
      throw new Error('The same provider is being used nested.')

    const state = useState(initialState)
    return (
      <contextNestedChecker.Provider value>
        <contextValue.Provider value={state[0]}>
          <contextDispatch.Provider value={state[1]}>
            {props.children}
          </contextDispatch.Provider>
        </contextValue.Provider>
      </contextNestedChecker.Provider>
    )
  }
  return {
    Provider,
    useValue: () => useContext(contextValue),
    useDispatch: () => useContext(contextDispatch)
  }
}

/**
 * @description Provider & useMutableRefObject
 */
export function ezRef<IV>(initialValue: IV) {
  const contextRef = createContext<React.MutableRefObject<IV>>({
    current: initialValue
  })

  const contextNestedChecker = createContext(false)
  const Provider: ProviderInterface = (props: {
    children: React.ReactNode
  }) => {
    if (useContext(contextNestedChecker))
      throw new Error('The same provider is being used nested.')

    return (
      <contextNestedChecker.Provider value>
        <contextRef.Provider value={useRef(initialValue)}>
          {props.children}
        </contextRef.Provider>
      </contextNestedChecker.Provider>
    )
  }
  return {
    Provider,
    useMutableRefObject: () => useContext(contextRef)
  }
}

/**
 * @description combine the `Provider`s of ezcons.
 * @param useProviderCombine When the provider is registered, register `a custom hook to run`. If none, use `() => undefined`.
 */
export function ezCombineProvider(
  useProviderCombine: () => void,
  ...ezcons: { Provider: ProviderInterface }[]
) {
  return function (props: { children: React.ReactNode }) {
    return <RecursionProvider _ezcons={ezcons} />

    function RecursionProvider(props: {
      _ezcons: { Provider: ProviderInterface }[]
    }) {
      if (props._ezcons.length === 0) return <TerminalProvider />
      const LeftProvider = props._ezcons[0].Provider
      return (
        <LeftProvider>
          <RecursionProvider _ezcons={props._ezcons.slice(1)} />
        </LeftProvider>
      )
    }

    function TerminalProvider() {
      useProviderCombine()
      return <React.Fragment>{props.children}</React.Fragment>
    }
  }
}
