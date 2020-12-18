# Working Title CJ4 v0.8.1 Changes

Welcome to the Working Title CJ4 v0.8.1...

## Installation
Installation is easy, simply copy the `workingtitle-aircraft-cj4` folder inside the zip file to your MSFS Community folder. 

**Important: We recommend that you fully delete the previous `workingtitle-aircraft-cj4` folder before copying this release.**

## 🆕 Key Features
* Custom Flight Plan Manager
* Vertical Navigation (VNAV)
* FADEC
* Custom Lateral Navigation
* RNAV capability with LPV
* Improved FMA Display
* Sound overhaul (WIP)
* PFD/MFD improvements (a lot)
* Map improvements
* Many many more...

## PFD/MFD
* .... Contributed by TheFlieger

## ⚠️ Known Issues
* Sync to the game flightplan (ATC/VFR Map) is very much work in progress and turned off by default. You can enable this feature in MOD SETTINGS on the FMC.
* Some external applications that use the GPS/Flight plan SimVars may not function correctly or as expected.
* Loading and saving flights can occasionally have bad results.
* Custom liveries can render FADEC inoperative if they ship with a panel.cfg. You must uninstall them or remove their panel.cfg from the livery folder. This is a limitation of the Asobo livery system.
* Autopilot modes cannot be triggered via keybindings or controllers and must currently be triggered in the cockpit with the mouse.
* Due to sim autopilot bank rate limitations, the aircraft may overshoot on certain RNP approaches with tight turns. If you encounter this, we recommend handflying the approach with the given lateral and vertical guidance.
* Sometimes when turning more than 90 degrees onto an approach segment, VNAV might give a NOPATH condition because it sees that you are too high.  Engage FLC or VS and descend down and it should recapture the path.
* Very long legs may display some constant cross track deviation on the map and course needles. The plane will still track properly towards the fix. This will be addressed later in the beta.
* The FMS now builds turn anticipation into direct-to course projection. However, you will still encounter some overshoot beyond 90 or so degrees.
* If for whatever reason, you find that VNAV is not behaving as expected, try and turn it off and on again.

### 🎅 Have fun! 🎅
