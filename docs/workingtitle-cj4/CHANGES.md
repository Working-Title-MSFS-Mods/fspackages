# Working Title CJ4 v0.7.0 Changes

Welcome to the latest update of the Working Title CJ4 (v0.7.0). This version brings a long list of changes to the CJ4, including some that will be very helpful while flying approaches. We've also brough the display modes in line with the real aircraft. Thanks to all the helpful folks who contributed to this release.

## Important Feature Change

The active flight plan route will no longer be displayed in the ARC or ROSE modes. This is accurate to the actual aircraft. The ARC and ROSE modes are designed to work with the course pointer system. If you would like to see the flight plan route, you must use the PPOS display mode (very similar to ARC, except with the active flight plan instead of pointers) or the PLAN mode.

---

Demo video: TODO

Feel free to test out our new Simbrief Profile: [SIMBRIEF PROFILE](https://www.simbrief.com/system/dispatch.php?sharefleet=eyJ0cyI6IjE2MDI1MzkxMTUxODMiLCJiYXNldHlwZSI6IkMyNUMiLCJjb21tZW50cyI6IldPUktJTkcgVElUTEUgQ0o0IiwiaWNhbyI6IkMyNUMiLCJuYW1lIjoiQ0lUQVRJT04gQ0o0IiwiZW5naW5lcyI6IkZKNDQtNEEiLCJyZWciOiJONTI1V1QiLCJmaW4iOiIyNTQiLCJzZWxjYWwiOiIiLCJoZXhjb2RlIjoiIiwiY2F0IjoiTSIsInBlciI6IkIiLCJlcXVpcCI6IlNERTJFM0ZHSFJXWFlaIiwidHJhbnNwb25kZXIiOiJMQjEiLCJwYm4iOiJBMUIyQzJEMkQzTzJPM1MyIiwiZXh0cmFybWsiOiIiLCJtYXhwYXgiOiI3Iiwid2d0dW5pdHMiOiJMQlMiLCJvZXciOiIxMDI4MCIsIm16ZnciOiIxMjUwMCIsIm10b3ciOiIxNzExMCIsIm1sdyI6IjE1NjYwIiwibWF4ZnVlbCI6IjU3NjIiLCJwYXh3Z3QiOiIxNzAiLCJkZWZhdWx0Y2kiOiIiLCJmdWVsZmFjdG9yIjoiUDAwIiwiY3J1aXNlb2Zmc2V0IjoiUDAwMDAifQ--)

Check out our interim SoP doc: [Interim SoP Document](https://docs.google.com/document/d/15qb3g2ECsA8XH6gSbqbe5kGydNJ3Tj0j7vJPAWirwh4/edit?usp=sharing)

---

## Installation
Installation is easy, simply copy the `workingtitle-aircraft-cj4` folder inside the zip file to your MSFS Community folder. 

**Important: We recommend that you fully delete the previous `workingtitle-aircraft-cj4` folder before copying this release.**

## Key Features
* Added proper VOR navigation modes, including the ability to track VOR1 and VO2
* Added capability to set CRS on both VOR1 and VOR2
* MFD MEM mode memory persists between flights
* Correct course needles on the PFD and MFD for FMS and NAV
* Ghost localizer needle overlay in FMS mode
* Metric units support
* Ability to use a GPU on the ground
* Correct ARC, ROSE, and PPOS display modes
* Altitude select range arc on PPOS Mode

### FMC
* SimBrief load should no longer randomly fail on airway loads
* Improved scratchpad handling to better reflect the actual unit (thanks @panourgue)

#### FPLN
* Setting an origin should now properly clear the whole flight plan
* Setting destination should clear all procedures
* Page should now show correct "NOT ON GROUND" if attempting to set origin while airborne
* Inputting an invalid fix should no longer clear the entire temporary flight plan

#### TAKEOFF PERF
* Restored ability to set custom QNH (thanks @panourgue)
* Pages should no longer crash without selected runways

#### FUEL MGMT
* Fixed issue where fuel management page would spontaneously continue to reappear (thanks Wombii)

#### SELECT WPT
* Overhauled the waypoint disambiguation page to reflect the real unit layout
* Suggested fixes should now be orderd by distance from plane position
* You can now go to multiple pages of SELECT WPT, should there be any (thanks Danice737)

#### MOD SETTINGS
* A GPU can now be connected to the plane on the mod settings page
* Cabin lights are now properly tied to the battery bus state
* Cabin lights state should be properly saved between flights and will no longer default to on
* You can now clear your input SimBrief pilot ID (thanks @panourgue)
* You can now select metric or imperial units for the aircraft

#### TAKEOFF REF
* You can now go to all takeoff ref pages even without a selected runway

#### DEP/ARR
* Pressing the DEP/ARR FMC button should now take you automatically to the appropriate procedure phase as it does in the real unit
* Page no longer miscalculates the number of total pages
* Available approach runways from the selected arrival should now match correctly
* The LSK should no longer select the wrong runway if an arrival is also selected

### PFD/MFD
* ARC, ROSE, and PPOS modes have been overhauled. You should no longer see the route map in ARC and ROSE modes, but only in PPOS and PLAN modes (Selected from FMS DSPL MENU)
* Properly modeled and styled course needles have been added to the ARC and ROSE modes reflective of the real aircraft
* The dotted blue ghost localizer needle now shows in ARC and ROSE if you have FMS selected, a localizer tuned, and within range (~30NM from airport)
* The altitude range arc has been added to PPOS mode and will now show when you will reach your selected target altitude 
* Metric and imperial units switch should be reflected on the PFD/MFD
* Heading bug resized
* Heading bug and line should now appear and disappear properly in the ARC and ROSE modes
* Changed color of deviation diamonds to green when on an ILS
* Changed deviation diamonds from filled to outlined diamond for accuracy
* Magenta track bug hidden when on the ground, resized, and overlayed over heading bug for visibility.
* When switching to NAV1 or NAV2, you can now select the NAV AP button to enable tracking the tuned VOR or localizer
* The weather radar sweep indicator should no longer show when WX is not being displayed
* Bearing pointers should no longer show in PLAN mode

## Known Issues
* The speed constraints on arrivals may not show correctly because of database issues.
* After using Direct-To, the navigation will not always automatically sequence to the next fix and may enter ROL mode. You can re-activate NAV to navigate to the next fix if you encounter this issue.
* The aircraft is still using the built-in MSFS autopilot (for now). All the existing limitations of that still apply. It does behave a bit better with the various enhancements applied.
* Some flight plan distances may still be misreported when the approach is activated. Please log an issue if you encounter this with details.
* Some instances of the autopilot skipping approach waypoints still occur - this is deep in the sim handling of waypoints and is, for now, out of our hands. We will continue to research this.
