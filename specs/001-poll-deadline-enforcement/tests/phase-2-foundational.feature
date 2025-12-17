Feature: Reminder Model Schema and Relationships
  As a developer
  I want the Reminder model to be properly defined with correct relationships
  So that reminder emails can be tracked and duplicate reminders prevented

  Scenario: Reminder model exists with required fields
    Given the database schema has been migrated
    When I query the Reminder table structure
    Then the Reminder table should exist
    And it should have an id field (String, CUID)
    And it should have a pollId field (String, foreign key to Poll)
    And it should have a participantId field (String, foreign key to Participant)
    And it should have a reminderType field (ReminderType enum)
    And it should have a sentAt field (DateTime)
    And it should have a createdAt field (DateTime, default now)

  Scenario: ReminderType enum exists with correct values
    Given the database schema has been migrated
    When I query the ReminderType enum
    Then the enum should exist
    And it should have the value "twentyFourHours"
    And it should have the value "sixHours"
    And it should have the value "oneHour"

  Scenario: Reminder has unique constraint preventing duplicates
    Given the database schema has been migrated
    When I query the Reminder table constraints
    Then there should be a unique constraint on (pollId, participantId, reminderType)
    And attempting to insert a duplicate reminder should fail

  Scenario: Reminder has required indexes for query performance
    Given the database schema has been migrated
    When I query the Reminder table indexes
    Then there should be an index on (pollId, participantId, reminderType)
    And there should be an index on (pollId, sentAt)

  Scenario: Poll model has Reminder relationship
    Given the database schema has been migrated
    When I query the Poll model relationships
    Then Poll should have a reminders relation field
    And the relation should be one-to-many (Poll has many Reminders)
    And the relation should cascade on delete

  Scenario: Participant model has Reminder relationship
    Given the database schema has been migrated
    When I query the Participant model relationships
    Then Participant should have a reminders relation field
    And the relation should be one-to-many (Participant has many Reminders)
    And the relation should cascade on delete

  Scenario: Reminder foreign key constraints work correctly
    Given a poll exists in the database
    And a participant exists for that poll
    When I create a Reminder record with valid pollId and participantId
    Then the Reminder should be created successfully
    And when I delete the poll
    Then the Reminder should be automatically deleted (cascade)
    And when I delete the participant
    Then the Reminder should be automatically deleted (cascade)

