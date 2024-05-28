# App:  @rallly/heartbeat-test

## Installation
* Run `yarn && yarn playwright install --with-deps` from the project root directory.

## Configuration
Environment variable must define `PLAYWRIGHT_BASE_URL`.
* This will default to http://localhost:3000

## Usage
* Run `yarn workspace @rallly/heartbeat-test e2e_test` to execute the script from the project root. 

    * heartbeat-test runs all [Playwright](https://wwww.playwright.dev) tests in the `apps/heartbeat-test/tests` directory.

    * For example, from a POSIX command line this could be accomplished for the original prod server with the following:
        * `PLAYWRIGHT_BASE_URL=https://app.rallly.co yarn workspace @rallly/heartbeat-test e2e_test`

## Configuring Workflows
* A sample workflow has been provided in `example_heartbeat_workflow.yml`
   * Workflow will run tests with example data that needs to be filled in (testing example.com)
* At a minimum, running `yarn` and `yarn playwright install --with-deps` will run the program.

For example, this will get hearbeat-test running with minimum specs:
```name: Heartbeat Tests

env:
  PLAYWRIGHT_BASE_URL: https://www.example.com

on:
  schedule:
    - cron: "0 * * * *"
jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 18
    - name: run yarn
      run: yarn
    - name: run Playwright install
      run: yarn playwright install --with-deps
    - name: Run Playwright tests
      run: yarn workspace @rallly/heartbeat-test e2e_test
```


---
### Version
1.0.0

### Authors
RJT, Huy Le, Levi Miller
