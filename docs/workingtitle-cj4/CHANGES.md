# Working Title CJ4 v0.9.0 Changes

Welcome to the Working Title CJ4 v0.9.

## Installation
Installation is easy, simply copy the `workingtitle-aircraft-cj4` folder inside the zip file to your MSFS Community folder. 

**Important: We recommend that you fully delete the previous `workingtitle-aircraft-cj4` folder before copying this release.**

## Default Livery Conflicts
The alternate default liveries that now ship with MSFS are not compatible with the CJ4 yet at this time. They currently ship with panel.cfg files that do not include our FADEC module. Please use the standard livery or a known compatible 3rd party or community livery.

## Remarks to flight plan synchronization between the Game and FMS 
The FP SYNC option is one way: it updates the simulator flight plan from the FMC. To load a plan into the FMS you can either enter it manually or use the _FPLN RECALL (GAME/SB)_ option in _IDX -> PAGE2 -> ROUTE MENU_

Due to the increased accuracy and capabilities of the FMC managed flight plan, you may find that the sync to the game does not always work as expected or does not reflect the FMC flight plan exactly.

## KEY FEATURES
* Added Cross Pointers flight director
* Flight director now works with AP off, including lateral guidance
* Added Takeoff Go-Around (TOGA) mode
* Holds functionality and autopilot, including proper entry types and exit arming
* Course intercept, Point/Bearing/Distance fixes, Point/Distance fixes, Lat/Lon fixes
* Completely overhauled Flight Model (WIP) (Credit: Metzgergva)
* Com 2 can now be used to transmit and receive.

## Flight Plan Manager
* Fixed errors where negative values would be returned for a leg course
* When approach is loaded, destination airport is removed and the runway becomes the final waypoint

## LNAV
* Off-course sidewinder wandering behavior should be greatly reduced
* Support added for flying holds
* FMS now calculates correct DTK for very long legs along changing great circle bearings
* FMS will now continue to sequence even if the active nav mode source is a nav radio
* FMS will no longer sequence past the destination runway fix to the airport fix

## VNAV
* VNAV will now continue to the most recent restriction even during a large amount of turn anticipation
* FPA for approach legs will now be calculated from the FAF so steeper angles can be automatically supported

## Autopilot
* Adjusted VS to round up in approach to prevent drifting under GP (Current AP workaround)
* Added inhibit .1nm from runway threshold to prevent aircraft from flying towards center of airport
* Added TOGA functionality. When pressed on ground, provides 10 degree FD pitch up, runway heading tracking. Hotspot to engage is the L FIRE BOTTLE click hotspot
* VS mode now properly captures the current vertical speed when engaging
* AP now goes to Roll/Pitch upon landing
* Fixed issue where APPR sensitivity could appear even outside of the approach segment
* VS wheel now properly adjusts target aircraft pitch when in PITCH mode

## Comms
* COM2 transmit and receive is now fully supported in the panel and compatible with vPilot
* COM switches on audio panel can now enable or disable transmit for that channel
* COM knobs will now disable receive for that channel when turned down

## FMC
* Holding CLR for 1/2 second or longer will clear the entire scratchpad

### DIR
* Page layout has been overhauled
* Available fixes should properly reflect remaining legs in plan
* Nearest airports function should now operate
* Direct-to should no longer route you back to the origin runway if the selected fix is a non-ICAO leg termination (also applies to LEGS)

### LEGS
* Fixed legs page blacking out with empty flight plan
* Fixed inability to copy magenta TO fix to scratchpad
* Added lat/lon user waypoints support
* Added shorthand lat/lon user waypoint support
* Added place/bearing/distance user waypoint support
* Added flight plan offset user waypoint support
* Added ability to drop fix on blue FROM leg to intercept leg course
* Fixed incorrectly rounded distance displays
* Added NEW HOLD and HOLD AT support
* Added support for hold EXIT ARMED and CANCEL EXIT
* Added AUTO/INHIBIT FMS fix sequencing selection

### PERF
* Fixed bug where it would go to perf init after vnav setup 3/3
* Fixed cruise altitude cell in perf init from showing FL + 5 boxes
* Fixed bug in approach ref not showing headwind/tailwind

### FPLN
* V-Speeds will reset when entering a new origin after landing.
* Airways should now be enterable connecting to the final departure fix
* Fuel used is now reset with new origin

### FPLN HOLD
* Added hold page support for all data fields, except for QUAD/RADIAL
* Added support for automatically detected entry type
* Added support for EXIT HOLD and CANCEL EXIT
* Wired hold support into EXEC/CANCEL MOD

### HOLD LIST
* Added HOLD LIST page
* Adeed support for up to 6 holds in list

## PFD/MFD
* Added Cross Pointers (X-PTR) flight director and setting persistence on restart
* Setting altimeter to hPA stays persistent on restart
* Cyan vertical speed arrow is now removed when in GP or VPATH
* Adjusted map ranges to realistic values (5, 10, 25, 50, 100, 200, 300, 600)
* Corrected PPOS scaling
* MFD Wind speed font size same as PFD
* Fixed outer range display cut off
* Added (N)orth label to PLAN view
* Wind indicator hidden on PLAN view
* Various map draw improvements
* Added correct icons for different VOR types and NDBs
* Enabled map symbols are now drawn and updated around the current location
* INTERS now only shows named and non terminal waypoints
* Added display of terminal waypoints (to be enabled in FMC)
* Map will show a maximum of 40 symbols as in the real unit (configurable in Defaults in later version)

## Misc
* AOA indicator only lights up on gear down or greater than flaps 15.
* Standby attitude indicator (SAI) baro settings are changed to whatever is set in PFD.

## ⚠️ Known Issues
* Some external applications that use the GPS/Flight plan SimVars may not function correctly or as expected when FP Sync is off.
* Loading and saving flights can have bad results.
* Custom liveries can render FADEC inoperative if they ship with a panel.cfg. You must uninstall them or remove their panel.cfg from the livery folder. This is a limitation of the Asobo livery system.
* On LEGS you cant enter airways properly when arrival/approach procedures are already selected (to be fixed soon).
* Autopilot modes cannot be triggered via keybindings or controllers and must currently be triggered in the cockpit with the mouse.
* Sometimes a heading to altitude instruction on takeoff will display further than the first RNAV fix on an RNAV departure procedure; in these cases the workaround is to cross-check the DP chart and remove the erroneous waypoint either by deleting the heading to altitude fix or dropping the first RNAV fix onto the magenta line in the LEGS page.
* Due to sim autopilot bank rate limitations, the aircraft may overshoot on certain RNP approaches with tight turns. If you encounter this, we recommend handflying the approach with the given lateral and vertical guidance.
* Sometimes when turning more than 90 degrees onto an approach segment, VNAV might give a NOPATH condition because it sees that you are too high.  Engage FLC or VS and descend down and it should recapture the path.
* If for whatever reason, you find that VNAV is not behaving as expected, try and turn it off and on again.

