# Working Title CJ4 v0.11.1

Welcome to the Working Title CJ4 v0.11.1. This is a hotfix to address a few high-priority bugs with v0.11.0.

## Installation
Installation is easy, simply copy the `workingtitle-aircraft-cj4` folder inside the zip file to your MSFS Community folder. 

**Important: We recommend that you fully delete the previous `workingtitle-aircraft-cj4` folder before copying this release.**

## Charts Integration
Charts in the CJ4 are powered by Navigraph - special thanks to the team at Navigraph for their support with API integration. In order to use the charts in the CJ4, you need to have a subscription that includes charts - https://navigraph.com/products/subscriptions. If you have a subscription, all you need to do is select the NAVIGRAPH line in MOD SETTINGS in the FMC and that will launch your web browser and ask you to log in to your Navigraph account - from there an access token will be issued. These tokens do time out from time-to-time, so if you're prompted by the aircraft, or if you ever encouter difficulties loading charts, please go back to this option and resync your account. Details on using the Charts capabilities are in the user guide.

# Changes

- Fixed problem with FP SYNC option.
- Addressed problems displaying VNAV TOD in certain cirsumstances.
- Removed INOP tooltip from chart joystick.

## ⚠️ Known Issues
* PTCH mode will not level off at an altitude and it can have some quirky behaviors.  This is currently a sim AP issue.
* Some external applications that use the GPS/Flight plan SimVars may not function correctly or as expected when FP Sync is off.
* Loading and saving flights can have bad results.
* Custom liveries can render FADEC inoperative if they ship with a panel.cfg. Painters should reference the new [REPAINT_README.md](https://github.com/Working-Title-MSFS-Mods/fspackages/blob/main/docs/workingtitle-cj4/REPAINT_README.md) file included in the docs folder of the Github repository.
* Autopilot modes cannot be triggered via keybindings or controllers and must currently be triggered in the cockpit with the mouse. External binding applications are adding support for LVars and HEvents. Used SimVars are documented [here](https://github.com/Working-Title-MSFS-Mods/fspackages/wiki/Sim-Variables)
* Sometimes a heading to altitude instruction on takeoff will display further than the first RNAV fix on an RNAV departure procedure; in these cases the workaround is to cross-check the DP chart and remove the erroneous waypoint either by deleting the heading to altitude fix or dropping the first RNAV fix onto the magenta line in the LEGS page.
* Due to sim autopilot bank rate limitations, the aircraft may overshoot on certain RNP approaches with tight turns. If you encounter this, we recommend handflying the approach with the given lateral and vertical guidance.
* The Standby Attitude Indicator switch is reversed in the model, so down (off) turns the SAI on and vice-versa; this will be addressed in a future update.