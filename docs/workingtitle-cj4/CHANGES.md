# Working Title CJ4 v0.9.1 Changes

Welcome to the Working Title CJ4 v0.9.1. This is a hotfix release for 0.9.0 to fix the most pressing issues that came up after release.

## Installation
Installation is easy, simply copy the `workingtitle-aircraft-cj4` folder inside the zip file to your MSFS Community folder. 

**Important: We recommend that you fully delete the previous `workingtitle-aircraft-cj4` folder before copying this release.**

## Default Livery Conflicts
The alternate default liveries that now ship with MSFS are not compatible with the CJ4 yet at this time. They currently ship with panel.cfg files that do not include our FADEC module. Please use the standard livery or a known compatible 3rd party or community livery.

## Remarks to flight plan synchronization between the Game and FMS 
The FP SYNC option is one way: it updates the simulator flight plan from the FMC. To load a plan into the FMS you can either enter it manually or use the _FPLN RECALL (GAME/SB)_ option in _IDX -> PAGE2 -> ROUTE MENU_
Due to the increased accuracy and capabilities of the FMC managed flight plan, you may find that the sync to the game does not always work as expected or does not reflect the FMC flight plan exactly.

## Bugfixes
- Fixed issue where ATC window did not refresh electrical system status properly
- Fixed issue where map lines would be improperly drawn in certain situations and zoom factors
- Fixed issue where after flying one hold, LNAV would not fly any additional holds
- Fixed issue where LNAV would skip to the last hold if holds were on back-to-back legs
- Fixed speed tape overspeed indicator and warning speeds
- LNAV should no longer wander back and forth in the case of overlapping or duplicate flight plan fixes
- Fix for DIRECT TO not reactivating the current dirto from the DTO page
- Fix for DIRECT TO not working after one successful DTO

## ⚠️ Known Issues
* Some external applications that use the GPS/Flight plan SimVars may not function correctly or as expected when FP Sync is off.
* Loading and saving flights can have bad results.
* Custom liveries can render FADEC inoperative if they ship with a panel.cfg. You must uninstall them or remove their panel.cfg from the livery folder. This is a limitation of the Asobo livery system.
* On FPLN you cant enter airways properly when arrival/approach procedures are already selected (to be fixed soon).
* Autopilot modes cannot be triggered via keybindings or controllers and must currently be triggered in the cockpit with the mouse.
* Sometimes a heading to altitude instruction on takeoff will display further than the first RNAV fix on an RNAV departure procedure; in these cases the workaround is to cross-check the DP chart and remove the erroneous waypoint either by deleting the heading to altitude fix or dropping the first RNAV fix onto the magenta line in the LEGS page.
* Due to sim autopilot bank rate limitations, the aircraft may overshoot on certain RNP approaches with tight turns. If you encounter this, we recommend handflying the approach with the given lateral and vertical guidance.
* Sometimes when turning more than 90 degrees onto an approach segment, VNAV might give a NOPATH condition because it sees that you are too high.  Engage FLC or VS and descend down and it should recapture the path.
* If for whatever reason, you find that VNAV is not behaving as expected, try and turn it off and on again.

