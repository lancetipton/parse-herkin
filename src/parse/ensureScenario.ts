import type { TFeatureAst, TScenarioAst, TRuleAst } from '../types'

import { exists } from '@keg-hub/jsutils'
import { EFeatureTypes } from '../types'
import { shortId } from '../utils/shortId'
import { getRXMatch, getStartWhiteSpace } from '../utils/helpers'

/**
 * Regular expressions for matching feature file keywords
 * @type {object}
 */
const RX_SCENARIO = /^\s*Scenario:(.*)$/
const RX_EXAMPLE = /^\s*Example:(.*)$/

/*
 * Helper factory function to build a scenario object
 * @function
 *
 */
export const scenarioFactory = (
  scenario:string|false,
  index?:number
) => {
  return {
    index,
    scenario,
    tags: [],
    steps: [],
    ...(scenario && { uuid: shortId(index) }),
  } as TScenarioAst
}


/**
 * Check for new feature scenario, and add scenario to feature object
 * @function
 *
 */
export const ensureScenario = (
  feature:TFeatureAst,
  rule:TRuleAst,
  scenario:TScenarioAst,
  line:string,
  index:number
) => {

  // Check for "Scenario:" or "Example:" keywords
  const hasScenario = RX_SCENARIO.test(line)
  const hasExample = RX_EXAMPLE.test(line)
  if (!hasScenario && !hasExample) return scenario

  // Check for "Scenario:", if not found then check for "Example:"
  const scenarioText = hasScenario
    ? getRXMatch(line, RX_SCENARIO, 1)
    : getRXMatch(line, RX_EXAMPLE, 1)

  // Check if the scenario text was already added, and add it if needed
  // Otherwise create a new scenario with the scenario text
  !exists(scenario.scenario)
    ? (scenario.scenario = scenarioText)
    : (scenario = scenarioFactory(scenarioText, index))

  // Ensure the line index is added
  !scenario.index && (scenario.index = index)
  // Add the uuid from the scenario text if it doesn't exist
  !scenario.uuid && (scenario.uuid = shortId(index))

  // Get the start whitespace, used when assembling the feature
  scenario.whitespace = getStartWhiteSpace(line)

  // If Example keyword is used, set the alias
  if(!hasScenario) scenario.alias = EFeatureTypes.Example

  // Check if rule has a uuid
  // And if the scenario whitespace is more then the rule
  // In that case add it to the rule
  // Otherwise add it to the feature 
  const parent = rule.uuid && scenario.whitespace > rule.whitespace
    ? rule
    : feature

  !parent.scenarios.includes(scenario)
    && parent.scenarios.push(scenario)

  return scenario
}