# Working Title CJ4 v0.11.0

Welcome to the Working Title CJ4 v0.11.0.
## Installation
Installation is easy, simply copy the `workingtitle-aircraft-cj4` folder inside the zip file to your MSFS Community folder. 

**Important: We recommend that you fully delete the previous `workingtitle-aircraft-cj4` folder before copying this release.**

## Charts integration hints
...TODO...

# Changes

- Navigraph MFD Charts implementation
- PFD Baro preset function added. (After STD is pressed on Baro knob,, a preset value can be selected and swapped with STD press again once passed transition altitude)
- Added VNAV window to FMS text (Must be selected on DSPL MENU vnav window)
- Added Advisory Descent (DES instead of TOD) when no arrival or approach is loaded, will give you an advisory point to start descent to reach 1500' AFE 10nm from airport.
- Added TUNE page functionality - ATC Control page, dispatch function, format changes,
- Fixed vnav bug where below constraints were not observed in the first segment of the vertical path.
- Fixed glideslope capture so it will only go active when within 1/4 dot or so (Used to go active at full deflection)
- Fixed another vnav bug where below constraints on SIDs further than 40nm were not seen.

# ⚠️ Known Issues
* PTCH mode will not level off at an altitude and it can have some quirky behaviors.  This is currently a sim AP issue.
* Some external applications that use the GPS/Flight plan SimVars may not function correctly or as expected when FP Sync is off.
* Loading and saving flights can have bad results.
* Custom liveries can render FADEC inoperative if they ship with a panel.cfg. You must uninstall them or remove their panel.cfg from the livery folder. This is a limitation of the Asobo livery system.
* Autopilot modes cannot be triggered via keybindings or controllers and must currently be triggered in the cockpit with the mouse. External binding applications are adding support for LVars and HEvents. Used SimVars are documented [here](https://github.com/Working-Title-MSFS-Mods/fspackages/wiki/Sim-Variables)
* Sometimes a heading to altitude instruction on takeoff will display further than the first RNAV fix on an RNAV departure procedure; in these cases the workaround is to cross-check the DP chart and remove the erroneous waypoint either by deleting the heading to altitude fix or dropping the first RNAV fix onto the magenta line in the LEGS page.
* Due to sim autopilot bank rate limitations, the aircraft may overshoot on certain RNP approaches with tight turns. If you encounter this, we recommend handflying the approach with the given lateral and vertical guidance.
* If for whatever reason, you find that VNAV is not behaving as expected, try and turn it off and on again.
