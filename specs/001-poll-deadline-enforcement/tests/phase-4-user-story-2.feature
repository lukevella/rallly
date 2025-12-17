Feature: View Deadline and Countdown
  As a poll participant or creator
  I want to see the deadline prominently displayed with a countdown
  So that I know how much time remains to respond

  Background:
    Given a poll exists with id "poll1"
    And the poll has a deadline set

  Scenario: Deadline is displayed prominently on poll page
    Given I am viewing poll "poll1"
    When the poll page loads
    Then I should see the deadline displayed prominently
    And the deadline should show the date
    And the deadline should show the time
    And the deadline should show the timezone indicator

  Scenario: Countdown displays time remaining correctly
    Given poll "poll1" has a deadline 3 days in the future
    When I view poll "poll1"
    Then I should see a countdown showing "3 days"
    And the countdown should update every minute
    And after 1 minute, the countdown should update to show the new time remaining

  Scenario: Deadline display uses neutral styling for far future deadlines
    Given poll "poll1" has a deadline more than 24 hours in the future
    When I view poll "poll1"
    Then the deadline display should use neutral/default styling

  Scenario: Deadline display uses warning styling for approaching deadline
    Given poll "poll1" has a deadline less than 24 hours away
    And poll "poll1" has a deadline more than 6 hours away
    When I view poll "poll1"
    Then the deadline display should use warning styling (yellow/orange colors)

  Scenario: Deadline display uses urgent styling for very close deadline
    Given poll "poll1" has a deadline less than 6 hours away
    When I view poll "poll1"
    Then the deadline display should use urgent styling (red colors)

  Scenario: Deadline display shows disabled state for passed deadline
    Given poll "poll1" has a deadline that has already passed
    When I view poll "poll1"
    Then the deadline display should show as disabled/grayed out
    And the countdown should show "0" or indicate the deadline has passed

  Scenario: Countdown shows days, hours, and minutes
    Given poll "poll1" has a deadline 2 days, 5 hours, and 30 minutes in the future
    When I view poll "poll1"
    Then the countdown should display "2 days, 5 hours, 30 minutes" remaining

