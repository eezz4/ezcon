import React, { createContext, useContext, useRef, useState } from 'react'

type EzconInitFunc<InitValue> = () => InitValue

interface ProviderInterface {
  (props: { children: React.ReactNode }): JSX.Element
}

type EzconFactoryType = 'useState' | 'useRef'

type EzconFactoryReturn<
  EzconType extends EzconFactoryType,
  InitValue
> = EzconType extends 'useState'
  ? EzconReturnUseState<InitValue>
  : EzconReturnUseRef<InitValue>

type EzconReturnUseState<InitValue> = {
  Provider: ProviderInterface
  useValue: () => InitValue | undefined
  useDispatch: () => React.Dispatch<React.SetStateAction<InitValue>>
}
type EzconReturnUseRef<InitValue> = {
  Provider: ProviderInterface
  useMutableRefObject: () => React.MutableRefObject<InitValue | undefined>
}

export function ezcon<EzconType extends EzconFactoryType, InitValue>(
  type: EzconType,
  initFunc: EzconInitFunc<InitValue>
) {
  switch (type) {
    case 'useState':
      return ezconUseState(initFunc) as unknown as EzconFactoryReturn<
        EzconType,
        InitValue
      >
    case 'useRef':
      return ezconUseRef(initFunc) as unknown as EzconFactoryReturn<
        EzconType,
        InitValue
      >
    default:
      throw new Error(`ezcon Invalid type: "${type}".`)
  }
}

function ezconUseState<InitValue>(initFunc: EzconInitFunc<InitValue>) {
  const contextValue = createContext<InitValue | undefined>(undefined)
  const contextDispatch = createContext<
    React.Dispatch<React.SetStateAction<InitValue>>
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

function ezconUseRef<InitValue>(initFunc: EzconInitFunc<InitValue>) {
  const contextRef = createContext<
    React.MutableRefObject<InitValue | undefined>
  >({
    current: undefined
  })

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

export function ezconProviderCombine(
  ...ezcons: { Provider: ProviderInterface }[]
) {
  return (props: { children: React.ReactNode }) => {
    if (ezcons.length === 0)
      return <React.Fragment>{props.children}</React.Fragment>

    const ezcon = ezcons[0]
    return (
      <ezcon.Provider>
        {ezconProviderCombine(...ezcons.slice(1))({ children: props.children })}
      </ezcon.Provider>
    )
  }
}
