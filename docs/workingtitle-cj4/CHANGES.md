# Working Title CJ4 v0.11.2
Welcome to the Working Title CJ4 v0.11.2. This update brings some exciting new features like "night" charts (darkened) and storable pilot waypoints, in addition to some important bug fixes.

## READ THE GUIDE
Please, please, please read the guide for instructions on using features. A lot of hard work went into writing the guide and the Discord channels are clogged with questions that are readily answered in the guide.

## Installation
Installation is easy, simply copy the `workingtitle-aircraft-cj4` folder inside the zip file to your MSFS Community folder. 

**Important: We recommend that you fully delete the previous `workingtitle-aircraft-cj4` folder before copying this release.**

## Charts Integration
Charts in the CJ4 are powered by Navigraph - special thanks to the team at Navigraph for their support with API integration. In order to use the charts in the CJ4, you need to have a subscription that includes charts - https://navigraph.com/products/subscriptions. If you have a subscription, all you need to do is select the NAVIGRAPH line in MOD SETTINGS in the FMC and that will launch your web browser and ask you to log in to your Navigraph account - from there an access token will be issued. These tokens do time out from time-to-time, so if you're prompted by the aircraft, or if you ever encouter difficulties loading charts, please go back to this option and resync your account. Details on using the Charts capabilities are in the user guide.

# Changes
- Implemented charts darkmode (when panel lights off or at full, in day mode, otherwise night mode)
- Added ability to store up to 20 pilot waypoints (IDX->DATABASE)
- Added ability to type pilot waypoint idents in LEGS, DIR and FPLN pages
- Fixed Standby Attitude Indicator and Emergency Light Switches
- Add Emergency Light CAS Message
- Fix co-pilot audio panel
- Fixes for TOD problems, including showing a TOD when in an approach and missing when in cruise
- Fixed VNAV FPTA error that sometimes could cause LNAV to stop responding
- Added CHECK SPEED message that will show when your speed is >20kts than the current restriction (remember speed constraints are not automatically loaded from nav data and must be manually entered)
- Further enhancement of terrain colors for the TERR map option; adds curve points above and below aircraft based on aircraft AGL altitude.
- Cleanup of some small FMC bugs, including missing Working... messages for some screens.
- Improved duplicate detecton methods when importing flight plans (fewer duplicates will flag)
- Removed 'select waypoint' page being triggered during an import if there are no exact duplicates
- Refined TOD rounding on MFD in VNAV WINDOW

## ⚠️ Known Issues
* PTCH mode will not level off at an altitude and it can have some quirky behaviors.  This is currently a sim AP issue.
* Some external applications that use the GPS/Flight plan SimVars may not function correctly or as expected when FP Sync is off.
* Loading and saving flights can have bad results.
* Custom liveries can render FADEC inoperative if they ship with a panel.cfg. Painters should reference the new [REPAINT_README.md](https://github.com/Working-Title-MSFS-Mods/fspackages/blob/main/docs/workingtitle-cj4/REPAINT_README.md) file included in the docs folder of the Github repository.
* Autopilot modes cannot be triggered via keybindings or controllers and must currently be triggered in the cockpit with the mouse. External binding applications are adding support for LVars and HEvents. Used SimVars are documented [here](https://github.com/Working-Title-MSFS-Mods/fspackages/wiki/Sim-Variables)
* Sometimes a heading to altitude instruction on takeoff will display further than the first RNAV fix on an RNAV departure procedure; in these cases the workaround is to cross-check the DP chart and remove the erroneous waypoint either by deleting the heading to altitude fix or dropping the first RNAV fix onto the magenta line in the LEGS page.
* Due to sim autopilot bank rate limitations, the aircraft may overshoot on certain RNP approaches with tight turns. If you encounter this, we recommend handflying the approach with the given lateral and vertical guidance.
