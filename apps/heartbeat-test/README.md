# App:  @rallly/heartbeat-test

## Usage
* Run `yarn workspace @rallly/heartbeat-test e2e_test` to execute the script from the project root

    * heartbeat-test runs all [Playwright](https://wwww.playwright.dev) tests in the `apps/heartbeat-test/tests` directory.

    * From a POSIX command line this could be accomplished for the original prod server with the following:
        * `PLAYWRIGHT_BASE_URL=https://app.rallly.co yarn workspace @rallly/heartbeat-test e2e_test`

## Configuration
Environment file can define `PLAYWRIGHT_BASE_URL`.
* Default will define this as http://localhost:3000

## Configuring Workflows
* A sample workflow has been provided in `example_heartbeat_workflow.yml`

* Workflow must define `PLAYWRIGHT_BASE_URL` to run, or spin up a local server at port 3000,


---
### Version
1.0.0

### Authors
RJT, Huy Le, Levi Miller
