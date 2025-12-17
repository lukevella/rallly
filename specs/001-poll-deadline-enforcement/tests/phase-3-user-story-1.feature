Feature: Set Poll Deadline
  As a poll creator
  I want to set an optional deadline when creating a poll
  So that participants know when the poll will close

  Background:
    Given I am logged in as a poll creator
    And I am on the poll creation page

  Scenario: Deadline field appears in poll creation form
    When I view the poll creation form
    Then I should see a deadline field
    And the deadline field should be optional
    And the deadline field should have a date picker
    And the deadline field should have a time picker

  Scenario: Create poll with valid future deadline
    Given I am filling out the poll creation form
    When I set a deadline that is 2 days in the future
    And I submit the poll creation form
    Then the poll should be created successfully
    And the poll should have the deadline stored in the database
    And the deadline should be stored in UTC format

  Scenario: Create poll with deadline in the past is rejected
    Given I am filling out the poll creation form
    When I attempt to set a deadline that is 1 day in the past
    And I attempt to submit the poll creation form
    Then I should see a validation error
    And the error message should indicate the deadline must be in the future
    And the poll should not be created

  Scenario: Create poll without deadline
    Given I am filling out the poll creation form
    When I leave the deadline field empty
    And I submit the poll creation form
    Then the poll should be created successfully
    And the poll should have no deadline (null)
    And the poll should behave as before (no deadline enforcement)

  Scenario: Deadline timezone conversion works correctly
    Given I am in timezone "America/New_York"
    When I set a deadline for "2025-01-20 15:00" in my local timezone
    And I submit the poll creation form
    Then the deadline should be stored in UTC in the database

