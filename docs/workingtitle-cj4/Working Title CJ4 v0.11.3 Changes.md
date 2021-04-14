# Working Title CJ4 v0.11.3
Welcome to the Working Title CJ4 v0.11.3. Bug fixes! This release is all about working through some backlogged bug fixes.

## READ THE GUIDE
Please, please, please read the guide for instructions on using features. A lot of hard work went into writing the guide and the Discord channels are clogged with questions that are readily answered in the guide.

## Installation
Installation is easy, simply copy the `workingtitle-aircraft-cj4` folder inside the zip file to your MSFS Community folder. 

**Important: We recommend that you fully delete the previous `workingtitle-aircraft-cj4` folder before copying this release.**

## Charts Integration
Charts in the CJ4 are powered by Navigraph - special thanks to the team at Navigraph for their support with API integration. In order to use the charts in the CJ4, you need to have a subscription that includes charts - https://navigraph.com/products/subscriptions. If you have a subscription, all you need to do is select the NAVIGRAPH line in MOD SETTINGS in the FMC and that will launch your web browser and ask you to log in to your Navigraph account - from there an access token will be issued. These tokens do time out from time-to-time, so if you're prompted by the aircraft, or if you ever encounter difficulties loading charts, please go back to this option and resync your account. Details on using the Charts capabilities are in the user guide.

Please note that occasionally the Navigraph token can time out; this especially happens if you do not exit the sim via the main menu. If that happens, please use MOD SETTINGS to refresh your Navigraph token and make a change to your flight plan, such as going DIRECT TO your current active waypoint - this will refresh the chart link.

# Changes
- Fixed bug with Pilot Waypoint storage that could cause errors for users adding waypoints to the data store for the first time
- Fixed missing STAR transition legs when selecting a VFR runway for landing instead of a published approach
- Fixed a bug with the autopilot update loop that could occasionally cause LNAV or VNAV to stop responding
- Made adjustments to LNAV turn anticipation in certain turn types
- Fixed bug that prevented the correct hold entry type from being updated when changing inbound course and turn direction
- Fixed bug where AP dives to pre-select altitude when VNAV is disabled while in PATH mode
- Fix behavior when a flight plan change causes PATH recalculation while in PATH mode - will now go to ALT and attempt to re-arm PATH

## ⚠️ Known Issues
* PTCH mode will not level off at an altitude and it can have some quirky behaviors.  This is currently a sim AP issue.
* Some external applications that use the GPS/Flight plan SimVars may not function correctly or as expected when FP Sync is off.
* Loading and saving flights can have bad results.
* Custom liveries can render FADEC inoperative if they ship with a panel.cfg. Painters should reference the new [REPAINT_README.md](https://github.com/Working-Title-MSFS-Mods/fspackages/blob/main/docs/workingtitle-cj4/REPAINT_README.md) file included in the docs folder of the Github repository.
* Autopilot modes cannot be triggered via key bindings or controllers and must currently be triggered in the cockpit with the mouse. External binding applications are adding support for LVars and HEvents. Used SimVars are documented [here](https://github.com/Working-Title-MSFS-Mods/fspackages/wiki/Sim-Variables)
* Sometimes a heading to altitude instruction on takeoff will display further than the first RNAV fix on an RNAV departure procedure; in these cases the workaround is to cross-check the DP chart and remove the erroneous waypoint either by deleting the heading to altitude fix or dropping the first RNAV fix onto the magenta line in the LEGS page.
* Due to sim autopilot bank rate limitations, the aircraft may overshoot on certain RNP approaches with tight turns. If you encounter this, we recommend hand flying the approach with the given lateral and vertical guidance.
