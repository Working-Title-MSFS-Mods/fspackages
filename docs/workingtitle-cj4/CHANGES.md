# Working Title CJ4 v0.8.5 Changes

Welcome to the Working Title CJ4 v0.8.5

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
* Added Cross Pointers flight director
* Flight director works with AP off
* Added Takeoff Go-Around (TOGA) mode
* Holds
* Course intercept, Point/Bearing/Distance fixes, Point/Distance fixes, Lat/Lon fixes
* Improved Flight Model (WIP) (Credit: Metzgergva)
* Comm 2 can be used to transmit and receive.

## Flight Plan Manager
* Fixed errors where negative values would be returned for a leg course
* When approach is loaded, destination airport is removed and the runway becomes the final waypoint
* Added Auto/Inhibit to Legs page (Inhibit will not allow the FMS to sequence to next waypoint when you pass a fix)
* Intercept a course on your flightplan (Can be done by dropping a fix on the blue FROM line, it will then draw a course line from that fix to the next fix in the flight plan)
* Point/Bearing/Distance fixes are able to be created.  Can create a flightplan anywhere.  Syntax is "POINTXXX/DISTANCE".  Point is the fix followed immediately by 3 numbers for the bearing, a slash and then a distance value.  Alternatively, you could write "POINTXXX/DISTANCE/NAME" and name your new fix up to 5 custom characters.  Eg. JOBOB090/15.  Creates a fix 15nm from JOBOB on a 090 bearing.
* Point/Distance fixes (Along-track offset).  A waypoint that is offset a specified distance and
is either before or after a specified waypoint on the flight plan route.  A negative distance value will place the new fix before the reference fix.  Syntax: POINT/DISTANCE.  Eg. JOBOB/-15 
* Latitude/Longitude fixes - TODO
* Holds.  Allows custom formats, will automatically detect entry pattern and execute.  


## FMS
* Fixed DIR page (Adds nearest airports page and adjusts layout)
* V-Speeds will reset when entering a new origin after landing.
* Fuel used is now reset with new origin.
* Fixed bug in approach ref not showing headwind/tailwind
* Fixed cruise altitude cell in perf init from showing FL + 5 boxes
* Holding CLR for 1/2 second or longer will clear the entire scratchpad
* Fixed bug where it would go to perf init after vnav setup 3/3
* Fixed legs page blacking out with empty flight plan

## PFD/MFD
* Added Cross Pointers (X-PTR) flight director and setting persistence on restart
* Setting altimeter to hPA stays persistent on restart
* Cyan vertical speed arrow is now removed when in GP or VPATH
* Adjusted map ranges to realistic values (5, 10, 25, 50, 100, 200, 300) (600nm soon)
* Corrected PPOS scaling
* MFD Wind speed font size same as PFD
* Fixed outer range display cut off
* Added north label to PLAN view
* Wind indicator hidden on PLAN view
* Various map draw improvements

## Autopilot
* Adjusted VS to round up in approach to prevent drifting under GP (Current AP workaround)
* Added inhibit .1nm from runway threshold to prevent aircraft from flying towards center of airport
* Added TOGA functionality.  When pressed on ground, provides 10 degree FD pitch up, runway heading tracking.  In the air, provides 10 degree pitch up and syncs current heading, disables approach, and more (Chris?).  Button to engage is the L FIRE BOTTLE.
* When VS is engaged, it captures the current vertical speed.
* AP goes to Roll/Pitch upon landing.
* Approach sensitivity depends on approach segment type

## Misc
* AOA indicator only lights up on gear down or greater than flaps 15.
* Standby attitude indicator (SAI) baro settings are changed to whatever is set in PFD.

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

