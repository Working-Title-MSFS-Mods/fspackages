# Working Title CJ4 v0.11.0

Welcome to the Working Title CJ4 v0.11.0. In this update we introduce Charts, the VNAV Window on the MFD, enhanced datalink along with a number of bug fixes and full Sim Update 3 compatability.

## Installation
Installation is easy, simply copy the `workingtitle-aircraft-cj4` folder inside the zip file to your MSFS Community folder. 

**Important: We recommend that you fully delete the previous `workingtitle-aircraft-cj4` folder before copying this release.**

## Charts Integration
Charts in the CJ4 are powered by Navigraph - special thanks to the team at Navigraph for their support with API integration. In order to use the charts in the CJ4, you need to have a subscription that includes charts - https://navigraph.com/products/subscriptions. If you have a subscription, all you need to do is select the NAVIGRAPH line in MOD SETTINGS in the FMC and that will launch your web browser and ask you to log in to your Navigraph account - from there an access token will be issued. These tokens do time out from time-to-time, so if you're prompted by the aircraft, or if you ever encouter difficulties loading charts, please go back to this option and resync your account. Details on using the Charts capabilities are in the user guide.

# Changes

## PFD
- PFD Baro preset function added. (After STD is pressed on Baro knob,, a preset value can be selected and swapped with STD press again once passed transition altitude)

## MFD
- Added support for Navigraph Charts (can be selected with CHARTS button on lower control panel).
- Added VNAV window to FMS text (can be displayed by selecting VNAV WINDOW in the FMC DSPL MENU).
- Added Advisory Descent (DES instead of TOD) when no arrival or approach is loaded; this will provide an advisory (uncoupled) "DES" point to start descent to reach 1500' AFE 10nm from airport.

## FMC
- Added TUNE page functionality - ATC Control page, dispatch function, format changes,
- Added VNAV WINDOW option to DSPL MENU.
- Datalink: Added ATIS support for IVAO.
- Datalink: Changed default METAR source to VATSIM.
- Datalink: Added support for facilities with separate departure and arrival ATIS.

## VNAV
- Fixed bug where in certain circumstances below constraints were not observed in the first segment of the vertical flight plan.
- Adjusted glideslope capture to be more sensitive and only capture with less than half scale deflection.
- Adjusted visibility of below constraints on departure to allow them to appear on the PFD and in the VNAV MFD window at a greater distance from present position.

## FLIGHT MODEL
- Flight model adjusted and enhanced based on sim update 3 aerodynamic changes.

## MODEL
- Added support for livery painters that adjust the panel.cfg file; see the REPAINT_README.MD file included in the CJ4 Docs Folder ([REPAINT_README.md](https://github.com/Working-Title-MSFS-Mods/fspackages/blob/main/docs/workingtitle-cj4/REPAINT_README.md)).

## ⚠️ Known Issues
* PTCH mode will not level off at an altitude and it can have some quirky behaviors.  This is currently a sim AP issue.
* Some external applications that use the GPS/Flight plan SimVars may not function correctly or as expected when FP Sync is off.
* Loading and saving flights can have bad results.
* Custom liveries can render FADEC inoperative if they ship with a panel.cfg. Painters should reference the new [REPAINT_README.md](https://github.com/Working-Title-MSFS-Mods/fspackages/blob/main/docs/workingtitle-cj4/REPAINT_README.md) file included in the docs folder of the Github repository.
* Autopilot modes cannot be triggered via keybindings or controllers and must currently be triggered in the cockpit with the mouse. External binding applications are adding support for LVars and HEvents. Used SimVars are documented [here](https://github.com/Working-Title-MSFS-Mods/fspackages/wiki/Sim-Variables)
* Sometimes a heading to altitude instruction on takeoff will display further than the first RNAV fix on an RNAV departure procedure; in these cases the workaround is to cross-check the DP chart and remove the erroneous waypoint either by deleting the heading to altitude fix or dropping the first RNAV fix onto the magenta line in the LEGS page.
* Due to sim autopilot bank rate limitations, the aircraft may overshoot on certain RNP approaches with tight turns. If you encounter this, we recommend handflying the approach with the given lateral and vertical guidance.
* The Standby Attitude Indicator switch is reversed in the model, so down (off) turns the SAI on and vice-versa; this will be addressed in a future update.