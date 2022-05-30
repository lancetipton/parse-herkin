import { isObj } from '@keg-hub/jsutils'
import { Types, validateRootRun } from './utils'

/**
 * Builds a run result base on the passed in arguments
 * @param {Object} item - describe or test object
 * @param {Object} metadata - Metadata of the test run
 *
 * @returns {Object} - Built run result object
 */
const runResult = (
  item,
  { id, fullName, action, failed, passed, testPath }
) => {
  const result = {
    id,
    action,
    testPath,
    fullName,
    type: item.type,
    failedExpectations: [],
    passedExpectations: [],
    failed: Boolean(failed),
    passed: Boolean(passed),
    description: item.description,
    timestamp: new Date().getTime(),
  }

  isObj(failed) && result.failedExpectations.push(failed)
  isObj(passed) && result.passedExpectations.push(passed)
  if (passed || failed) result.status = passed ? `passed` : `failed`

  return result
}

/**
 * Helper to loop over hooks and call them
 * @param {Object} args - Data for calling the passed in hook by type
 *
 * @returns {Object} - Built run result object if a hook fails
 */
const loopHooks = async args => {
  const { type, test, specId, suiteId, describe, root } = args

  let hookIdx
  const activeItem = root || describe
  const fullName = root
    ? root.description
    : test
      ? `${describe?.description} > ${test?.description} > ${type}`
      : `${describe?.description} > ${type}`

  try {
    activeItem[type].length &&
      (await Promise.all(
        activeItem[type].map((fn, idx) => {
          hookIdx = idx
          return fn()
        })
      ))
  }
  catch (error) {
    return runResult(activeItem, {
      fullName,
      action: type,
      status: 'failed',
      id: test ? specId : suiteId,
      failed: { name: error.name, message: error.message },
      testPath: test
        ? `/${suiteId}/${specId}/${type}${hookIdx}`
        : `/${suiteId}/${type}${hookIdx}`,
    })
  }
}

/**
 * Helper to loop over tests and call their test method
 * @param {Object} args - Data for calling the passed in test method
 *
 * @returns {Object} - Built run result object of the test results
 */
const loopTests = async args => {
  const { suiteId, describe, testOnly, specDone, specStarted } = args

  let describeFailed = false
  const results = []

  // ------ describe - loop tests ------ //
  for (let testIdx = 0; testIdx < describe.tests.length; testIdx++) {
    const test = describe.tests[testIdx]
    const specId = `spec${testIdx}`
    const testPath = `/${suiteId}/${specId}`
    const fullName = `${describe.description} > ${test.description}`

    let testResult = runResult(test, {
      fullName,
      testPath,
      id: specId,
      action: 'start',
    })

    if ((testOnly && !test.only) || test.skip) {
      specStarted({
        ...testResult,
        skipped: true,
        action: 'skipped',
        status: 'skipped',
      })
      continue
    }
    else specStarted(testResult)

    const beforeEachResult = await loopHooks({
      test,
      specId,
      suiteId,
      describe,
      type: Types.beforeEach,
    })
    if (beforeEachResult) {
      describeFailed = true
      results.push(beforeEachResult)
      specDone(beforeEachResult)
      break
    }

    // ------ execute test ------ //
    try {
      const result = await test.action()
      testResult = runResult(test, {
        fullName,
        id: specId,
        testPath: testPath,
        action: Types.test,
        passed: result || true,
      })
    }
    catch (error) {
      testResult = runResult(test, {
        fullName,
        id: specId,
        action: Types.test,
        testPath: testPath,
        failed: { name: error.name, message: error.message },
      })
      describeFailed = true
    }

    const afterEachResult = await loopHooks({
      test,
      specId,
      suiteId,
      describe,
      type: Types.afterEach,
    })
    if (afterEachResult) {
      describeFailed = true
      results.push(afterEachResult)
      specDone(afterEachResult)
      break
    }

    results.push(testResult)
    specDone({ ...testResult, action: 'end' })
  }

  return {
    tests: results,
    failed: describeFailed,
  }
}

/**
 * Helper to call the before hooks from the root and current describe
 * @param {Object} args - Arguments needed to call the before hooks
 *
 * @returns {Object} - Built results if a hook throws an error
 */
const callBeforeHooks = async ({ root, suiteId, describe }) => {
  const beforeEachResult = await loopHooks({
    root,
    suiteId: Types.root,
    type: Types.beforeEach,
  })

  const beforeAllResult =
    !beforeEachResult &&
    (await loopHooks({
      suiteId,
      describe,
      type: Types.beforeAll,
    }))

  return beforeEachResult || beforeAllResult
}

/**
 * Helper to call the after hooks from the root and current describe
 * @param {Object} args - Arguments needed to call the after hooks
 *
 * @returns {Object} - Built results if a hook throws an error
 */
const callAfterHooks = async ({ root, suiteId, describe }) => {
  const afterEachResult = await loopHooks({
    root,
    suiteId: Types.root,
    type: Types.afterEach,
  })

  const afterAllResult =
    !afterEachResult &&
    (await loopHooks({
      suiteId,
      describe,
      type: Types.afterAll,
    }))

  return afterEachResult || afterAllResult
}

/**
 * Helper to loop over describe methods and call child tests
 * @param {Object} args - Config to overwrite the initial test config object
 *
 * @returns {Object} - Built run results of the test results
 */
const loopDescribes = async args => {
  const {
    root,
    testOnly,
    specDone,
    suiteDone,
    specStarted,
    parentIdx = ``,
    suiteStarted,
    describeOnly,
  } = args

  let describeFailed = false
  const results = []

  // ------ loop describes ------ //
  for (let idx = 0; idx < root.describes.length; idx++) {
    const describe = root.describes[idx]
    const suiteId = `suite-${parentIdx}${idx}`
    let describeResult = runResult(describe, {
      id: suiteId,
      action: 'start',
      testPath: `/${suiteId}`,
      fullName: describe.description,
    })

    const shouldSkip =
      describe.skip ||
      (describeOnly && !describe.only && !describe.onlyChild) ||
      (testOnly && !describe.onlyChild)

    if (shouldSkip) {
      suiteStarted({
        ...describeResult,
        skipped: true,
        action: 'skipped',
        status: 'skipped',
      })
      continue
    }
    else suiteStarted(describeResult)

    const beforeResult = await callBeforeHooks({
      root,
      suiteId,
      describe,
    })
    if (beforeResult) {
      describeFailed = true
      describeResult = { ...describeResult, ...beforeResult }
      suiteDone(describeResult)
      results.push(describeResult)
      continue
    }

    const testResults = await loopTests({
      suiteId,
      describe,
      testOnly,
      specDone,
      specStarted,
    })

    const describesResults =
      describe.describes &&
      describe.describes.length &&
      (await loopDescribes({
        ...args,
        root: describe,
        parentIdx: `${idx}-`,
      }))

    describeResult = {
      ...describeResult,
      ...describesResults,
      action: 'end',
      tests: testResults.tests,
    }

    if (testResults.failed || describesResults.failed) {
      describeFailed = true
      describeResult.failed = true
    }
    else describeResult.passed = true

    const afterResult = await callAfterHooks({
      root,
      suiteId,
      describe,
    })
    if (afterResult) {
      describeFailed = true
      describeResult = { ...describeResult, ...afterResult }
      suiteDone(describeResult)
      results.push(describeResult)
      continue
    }

    suiteDone(describeResult)
    results.push(describeResult)
  }

  return { describes: results, failed: describeFailed }
}

/**
 * Executes all methods registered to the ParkinTest instance
 * @param {Object} args - Config to overwrite the initial test config object
 *
 * @returns {Object} - Results of the test run
 */
export const run = async args => {
  validateRootRun(args.root)

  const beforeAllResult = await loopHooks({
    root: args.root,
    suiteId: Types.root,
    type: Types.beforeAll,
  })

  // If a before all throws an error, we don't want to run the rest of the tests, so just return
  if (beforeAllResult) return [beforeAllResult]

  const { describes } = await loopDescribes(args)

  const afterAllResult = await loopHooks({
    root: args.root,
    suiteId: Types.root,
    type: Types.afterAll,
  })
  afterAllResult && describes.push(afterAllResult)

  return describes
}