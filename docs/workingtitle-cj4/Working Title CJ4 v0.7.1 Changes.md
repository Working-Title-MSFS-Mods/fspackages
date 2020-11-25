# Working Title CJ4 v0.7.1 Changes

Welcome to the latest update of the Working Title CJ4 (v0.7.1). This is a hotfix for v0.7.0 but also brings lights to the lower CCP panel! Thanks to all the helpful folks who contributed to this release.

## Important Feature Change from v0.7.0 Onward

The active flight plan route will no longer be displayed in the ARC or ROSE modes. This is accurate to the actual aircraft. The ARC and ROSE modes are designed to work with the course pointer system. If you would like to see the flight plan route, you must use the PPOS display mode (very similar to ARC, except with the active flight plan instead of pointers) or the PLAN mode.

To activate the new altitude select range indicator (altitude banana), press DSPL MENU on the FMC, then go to page 2. Press LSK3L to activate the indicator. The indicator will only be displayed in the PPOS mode.

---

Demo video: [Working Title CJ4 0.7.0 Features Showcase](https://www.youtube.com/watch?v=ta8SQSLStTM)

Feel free to test out our new Simbrief Profile: [SIMBRIEF PROFILE](https://www.simbrief.com/system/dispatch.php?sharefleet=eyJ0cyI6IjE2MDI1MzkxMTUxODMiLCJiYXNldHlwZSI6IkMyNUMiLCJjb21tZW50cyI6IldPUktJTkcgVElUTEUgQ0o0IiwiaWNhbyI6IkMyNUMiLCJuYW1lIjoiQ0lUQVRJT04gQ0o0IiwiZW5naW5lcyI6IkZKNDQtNEEiLCJyZWciOiJONTI1V1QiLCJmaW4iOiIyNTQiLCJzZWxjYWwiOiIiLCJoZXhjb2RlIjoiIiwiY2F0IjoiTSIsInBlciI6IkIiLCJlcXVpcCI6IlNERTJFM0ZHSFJXWFlaIiwidHJhbnNwb25kZXIiOiJMQjEiLCJwYm4iOiJBMUIyQzJEMkQzTzJPM1MyIiwiZXh0cmFybWsiOiIiLCJtYXhwYXgiOiI3Iiwid2d0dW5pdHMiOiJMQlMiLCJvZXciOiIxMDI4MCIsIm16ZnciOiIxMjUwMCIsIm10b3ciOiIxNzExMCIsIm1sdyI6IjE1NjYwIiwibWF4ZnVlbCI6IjU3NjIiLCJwYXh3Z3QiOiIxNzAiLCJkZWZhdWx0Y2kiOiIiLCJmdWVsZmFjdG9yIjoiUDAwIiwiY3J1aXNlb2Zmc2V0IjoiUDAwMDAifQ--)

Check out our interim SoP doc: [Interim SoP Document](https://docs.google.com/document/d/15qb3g2ECsA8XH6gSbqbe5kGydNJ3Tj0j7vJPAWirwh4/edit?usp=sharing)

---

## Installation
Installation is easy, simply copy the `workingtitle-aircraft-cj4` folder inside the zip file to your MSFS Community folder. 

**Important: We recommend that you fully delete the previous `workingtitle-aircraft-cj4` folder before copying this release.**

## Key Features
* Added backlighting to lower CCP panel to complete lighting on the panel
* Fixed bugs with freezing MFD and FMC in some situations

### FMC
* Fix Metric conversion errors on perf init
* Fix Metric conversion errors on fuel mgmt

#### FPLN
* Fixed error with certain navaid loading when search query returns an empty value (example case NDB HM)

### PFD/MFD
* Repaired map conflict with other WT mods that share the same common mapping code
* Resolve freezing MFD/PFD error with altitude constraint selection (this option has been disabled as the data is inaccurate)
* Fixed bug displaying waypoint names in black on black background
* Adjusted leg colors to show active leg magenta, and others in white

### PROG
* Fixed metric conversion display errors

## Known Issues
* Altitude constraints are not currently selectable on the map due to incorrect data being displayed.
* The speed constraints on arrivals may not show correctly because of database issues.
* After using Direct-To, the navigation will not always automatically sequence to the next fix and may enter ROL mode. You can re-activate NAV to navigate to the next fix if you encounter this issue.
* The aircraft is still using the built-in MSFS autopilot (for now). All the existing limitations of that still apply. It does behave a bit better with the various enhancements applied.
* Some flight plan distances may still be misreported when the approach is activated. Please log an issue if you encounter this with details.
* Some instances of the autopilot skipping approach waypoints still occur - this is deep in the sim handling of waypoints and is, for now, out of our hands. We will continue to research this.
