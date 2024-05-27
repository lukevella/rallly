# App:  @rallly/heartbeat-test

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


---
### Version
1.0.0

### Authors
RJT, Huy Le, Levi Miller
