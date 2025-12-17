Feature: Database Index Setup for Poll Deadline
  As a system administrator
  I want database indexes optimized for deadline queries
  So that deadline enforcement cron jobs perform efficiently

  Scenario: Database index exists on Poll.deadline field
    Given the database schema has been migrated
    When I query the database indexes
    Then there should be an index on Poll.deadline field
    And the index should support efficient queries for deadline <= NOW()

  Scenario: Index supports nullable deadline queries
    Given polls exist with and without deadlines
    When I query polls with deadline IS NOT NULL
    Then the query should use the deadline index
    And the query should complete within acceptable time limits

