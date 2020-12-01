# Working Title CJ4 v0.7.3 Changes

Welcome to the latest update of the Working Title CJ4 (v0.7.2). This is a hotfix for v0.7.2 for adjusting the autopilot PIDs to get rid of the bugs introduces with MSFS update 1.11.6.0! 

Thanks to Asobo and FBW for finding a solution to this pressing issue.

## Installation
Installation is easy, simply copy the `workingtitle-aircraft-cj4` folder inside the zip file to your MSFS Community folder. 

**Important: We recommend that you fully delete the previous `workingtitle-aircraft-cj4` folder before copying this release.**

## Changes
* Changed Autopilot PID values to get rid of problems introduces with MSFS update 1.11.6.0

## Known Issues
* Altitude constraints are not currently selectable on the map due to incorrect data being displayed.
* The speed constraints on arrivals may not show correctly because of database issues.
* After using Direct-To, the navigation will not always automatically sequence to the next fix and may enter ROL mode. You can re-activate NAV to navigate to the next fix if you encounter this issue.
* The aircraft is still using the built-in MSFS autopilot (for now). All the existing limitations of that still apply. It does behave a bit better with the various enhancements applied.
* Some flight plan distances may still be misreported when the approach is activated. Please log an issue if you encounter this with details.
* Some instances of the autopilot skipping approach waypoints still occur - this is deep in the sim handling of waypoints and is, for now, out of our hands. We will continue to research this.
