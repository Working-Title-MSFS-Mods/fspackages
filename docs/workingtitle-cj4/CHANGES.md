# Working Title CJ4 v0.5.0 Changes

Welcome to the latest update of the Working Title CJ4 (v0.5.0). Thank you to everyone who contributed to this release.

Feel free to test out our new Simbrief Profile: [SIMBRIEF PROFILE](https://www.simbrief.com/system/dispatch.php?sharefleet=eyJ0cyI6IjE2MDI1MzkxMTUxODMiLCJiYXNldHlwZSI6IkMyNUMiLCJjb21tZW50cyI6IldPUktJTkcgVElUTEUgQ0o0IiwiaWNhbyI6IkMyNUMiLCJuYW1lIjoiQ0lUQVRJT04gQ0o0IiwiZW5naW5lcyI6IkZKNDQtNEEiLCJyZWciOiJONTI1V1QiLCJmaW4iOiIyNTQiLCJzZWxjYWwiOiIiLCJoZXhjb2RlIjoiIiwiY2F0IjoiTSIsInBlciI6IkIiLCJlcXVpcCI6IlNERTJFM0ZHSFJXWFlaIiwidHJhbnNwb25kZXIiOiJMQjEiLCJwYm4iOiJBMUIyQzJEMkQzTzJPM1MyIiwiZXh0cmFybWsiOiIiLCJtYXhwYXgiOiI3Iiwid2d0dW5pdHMiOiJMQlMiLCJvZXciOiIxMDI4MCIsIm16ZnciOiIxMjUwMCIsIm10b3ciOiIxNzExMCIsIm1sdyI6IjE1NjYwIiwibWF4ZnVlbCI6IjU3NjIiLCJwYXh3Z3QiOiIxNzAiLCJkZWZhdWx0Y2kiOiIiLCJmdWVsZmFjdG9yIjoiUDAwIiwiY3J1aXNlb2Zmc2V0IjoiUDAwMDAifQ--)

Check out our interim SoP doc: [Interim SoP Document](https://docs.google.com/document/d/15qb3g2ECsA8XH6gSbqbe5kGydNJ3Tj0j7vJPAWirwh4/edit?usp=sharing)

## Installation
Installation is easy, simply copy the `workingtitle-aircraft-cj4` folder inside the zip file to your MSFS Community folder. 

**Important: We recommend that you fully delete the previous `workingtitle-aircraft-cj4` folder before copying this release.**

## Key Features
* Simbrief flight plan import: Added ability to enter your PILOT ID from Simbrief and then load the latest OFP/Flight Plan directly to the FMC (store your PILOT ID in the MOD SETTINGS page and then use the ROUTE MENU to FPLN RECALL)
* Approach Waypoints: Added ability to skip waypoints on the approach
* FMS Performance: Greatly improved the performance of the FMS / waypoint loading times
* Added MFD Memory Functions - MEM buttons now allowing users to save states of the MFD and switch quickly between them (press and hold a MEM button to save the current state to that button)
* Volumetric External Lights: Incorporated the latest lighting package from Uwajimaya including volumetric external lighting
* Improvements to PFD and MFD
* Cabin Lights: Added the ability via the MOD SETTINGS menu to change the cabin light setting
* FMS: Non functional menu items are now greyed out

### LEGS Page
* Redesigned waypoint loader to dramatically improved flight plan management/FMS performance on LEGS page
* Added ability to skip approach waypoints or go direct to any approach waypoint / closes [#27](https://github.com/Working-Title-MSFS-Mods/fspackages/issues/27)

### FPLN Page
* Redesigned waypoint loader to dramatically improved flight plan management/FMS performance on FPLN page
* Added ability to directly download and import the latest OFP from Simbrief - auto load simbrief flight plan directly to FMS!
* Fixed bug where airways were renamed after entry

### DEP/ARR Page
* Added ability to select VFR runway for landing (when no approach selected or available)
* Added departure/arrival transitions
* Fixed display error with approach transitions

### PROG Page
* Fixed several display bugs

### PERF Page
* Added error protection for PERF Pages / closes [#253](https://github.com/Working-Title-MSFS-Mods/fspackages/issues/253)
* Fixed bug with gross weight calculation
* Added ability to enter a zero fuel weight number to calculate gross weight instead of pax/cargo entries.
* Added indication when no runway is selected for TAKEOFF REF and APPROACH REF
* Added ability to have VFR runway selected to allow PERF pages even when no approach is selected (for airports without approaches)
* Added vspeed send logic and messages to FMC to replicate real unit
* Fixed refresh error after entering/updating reserve fuel on FUEL MANAGEMENT page
* Addressed fuel flow bugs throughout / closes [#224](https://github.com/Working-Title-MSFS-Mods/fspackages/issues/224)
* Added takeoff time, enroute time, and landing time to flight log page

### ARR DATA Page
* Closer to real ARR DATA page look and feel

### PFD/MFD
* Fix stuck PFD menu when AOA was turned on / closes [#251](https://github.com/Working-Title-MSFS-Mods/fspackages/issues/251)
* Added elapsed timer functionality to PFD
* Restructured PFD menu
* Restructured Lower MFD menu
* GS is now magenta  / closes [#249](https://github.com/Working-Title-MSFS-Mods/fspackages/issues/249)
* Improved the usability of MFD checklist (saves last opened page and resumes completed section)
* FMS Text on the MFD will now stay opened after opening MFD checklist or passenger briefing menus
* Added functionality to CCP MEM buttons, allowing users to save states of the MFD and switch quickly between them
* Fixed broken fuel reading on SYSTEM OVERLAY menu / closes [#246](https://github.com/Working-Title-MSFS-Mods/fspackages/issues/246)

### Audio
* Fixed audio bugs with announcments

### Lighting
* Incorporated the latest lighting package from Uwajimaya including volumetric external lighting.
* Added controllable passenger cabin lighting (accessed from FMS -> IDX -> MOD SETTINGS)
* Fixed some lighting bleed (thanks again Uwajimaya) / closes [#171](https://github.com/Working-Title-MSFS-Mods/fspackages/issues/171)

## Known Issues
* After using Direct-To, the navigation will not always automatically sequence to the next fix and may enter ROL mode. You can re-activate NAV to navigate to the next fix if you encounter this issue.
* The aircraft is still using the built-in MSFS autopilot (for now). All the existing limitations of that still apply. It does behave a bit better with the various enhancements applied.
* Some flight plan distances may still be misreported when the approach is activated. Please log an issue if you encounter this with details.
* Some instances of the autopilot skipping approach waypoints still occur - this is deep in the sim handling of waypoints and is, for now, out of our hands. We will continue to research this.
