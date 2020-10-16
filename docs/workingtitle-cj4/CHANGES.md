# Working Title CJ4 v0.4.1 Changes

Welcome to the latest update of the Working Title CJ4 (v0.5.0). Thank you to everyone who contributed to this release.

Feel free to test out our new Simbrief Profile: [SIMBRIEF PROFILE](https://www.simbrief.com/system/dispatch.php?sharefleet=eyJ0cyI6IjE2MDI1MzkxMTUxODMiLCJiYXNldHlwZSI6IkMyNUMiLCJjb21tZW50cyI6IldPUktJTkcgVElUTEUgQ0o0IiwiaWNhbyI6IkMyNUMiLCJuYW1lIjoiQ0lUQVRJT04gQ0o0IiwiZW5naW5lcyI6IkZKNDQtNEEiLCJyZWciOiJONTI1V1QiLCJmaW4iOiIyNTQiLCJzZWxjYWwiOiIiLCJoZXhjb2RlIjoiIiwiY2F0IjoiTSIsInBlciI6IkIiLCJlcXVpcCI6IlNERTJFM0ZHSFJXWFlaIiwidHJhbnNwb25kZXIiOiJMQjEiLCJwYm4iOiJBMUIyQzJEMkQzTzJPM1MyIiwiZXh0cmFybWsiOiIiLCJtYXhwYXgiOiI3Iiwid2d0dW5pdHMiOiJMQlMiLCJvZXciOiIxMDI4MCIsIm16ZnciOiIxMjUwMCIsIm10b3ciOiIxNzExMCIsIm1sdyI6IjE1NjYwIiwibWF4ZnVlbCI6IjU3NjIiLCJwYXh3Z3QiOiIxNzAiLCJkZWZhdWx0Y2kiOiIiLCJmdWVsZmFjdG9yIjoiUDAwIiwiY3J1aXNlb2Zmc2V0IjoiUDAwMDAifQ--)

Check out our interim SoP doc: [Interim SoP Document](https://docs.google.com/document/d/15qb3g2ECsA8XH6gSbqbe5kGydNJ3Tj0j7vJPAWirwh4/edit?usp=sharing)

## Installation
Installation is easy, simply copy the `workingtitle-aircraft-cj4` folder inside the zip file to your MSFS Community folder. 

**Important: We recommend that you fully delete the previous `workingtitle-aircraft-cj4` folder before copying this release.**

## Key Features
* Simbrief Imports: Added ability to enter your PILOT ID from Simbrief and then load the latest OFP/Flight Plan directly to the FMC (store your PILOT ID in the MOD SETTINGS page and then use the ROUTE MENU to FPLN RECALL)
* Approach Waypoints: Added ability to skip and go direct to any waypoint on the approach
* FMS Performance: Greatly improved the performance of the FMS / waypoint loading times
* Volumetric External Lights: Incorporated the latest lighting package from Uwajimaya including volumetric external lighting
* Cabin Lights: Added the ability via the MOD SETTINGS menu to change the cabin light setting


### Engine Model
* xxx

### Flight Model
* xxx

### LEGS Page
* Redesigned waypoint loader to dramatically improved flight plan management/FMS performance on LEGS page
* Added ability to skip approach waypoints or go direct to any approach waypoint

### FPLN Page
* Redesigned waypoint loader to dramatically improved flight plan management/FMS performance on FPLN page
* Added ability to directly download and import the latest OFP from Simbrief - auto load simbrief flight plan directly to FMS!

### DEP/ARR Page
* Added ability to select VFR runway for landing (when no approach selected or available)
* Added departure/arrival transitions
* Fixed display error with approach transitions

### PROG Page
* xxx

### PERF Page
* Added error protection for PERF Pages / closes [#253](https://github.com/Working-Title-MSFS-Mods/fspackages/issues/253)
* Fixed bug with gross weight calculation
* Added indication when no runway is selected for TAKEOFF REF and APPROACH REF
* Added ability to have VFR runway selected to allow PERF pages even when no approach is selected (for airports without approaches)
* Added vspeed send logic and messages to FMC to replicate real unit
* Fixed refresh error after entering/updating reserve fuel on FUEL MANAGEMENT page

### PFD/MFD
* xxx
* xxx

### Audio
* xxx

### Lighting
* Incorporated the latest lighting package from Uwajimaya including volumetric external lighting.
* Added controllable passenger cabin lighting (accessed from FMS -> IDX -> MOD SETTINGS)

## Known Issues
* Modifications of the flight plan can be slow at times. The cause for this is Asobo's FacilityLoader which they need to fix. When the FMC shows "Working..." it indicates an operation is in progress.
* Sometimes when entering an airway and the exit fix, the airway name will change to the shared airway, however the routing is still correct.
* You cannot currently select Direct-To of a fix on your approach that is not the initial approach fix. This is a limitation of the sim flightplan system at present. We are currently overhauling the flight plan management system to allow for much more flexibility and stability.
* After using Direct-To, the navigation will not always automatically sequence to the next fix and may enter ROL mode. You can re-activate NAV to navigate to the next fix if you encounter this issue.
* The aircraft is still using the built-in MSFS autopilot (for now). All the existing limitations of that still apply. It does behave a bit better with the various enhancements applied.
* FLC stability appears to have regressed with the autopilot aircraft energy calculation changes in 1.9.3. We have made some improvements to this behavior in this update. We will continue to investigate after the 13 October 2020 patch is released.
* Some flight plan distances are still misreported when the approach is activated. We will look at this more carefully after the Asobo update.
