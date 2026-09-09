# Rallly — create a group poll

A Kane CLI natural-language end-to-end test that creates a new group poll and
verifies the poll page loads with the chosen title. Runs in a real browser
(Kane CLI also automates mobile apps on the iOS Simulator and Android Emulator).

## Create a poll and verify it loads
Go to https://app.rallly.co/new.
Wait for the create poll form.
Type "Team Sync Kane Test" into the poll title field.
If a calendar is shown, click one available date to add it as an option.
Click the button to create the poll (labeled "Create poll" or "Continue").
Wait for the poll page to load.
Assert that the resulting page URL contains "/poll/" and displays the title "Team Sync Kane Test".
