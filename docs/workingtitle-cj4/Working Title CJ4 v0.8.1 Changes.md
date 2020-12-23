# Working Title CJ4 v0.8.1 Changes

Welcome to the Working Title CJ4 v0.8.1. This is a point release to address some of the issues seen this week with version 0.8.0. This version remains a beta release. Please report any issues found to our Issues tracker on our GitHub repository.

## Installation
Installation is easy, simply copy the `workingtitle-aircraft-cj4` folder inside the zip file to your MSFS Community folder. 

**Important: We recommend that you fully delete the previous `workingtitle-aircraft-cj4` folder before copying this release.**

## Remarks to flight plan synchronization between the Game and FMS 
Our recommendation is to keep FP Sync _off_.  
You can still "file" your flight plan to ATC by entering it in the world map of MSFS and it will remain visible to ATC/VFR.

To then load the plan into the FMS you can either enter it manually or use the _FPLN RECALL (GAME/SB)_ option in _IDX -> PAGE2 -> ROUTE MENU_

Due to the increased accuracy and capabilities of the FMC managed flight plan, you may find that the sync to the game does not always work as expected or does not reflect the FMC flight plan.

## KEY FEATURES
* Added VFR runway approaches - in DEP/ARR you can now choose a VFR runway for landing and specify a runway extension waypoint to be added to the flight plan as far as 25nm from the runway. This allows you to 'roll your own' LNAV/VNAV approach to any runway at any airport. Great for small/private fields!  https://streamable.com/idloxs
* Fixed issue when resuming VNAV climbs and fixed issue when setting missed approach altitude during an RNAV approach with GP.

## Compatibility
* Removed old unused files that were causing a compatibility issue with WT Garmin units and the FBW A32NX

## RNAV
* Fixed an issue where GP would stop descending and capture an altitude when the altitude preselector was moved (i.e. to the missed approach altitude)
* Fixed an issue where sometimes the active waypoing would sequence to the airport and take the plane off course on an RNAV approach.

## MCP
* Fixed an issue where the CRS would not accept input sometimes while not in LNV or NAV mode

## PFD
* Numerous fantastic cosmetic accuracy updates (contribution by TheFlieger)
* FMS mach value now always shows only two digits
* Updated BARO indications to show when STD has been set; updated BARO knob to always set STD pressure when pressed

## MFD
* Numerous fantastic cosmetic accuracy updates (contribution by TheFlieger)
* Shows IGN indication on engine ignition during startup
* Don't show TOD marker on map when in Approach Mode

## SAI
* Fixed the baro setting rounding error

## FMC
* LEGS page will no longer intepret entries of lower than FL500 as speed restrictions
* LEGS order of AB restrictions should now be correct
* FPLN now allows proper entry of 3 letter ICAO airport codes
* FPLN selecting Origin or Destination will put the ICAO into the scratchpad
* Visual approach (runway extension fix) capabilty added to the DEP/ARR page
* Pressing LSK next to origin and dest will now copy ICAO to the scratchpad
* FMC should no longer blackscreen when going to the ARR DATA page
* FP Sync option will now actually be active when set to enabled
* Added new option "FPLN RECALL (GAME)" to Route Menu to sync the flight plan from world map to the FMS

## Flight Plan Manager
* Fixed issue where some track-to-radial-intercept legs were being dropped from procedures
* Changed behavior of FP Sync on flight start
* When FP Sync is off: ATC/VFR plan remains but FMS plan is empty. Enter the flight plan manually or use the _FPLN RECALL_ options 

## LNAV
* Fixed issue where LNAV would get stuck in a swapping full left then right bank oscillation

## Sound
* Wind, Spoiler Drag and external engine sounds should now be played on the right audio bus so it doesn't play during pause & volume can be adjusted.

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
