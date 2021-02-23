# Working Title CJ4 v0.10.3

Welcome to the Working Title CJ4 v0.10.3.  This patch brings some improvements and a hotfix for the flight model since the UK update.

## Installation
Installation is easy, simply copy the `workingtitle-aircraft-cj4` folder inside the zip file to your MSFS Community folder. 

**Important: We recommend that you fully delete the previous `workingtitle-aircraft-cj4` folder before copying this release.**

## Default Livery Conflicts
The alternate default liveries that now ship with MSFS are not compatible with the CJ4 yet at this time. They currently ship with panel.cfg files that do not include our FADEC module. Please use the standard livery or a known compatible 3rd party or community livery.

# Changes

- Improvements to automatic VOR search
- Fix blacked out FPLN page when arrival was loaded from the world map
- More realistic GNSS POS INIT procedure
- Added TTG to the FMS info on the MFD
- Checklist on the MFD should not react to the PFD knob anymore
- Workaround for doubled flaps lift since the UK update (by metzgerva)
- Added a prominent(!) warning to the MFD when a incompatible livery is used
- Fixed typos on the TUN and DEP/ARR index page (by slip)
- Adjust colors for the terrain map (by slip)
- Added Datalink section with ability to request METAR/TAF/ATIS (thanks to Syntax for the code and FBW for allowing usage of their API)
- Added target and current altitude display in meters
- Improved PFD menus (Visuals, Minimums, V-Speeds...)
- Improvements to RA/BARO minimums in the PFD menu
- Minimums are now persisted
- Fixed V-Speed deactivation logic on speedtape display
- Added BARO SET page and functionality to PFD menu
- Show CRS on data block when no frequency is tuned
- CRS knob should change the needle whether or not a VOR/LOC is tuned in within range.

# ⚠️ Known Issues
* PTCH mode will not level off at an altitude and it can have some quirky behaviors.  This is currently a sim AP issue.
* Some external applications that use the GPS/Flight plan SimVars may not function correctly or as expected when FP Sync is off.
* Loading and saving flights can have bad results.
* Custom liveries can render FADEC inoperative if they ship with a panel.cfg. You must uninstall them or remove their panel.cfg from the livery folder. This is a limitation of the Asobo livery system.
* Autopilot modes cannot be triggered via keybindings or controllers and must currently be triggered in the cockpit with the mouse. External binding applications are adding support for LVars and HEvents. Used SimVars are documented [here](https://github.com/Working-Title-MSFS-Mods/fspackages/wiki/Sim-Variables)
* Sometimes a heading to altitude instruction on takeoff will display further than the first RNAV fix on an RNAV departure procedure; in these cases the workaround is to cross-check the DP chart and remove the erroneous waypoint either by deleting the heading to altitude fix or dropping the first RNAV fix onto the magenta line in the LEGS page.
* Due to sim autopilot bank rate limitations, the aircraft may overshoot on certain RNP approaches with tight turns. If you encounter this, we recommend handflying the approach with the given lateral and vertical guidance.
* If for whatever reason, you find that VNAV is not behaving as expected, try and turn it off and on again.
