export const feature = `@search @google
Feature: Google Search
  As an internet user
  In order to find out more about Keg-Hub
  # Test comment in the feature meta
  I want to be able to search for information about the Keg-Hub

  Scenario: Search the web for google
    Given I open the site https://www.google.com
    When I set keg-hub to the input .gLFyf
    When I press enter
    # comment for testing in the scenario steps
    When I wait for the page to load
    Then the element #search contains the text simpleviewinc/keg-hub`

export const featureWithScenarioTags = `@search @google
  Feature: Google Search
    As an internet user
    In order to find out more about Keg-Hub
    # Test comment in the feature meta
    I want to be able to search for information about the Keg-Hub
  
    @scenario
    Scenario: Search the web for google
      Given I open the site https://www.google.com
      When I set keg-hub to the input .gLFyf
      When I press enter
      # comment for testing in the scenario steps
      When I wait for the page to load
      Then the element #search contains the text simpleviewinc/keg-hub`

export const parsedFeature = {
  index: 1,
  // The uuid is different every time, so comment it out for testing
  // uuid: 'b33c24bf-3b5d-4375-9853-600b1a3c383e',
  content:
    '@search @google\n' +
    'Feature: Google Search\n' +
    '  As an internet user\n' +
    '  In order to find out more about Keg-Hub\n' +
    '  # Test comment in the feature meta\n' +
    '  I want to be able to search for information about the Keg-Hub\n' +
    '\n' +
    '  Scenario: Search the web for google\n' +
    '    Given I open the site https://www.google.com\n' +
    '    When I set keg-hub to the input .gLFyf\n' +
    '    When I press enter\n' +
    '    # comment for testing in the scenario steps\n' +
    '    When I wait for the page to load\n' +
    '    Then the element #search contains the text simpleviewinc/keg-hub',
  feature: 'Google Search',
  tags: [ '@search', '@google' ],
  reason: [{ content: 'In order to find out more about Keg-Hub', index: 3 }],
  comments: [
    // Comments are stored globally, so we keep the full white space of it
    // This allows us to format it relative to adjoining lines
    { content: '  # Test comment in the feature meta', index: 4 },
    { content: '    # comment for testing in the scenario steps', index: 11 },
    // { content: 'Test comment in the feature meta', index: 4 },
    // { content: 'comment for testing in the scenario steps', index: 11 }
  ],
  perspective: { content: 'As an internet user', index: 2 },
  desire: {
    content: 'I want to be able to search for information about the Keg-Hub',
    index: 5,
  },
  scenarios: [
    {
      index: 7,
      scenario: 'Search the web for google',
      tags: [],
      // uuid: 'f75d10d8-645c-4da0-b4b2-70696e3588b3',
      steps: [
        {
          step: 'I open the site https://www.google.com',
          type: 'given',
          // uuid: 'c257a2b9-2f34-42ac-b7e2-da4a843bc8ef',
          index: 8,
        },
        {
          step: 'I set keg-hub to the input .gLFyf',
          type: 'when',
          // uuid: '2755d856-c6a9-41b2-bd63-508c2177011e',
          index: 9,
        },
        {
          step: 'I press enter',
          type: 'when',
          // uuid: 'bb6b22bb-2555-49f6-8c5a-a0c1e8a22246',
          index: 10,
        },
        {
          step: 'I wait for the page to load',
          type: 'when',
          // uuid: '29ecb393-ec1c-407d-abbb-a6f82049a286',
          index: 12,
        },
        {
          step: 'the element #search contains the text simpleviewinc/keg-hub',
          type: 'then',
          // uuid: '22f11b4f-2c45-4599-842f-58454dab6a12',
          index: 13,
        },
      ],
    },
  ],
}

export const promiseFeature = `@promises
Feature: Test Promises
  Scenario: Test definitions with promises 
    Given I wait for 1000
    Then the world test method should be called
`

export const failStepFeature = `@step @fail
Feature: Step Fails
  Scenario: Skip scenario steps when a step fails
    Given that the default describe is overwritten
    And this step fails
    Then this step should be skipped
    And this step should also be skipped
`

export const backgroundFeature = `@background
Feature: Background steps
  # This is a test comment
  Background:
    Given that background exists
    Then the background steps should be called before each scenario

  Scenario: Run scenario after the background
    Given that this Feature has a background
    Then this scenario's steps should be run after the background's steps

  Scenario: Run second scenario after a second background
    Given that a second scenario exists
    Then the second scenario's steps should be run after a second background's steps
`

export const testCommentsFeature = `Feature: Test
  # This is a test comment
  Background:
    Given I open the site "https://www.google.com"

  Scenario: Search the google for keg-hub
    When I set "keg-hub" to the input ".gLFyf"
    When I press the key "enter"
    When I wait for the page to load
    Then the element "#search" contains the text "simpleviewinc/keg-hub"
    
  Scenario: Search the google for parkin
    When I set "@ltipton/parkin" to the input ".gLFyf"
    When I press the key "enter"
    When I wait for the page to load
    Then the element "#search" contains the text "parkin"
`

export const stepsFeature = `
Feature: Parse Steps

  Scenario: Parse step with doc-string ticks
    Given I have the following doc-string data in ticks
      \`\`\`
        Test tick data to be parsed
      \`\`\`
    Then the doc-string data should be "Test tick data to be parsed"

  Scenario: Parse step with doc-string quotes
    Given I have the following doc-string data in quotes
      """
        Test quote data to be parsed
      """
    Then the doc-string data should be "Test quote data to be parsed"
`