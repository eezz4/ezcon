import React, { createContext, useContext, useRef, useState } from 'react'

type EzconInitFunc<IV> = () => IV

interface ProviderInterface {
  (props: { children: React.ReactNode }): JSX.Element
}

type EzconFactoryType = 'useState' | 'useRef'

type EzconFactoryReturn<IV, EFT> = EFT extends 'useState'
  ? EzconReturnUseState<IV>
  : EzconReturnUseRef<IV>

type EzconReturnUseState<IV> = {
  Provider: ProviderInterface
  useValue: () => IV | null
  useDispatch: () => React.Dispatch<React.SetStateAction<IV>>
}
type EzconReturnUseRef<IV> = {
  Provider: ProviderInterface
  useMutableRefObject: () => React.MutableRefObject<IV | null>
}

/**
 * @description
 * 1. Explanation of the Generic Abbreviation
 *    - EFT : EzconFactoryType
 *    - IV :  initValue
 * 2. Example of when you need more type extension than initial value
 *    - ezcon("useState", ()`: string | null` => null);
 *    - ezcon("useState", ()`: string[]` => []);
 */
export function ezcon<EFT extends EzconFactoryType, IV>(
  factoryType: EFT,
  initFunc: EzconInitFunc<IV>
) {
  switch (factoryType) {
    case 'useState':
      return ezconUseState(initFunc) as unknown as EzconFactoryReturn<IV, EFT>
    case 'useRef':
      return ezconUseRef(initFunc) as unknown as EzconFactoryReturn<IV, EFT>
    default:
      throw new Error(`ezcon Invalid type: "${factoryType}".`)
  }
}

function ezconUseState<IV>(initFunc: EzconInitFunc<IV>) {
  const contextValue = createContext<IV | null>(null)
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

    const state = useState(initFunc())
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

function ezconUseRef<IV>(initFunc: EzconInitFunc<IV>) {
  const contextRef = createContext<React.MutableRefObject<IV> | null>(null)

  const contextNestedChecker = createContext(false)
  const Provider: ProviderInterface = (props: {
    children: React.ReactNode
  }) => {
    if (useContext(contextNestedChecker))
      throw new Error('The same provider is being used nested.')

    return (
      <contextNestedChecker.Provider value>
        <contextRef.Provider value={useRef(initFunc())}>
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
 * @param useProviderCombine When the provider is registered, register `a custom hook to run`. If none, use `() => undefined`.
 * @description Use to combine `the providers of ezcons`.
 */
export function ezconProviderCombine<HOOK extends Function>(
  useProviderCombine: HOOK,
  ...ezcons: { Provider: ProviderInterface }[]
) {
  return function Provider(props: { children: React.ReactNode }) {
    return <RecursionProvider _ezcons={ezcons} />
    function RecursionProvider(props: {
      _ezcons: { Provider: ProviderInterface }[]
    }) {
      if (props._ezcons.length === 0) return <TerminalProvider />
      const ezcon = props._ezcons[0]
      return (
        <ezcon.Provider>
          <RecursionProvider _ezcons={props._ezcons.slice(1)} />
        </ezcon.Provider>
      )
    }
    function TerminalProvider() {
      useProviderCombine()
      return <React.Fragment>{props.children}</React.Fragment>
    }
  }
}
