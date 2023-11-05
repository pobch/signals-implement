// ! credit: https://www.thisdot.co/blog/deep-dive-into-how-signals-work-in-solidjs/

/**
 * This project is an example on how to easily create your own
 * signals. It's meant to create a better understanding how signals
 * and effects work and how to use them in your project.
 */

// Start of the core functionality
let current

function createSignal(initialValue) {
  let value = initialValue
  const observers = []

  const getter = () => {
    if (current && !observers.includes(current)) {
      observers.push(current)
    }
    return value
  }
  const setter = (newValue) => {
    value = newValue
    observers.forEach((fn) => fn())
  }

  return [getter, setter]
}

function createEffect(fn) {
  current = fn
  fn()
  current = undefined
}

/**
 * Stores are like signals, but use the Proxy API to register the
 * getter and setter we know from signals, on objects.
 *
 * Note that the interface does not match that of Solid.
 */
function createStore(base) {
  const observers = []
  const storeHandler = {
    get(target, prop) {
      if (current && !observers.includes(current)) {
        observers.push(current)
      }
      return target[prop]
    },
    set(target, prop, value) {
      target[prop] = value
      observers.forEach((fn) => fn())
    },
  }

  const value = new Proxy(base, storeHandler)
  return [value]
}

// End of functionality

/**
 * Example console app
 *
 * It renders components to the console using the observer-pattern
 * through the signals and effects we have created.
 * To simulate user interaction we inject a `handleClick` function
 * in the renderer which is bound to that component instance.
 */
const [globalCount, setGlobalCount] = createSignal(3)

function MyComponent() {
  const [profiles] = createStore({ one: { id: 'one' }, two: { id: 'two' } })
  const [localCount, setLocalCount] = createSignal(30)

  const renderer = () =>
    'The global count is ' +
    globalCount() +
    ', local count is ' +
    localCount() +
    ' and profiles.one.id is ' +
    profiles.one.id
  renderer.handleClick = () => (profiles.one = { id: 'newOne' })
  renderer.setLocalCount = setLocalCount
  return renderer
}

const myComponentRenderer1 = MyComponent()
const myComponentRenderer2 = MyComponent()
createEffect(() => {
  console.log('Comp #1:', myComponentRenderer1())
})
createEffect(() => {
  console.log('Comp #2:', myComponentRenderer2())
})

// User interaction
console.log('----- going to click in Comp #1 -----')
myComponentRenderer1.handleClick()
console.log("----- going to set Comp #1's local count = 50 -----")
myComponentRenderer1.setLocalCount(50)
console.log('----- going to set global count = 5 -----')
setGlobalCount(5)
