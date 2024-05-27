# App:  @rallly/heartbeat-test

## Usage
* Run `yarn workspace @rallly/heartbeat-test test` to execute the script from the project root

    * heartbeat-test runs all tests in the `apps/heartbeat-test/tests` directory.

    * Tests are written using [Playwright's](https://wwww.playwright.dev) API

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
