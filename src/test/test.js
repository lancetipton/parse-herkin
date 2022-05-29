import { run } from './run'
import { noOp, noOpObj, isStr, checkCall } from '@keg-hub/jsutils'
import {
  Types,
  createItem,
  throwError,
  helperTypes,
  validateHelper,
} from './utils'

export class ParkinTest {
  timeout = 6000
  #specDone = noOp
  #suiteDone = noOp
  #specStarted = noOp
  #suiteStarted = noOp

  #activeParent = undefined
  #testOnly = false
  #describeOnly = false
  #root = createItem(Types.root, { describes: [] }, false)

  constructor(config = noOpObj) {
    this.#root.description = config.description || `root`

    Object.values(helperTypes).map(type => (this.#root[type] = []))

    this.#addOnly()
    this.#addSkip()
    this.#addHelpers()
    this.it = this.test
    this.xit = this.xtest
    this.#activeParent = this.#root
    this.#addFrameworkHooks(config)

    this.run = (config = noOpObj) => {
      this.#root.description = config.description || this.#root.description
      this.#addFrameworkHooks(config)
      return run({
        root: this.#root,
        testOnly: this.#testOnly,
        specDone: this.#specDone,
        suiteDone: this.#suiteDone,
        specStarted: this.#specStarted,
        describeOnly: this.#describeOnly,
        suiteStarted: this.#suiteStarted,
      })
    }
  }

  getActiveParent = () => {
    return this.#activeParent
  }

  #addFrameworkHooks = ({
    timeout,
    specDone,
    suiteDone,
    specStarted,
    suiteStarted,
  }) => {
    if (timeout) this.timeout = timeout
    if (specDone) this.#specDone = specDone
    if (suiteDone) this.#suiteDone = suiteDone
    if (specStarted) this.#specStarted = specStarted
    if (suiteStarted) this.#suiteStarted = suiteStarted
  }

  /**
   * Adds the only method to describe and test methods
   * Ensures they are the only methods called when run
   */
  #addOnly = () => {
    this.describe.only = (...args) => {
      this.describe(...args)
      // Get the last item just added to the this.#activeParent
      const item =
        this.#activeParent.describes[this.#activeParent.describes.length - 1]
      item.only = true
      this.#describeOnly = true
      // Call the parent hasOnlyChild method to ensure it gets passed on the chain
      checkCall(this.#activeParent.hasOnlyChild)
    }

    this.test.only = (...args) => {
      this.test(...args)
      // Get the last item just added to the this.#activeParent
      const item = this.#activeParent.tests[this.#activeParent.tests.length - 1]
      item.only = true
      this.#testOnly = true
      // Call the parent hasOnlyChild method to ensure it gets passed on the chain
      checkCall(this.#activeParent.hasOnlyChild)
    }
  }

  /**
   * Adds the skip method to describe and test methods
   * Ensures they are skipped run method is called
   */
  #addSkip = () => {
    this.describe.skip = (...args) => {
      this.describe(...args)
      // Get the last item just added to the this.#activeParent
      const item =
        this.#activeParent.describes[this.#activeParent.describes.length - 1]
      item.skip = true
    }

    this.test.skip = (...args) => {
      this.test(...args)
      // Get the last item just added to the this.#activeParent
      const item = this.#activeParent.tests[this.#activeParent.tests.length - 1]
      item.skip = true
    }
  }

  /**
   * TODO: @lance-Tipton
   * Add each methods to describe and test
   */
  #addEach = () => {}

  /**
   * Adds the helper methods to the class instance
   * Methods: beforeAll, beforeEach, afterAll, afterEach
   */
  #addHelpers = () => {
    Object.values(helperTypes).map(type => {
      this[type] = action => {
        validateHelper(type, action, this.#activeParent)
        this.#activeParent[type].push(action)
      }
    })
  }

  /**
   * Method the wraps test and helper methods
   * Acts as a top level method for defining tests
   * @param {string} description - Metadata about the describe
   * @param {function} action - Function to call for the describe
   *
   * @returns {void}
   */
  describe = (description, action) => {
    // Build the describe item and add defaults
    const item = createItem(Types.describe, {
      action,
      tests: [],
      description,
      describes: [],
    })
    item.disabled = () => (item.skip = true)

    Object.values(helperTypes).map(type => (item[type] = []))
    this.#activeParent.describes.push(item)

    // Cache the lastParent, so we can reset it
    const lastParent = this.#activeParent

    item.hasOnlyChild = () => {
      item.onlyChild = true
      checkCall(lastParent.hasOnlyChild)
    }

    // Set the current activeParent to the item
    this.#activeParent = item

    // Call the action to register all test method calls while the items active
    action()

    // Reset the last activeParent
    // Should end up with the #root being the final activeParent
    this.#activeParent = lastParent
  }

  /**
   * Method that executes some test logic
   * Must be called within a Test#describe method
   * @param {string} description - Metadata about the test
   * @param {function} action - Function to call for the test
   *
   * @returns {void}
   */
  test = (description, action, timeout) => {
    if (!this.#activeParent || this.#activeParent.type === Types.root)
      throwError(
        `All ${Types.test} method calls must be called within a ${Types.describe} method`
      )

    const item = createItem(Types.test, { action, timeout, description })
    item.disabled = () => (item.skip = true)

    this.#activeParent.tests.push(item)
  }

  /**
   * Called when a test method should be skipped
   * Must be called within a Test#describe method
   * @param {string} description - Metadata about the test
   *
   * @returns {void}
   */
  xtest = description => {
    if (!this.#activeParent || this.#activeParent.type === Types.root)
      throwError(
        `All ${Types.test} method calls must be called within a ${Types.describe} method`
      )

    !isStr(description) &&
      throwError(
        `The ${Types.test} method requires a "string" as the first argument`
      )
    const item = createItem(Types.test, { description, skip: true }, false)
    item.disabled = () => (item.skip = true)

    this.#activeParent.tests.push(item)
  }
}
