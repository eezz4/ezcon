import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { ezCombineProvider, ezRef, ezState } from './index'

describe('ezState', () => {
  it('provides value and dispatch inside the Provider scope', () => {
    const ezCount = ezState(0)
    let dispatch: React.Dispatch<React.SetStateAction<number>>

    function Viewer() {
      dispatch = ezCount.useDispatch()
      return <div data-testid='value'>{ezCount.useValue()}</div>
    }
    render(
      <ezCount.Provider>
        <Viewer />
      </ezCount.Provider>
    )

    expect(screen.getByTestId('value').textContent).toBe('0')
    act(() => dispatch((p) => p + 1))
    expect(screen.getByTestId('value').textContent).toBe('1')
  })

  it('returns the initial value outside the Provider and throws on dispatch', () => {
    const ezCount = ezState(7)
    let dispatch: React.Dispatch<React.SetStateAction<number>>

    function Viewer() {
      dispatch = ezCount.useDispatch()
      return <div data-testid='value'>{ezCount.useValue()}</div>
    }
    render(<Viewer />)

    expect(screen.getByTestId('value').textContent).toBe('7')
    expect(() => dispatch(1)).toThrow('Dispatch function not provided')
  })

  it('does not call a function initial state at definition time', () => {
    const initializer = vi.fn(() => 3)
    ezState(initializer)
    expect(initializer).not.toHaveBeenCalled()
  })

  it('calls a function initial state once per Provider mount, not per render', () => {
    const initializer = vi.fn(() => 3)
    const ezCount = ezState(initializer)

    function Viewer() {
      return <div data-testid='value'>{ezCount.useValue()}</div>
    }
    const { rerender, unmount } = render(
      <ezCount.Provider>
        <Viewer />
      </ezCount.Provider>
    )
    expect(screen.getByTestId('value').textContent).toBe('3')
    expect(initializer).toHaveBeenCalledTimes(1)

    rerender(
      <ezCount.Provider>
        <Viewer />
      </ezCount.Provider>
    )
    expect(initializer).toHaveBeenCalledTimes(1)

    unmount()
    render(
      <ezCount.Provider>
        <Viewer />
      </ezCount.Provider>
    )
    expect(initializer).toHaveBeenCalledTimes(2)
  })

  it('gives each Provider scope a fresh initial object from the initializer', () => {
    const ezList = ezState(() => ({ items: [] as number[] }))
    const grabbed: { items: number[] }[] = []

    function Grabber() {
      grabbed.push(ezList.useValue())
      return null
    }
    render(
      <React.Fragment>
        <ezList.Provider>
          <Grabber />
        </ezList.Provider>
        <ezList.Provider>
          <Grabber />
        </ezList.Provider>
      </React.Fragment>
    )

    expect(grabbed[0]).not.toBe(grabbed[1])
  })

  it('computes the outside-Provider default lazily and only once', () => {
    const initializer = vi.fn(() => ({ n: 1 }))
    const ezObj = ezState(initializer)
    expect(initializer).not.toHaveBeenCalled()

    const grabbed: { n: number }[] = []
    function Grabber() {
      grabbed.push(ezObj.useValue())
      return null
    }
    render(
      <React.Fragment>
        <Grabber />
        <Grabber />
      </React.Fragment>
    )

    expect(initializer).toHaveBeenCalledTimes(1)
    expect(grabbed[0]).toBe(grabbed[1])
  })

  it('keeps state independent between sibling Provider scopes', () => {
    const ezCount = ezState(0)
    const dispatches: React.Dispatch<React.SetStateAction<number>>[] = []

    function Viewer(props: { id: string }) {
      dispatches.push(ezCount.useDispatch())
      return <div data-testid={props.id}>{ezCount.useValue()}</div>
    }
    render(
      <React.Fragment>
        <ezCount.Provider>
          <Viewer id='a' />
        </ezCount.Provider>
        <ezCount.Provider>
          <Viewer id='b' />
        </ezCount.Provider>
      </React.Fragment>
    )

    act(() => dispatches[0]((p) => p + 1))
    expect(screen.getByTestId('a').textContent).toBe('1')
    expect(screen.getByTestId('b').textContent).toBe('0')
  })

  it('throws when the same Provider is nested', () => {
    const ezCount = ezState(0)
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      render(
        <ezCount.Provider>
          <ezCount.Provider>
            <div />
          </ezCount.Provider>
        </ezCount.Provider>
      )
    ).toThrow('The same provider is being used nested.')
    spy.mockRestore()
  })
})

describe('ezRef', () => {
  it('provides an independent mutable ref per Provider scope', () => {
    const ezValue = ezRef(0)
    const refs: React.MutableRefObject<number>[] = []

    function Grabber() {
      refs.push(ezValue.useMutableRefObject())
      return null
    }
    render(
      <React.Fragment>
        <ezValue.Provider>
          <Grabber />
        </ezValue.Provider>
        <ezValue.Provider>
          <Grabber />
        </ezValue.Provider>
      </React.Fragment>
    )

    expect(refs[0]).not.toBe(refs[1])
    refs[0].current = 10
    expect(refs[1].current).toBe(0)
  })

  it('starts a Provider scope from initialValue, not the mutated global default', () => {
    const ezValue = ezRef(0)
    let globalRef!: React.MutableRefObject<number>
    let scopedRef!: React.MutableRefObject<number>

    function GlobalGrabber() {
      globalRef = ezValue.useMutableRefObject()
      return null
    }
    function ScopedGrabber() {
      scopedRef = ezValue.useMutableRefObject()
      return null
    }
    render(<GlobalGrabber />)
    globalRef!.current = 99

    render(
      <ezValue.Provider>
        <ScopedGrabber />
      </ezValue.Provider>
    )
    expect(scopedRef!.current).toBe(0)
    expect(globalRef!.current).toBe(99)
  })

  it('shares one lazily-created default ref outside any Provider', () => {
    const ezValue = ezRef(0)
    const refs: React.MutableRefObject<number>[] = []

    function Grabber() {
      refs.push(ezValue.useMutableRefObject())
      return null
    }
    render(
      <React.Fragment>
        <Grabber />
        <Grabber />
      </React.Fragment>
    )

    expect(refs[0]).toBe(refs[1])
  })

  it('throws when the same Provider is nested', () => {
    const ezValue = ezRef(0)
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      render(
        <ezValue.Provider>
          <ezValue.Provider>
            <div />
          </ezValue.Provider>
        </ezValue.Provider>
      )
    ).toThrow('The same provider is being used nested.')
    spy.mockRestore()
  })
})

describe('ezCombineProvider', () => {
  it('provides all combined scopes and runs the custom hook', () => {
    const ezA = ezState(1)
    const ezB = ezRef('b')
    const hook = vi.fn()
    const Combined = ezCombineProvider([ezA, ezB], hook)

    function Viewer() {
      return (
        <div data-testid='value'>
          {ezA.useValue()}
          {ezB.useMutableRefObject().current}
        </div>
      )
    }
    render(
      <Combined>
        <Viewer />
      </Combined>
    )

    expect(screen.getByTestId('value').textContent).toBe('1b')
    expect(hook).toHaveBeenCalled()
  })

  it('keeps provider state when the parent re-renders (no remount)', () => {
    const ezCount = ezState(0)
    const Combined = ezCombineProvider([ezCount])

    function Counter() {
      const value = ezCount.useValue()
      const dispatch = ezCount.useDispatch()
      return (
        <button data-testid='count' onClick={() => dispatch((p) => p + 1)}>
          {value}
        </button>
      )
    }
    function Parent() {
      const [, setTick] = React.useState(0)
      return (
        <React.Fragment>
          <button
            data-testid='rerender'
            onClick={() => setTick((p) => p + 1)}
          />
          <Combined>
            <Counter />
          </Combined>
        </React.Fragment>
      )
    }
    render(<Parent />)

    fireEvent.click(screen.getByTestId('count'))
    expect(screen.getByTestId('count').textContent).toBe('1')

    fireEvent.click(screen.getByTestId('rerender'))
    expect(screen.getByTestId('count').textContent).toBe('1')
  })

  it('renders children directly when the ezcon list is empty', () => {
    const Combined = ezCombineProvider([])
    render(
      <Combined>
        <div data-testid='child'>ok</div>
      </Combined>
    )
    expect(screen.getByTestId('child').textContent).toBe('ok')
  })
})
