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

    const state = useState(useContext(contextValue))
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
        <contextRef.Provider value={useRef(useContext(contextRef).current)}>
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
 * @param useCombineProvider When the provider is registered, register `a custom hook to run`.
 */
export function ezCombineProvider(
  ezcons: { Provider: ProviderInterface }[],
  useCombineProvider: () => void = () => undefined
) {
  const HookRunner = (props: { children: React.ReactNode }) => {
    useCombineProvider()
    return <React.Fragment>{props.children}</React.Fragment>
  }

  const CombinedProvider: ProviderInterface = (props: {
    children: React.ReactNode
  }) => {
    return ezcons.reduceRight<JSX.Element>(
      (children, ezcon) => <ezcon.Provider>{children}</ezcon.Provider>,
      <HookRunner>{props.children}</HookRunner>
    )
  }
  return CombinedProvider
}
