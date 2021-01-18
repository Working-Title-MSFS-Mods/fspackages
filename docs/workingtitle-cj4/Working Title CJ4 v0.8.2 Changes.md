# Working Title CJ4 v0.8.2 Changes

Welcome to the Working Title CJ4 v0.8.2. This is a point release to address compatibility with MSFS 1.12.13.0 (VR Update).

## Installation
Installation is easy, simply copy the `workingtitle-aircraft-cj4` folder inside the zip file to your MSFS Community folder. 

**Important: We recommend that you fully delete the previous `workingtitle-aircraft-cj4` folder before copying this release.**

## Default Livery Conflicts
The alternate default liveries that now ship with MSFS are not compatible with the CJ4 yet at this time. They currently ship with panel.cfg files that do not include our FADEC module. Please use the standard livery or a known compatible 3rd party or community livery.

## Remarks to flight plan synchronization between the Game and FMS 
Our recommendation is to keep FP Sync _off_.  
You can still "file" your flight plan to ATC by entering it in the world map of MSFS and it will remain visible to ATC/VFR.

To then load the plan into the FMS you can either enter it manually or use the _FPLN RECALL (GAME/SB)_ option in _IDX -> PAGE2 -> ROUTE MENU_

Due to the increased accuracy and capabilities of the FMC managed flight plan, you may find that the sync to the game does not always work as expected or does not reflect the FMC flight plan.

## KEY FEATURES
* Compatibility with MSFS 1.12.13.0

## FMC
* Fixed an issue where FPLN and LEGS would not show modifications unless the page was changed under certain conditions
* FMC should now be able to continue to be used even on page error in most circumstances

## Flight Plan Import
* Fixed an issue where game flight plans with blank ICAO legs would cause the plan to fail to load
* Simbrief plans with 3 letter ICAO airports prefixed with K should now properly load

## ⚠️ Known Issues
* Sync to the game flightplan (ATC/VFR Map) is very much work in progress and turned off by default. You can enable this feature in MOD SETTINGS on the FMC.
* Some external applications that use the GPS/Flight plan SimVars may not function correctly or as expected.
* Loading and saving flights can have bad results.
* Custom liveries can render FADEC inoperative if they ship with a panel.cfg. You must uninstall them or remove their panel.cfg from the livery folder. This is a limitation of the Asobo livery system.
* Autopilot modes cannot be triggered via keybindings or controllers and must currently be triggered in the cockpit with the mouse.
* TOD sometimes will flash on the PFD during an approach.
* Sometimes a heading to altitude instruction on takeoff will display further than the first RNAV fix on an RNAV departure procedure; in these cases the workaround is to cross-check the DP chart and remove the erronious waypoint either by deleting the heading to altitude fix or dropping the first RNAV fix onto the magenta line in the LEGS page.
* Due to sim autopilot bank rate limitations, the aircraft may overshoot on certain RNP approaches with tight turns. If you encounter this, we recommend handflying the approach with the given lateral and vertical guidance.
* Sometimes when turning more than 90 degrees onto an approach segment, VNAV might give a NOPATH condition because it sees that you are too high.  Engage FLC or VS and descend down and it should recapture the path.
* Very long legs may display some constant cross track deviation on the map and course needles. The plane will still track properly towards the fix. This will be addressed later in the beta.
* The FMS now builds turn anticipation into direct-to course projection. However, you will still encounter some overshoot beyond 90 or so degrees.
* If for whatever reason, you find that VNAV is not behaving as expected, try and turn it off and on again.

### 🎅 Have fun! 🎅
