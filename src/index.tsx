import React, { createContext, useContext, useRef, useState } from 'react'

interface ProviderInterface {
  (props: { children: React.ReactNode }): JSX.Element
}

const NO_PROVIDER = Symbol('ezcon: outside of a Provider')

function lazyOnce<T>(factory: () => T) {
  let cache: { ready: true; value: T } | { ready: false } = { ready: false }
  return (): T => {
    if (!cache.ready) cache = { ready: true, value: factory() }
    return cache.value
  }
}

/**
 * @description Provider & useValue & useDispatch
 */
export function ezState<IV>(initialState: IV | (() => IV)) {
  // The out-of-Provider default is computed lazily so that declaring an
  // ezState at module scope never runs the initializer at import time
  // (SSR, localStorage access, expensive computation).
  const getDefaultValue = lazyOnce(() =>
    typeof initialState === 'function'
      ? (initialState as () => IV)()
      : initialState
  )
  const contextValue = createContext<IV | typeof NO_PROVIDER>(NO_PROVIDER)
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

    // Passing initialState straight through keeps React's lazy-initializer
    // contract: a function initial state runs once per Provider mount.
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
    useValue: (): IV => {
      const value = useContext(contextValue)
      return value === NO_PROVIDER ? getDefaultValue() : value
    },
    useDispatch: () => useContext(contextDispatch)
  }
}

/**
 * @description Provider & useMutableRefObject
 */
export function ezRef<IV>(initialValue: IV) {
  const getDefaultRef = lazyOnce<React.MutableRefObject<IV>>(() => ({
    current: initialValue
  }))
  const contextRef = createContext<
    React.MutableRefObject<IV> | typeof NO_PROVIDER
  >(NO_PROVIDER)

  const contextNestedChecker = createContext(false)
  const Provider: ProviderInterface = (props: {
    children: React.ReactNode
  }) => {
    if (useContext(contextNestedChecker))
      throw new Error('The same provider is being used nested.')

    // Each Provider scope starts from initialValue, isolated from mutations
    // made on the shared out-of-Provider default ref.
    const ref = useRef(initialValue)
    return (
      <contextNestedChecker.Provider value>
        <contextRef.Provider value={ref}>{props.children}</contextRef.Provider>
      </contextNestedChecker.Provider>
    )
  }
  return {
    Provider,
    useMutableRefObject: (): React.MutableRefObject<IV> => {
      const ref = useContext(contextRef)
      return ref === NO_PROVIDER ? getDefaultRef() : ref
    }
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
