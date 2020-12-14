# Working Title CJ4 v0.8.0 Changes

THIS IS HUUUUUUUUUUUGE!

## Installation
Installation is easy, simply copy the `workingtitle-aircraft-cj4` folder inside the zip file to your MSFS Community folder. 

**Important: We recommend that you fully delete the previous `workingtitle-aircraft-cj4` folder before copying this release.**

## Key Features
* Custom Flight Plan Manager
*  Vertical Navigation (VNAV)
* FADEC
* custom Lateral Navigation
* RNAV capability
* Improved FMA Display
* Sound overhaul (wip)
* PFD/MFD improvements (a lot)
* Map improvements
* Many many more...

## Custom Flight Plan Manager
* Independent from MSFS flightplan
* Improved procedure data
* Modifiable approaches
* Discontinuities
* Vectors

## Vertical Navigation (VNAV)
* Obeys procedure restrictions
* Custom Restriction input in FMS LEGS
* RNAV/LPV approach capability with appropriate sensitivity scaling

## Custom Lateral Navigation / RNAV Capability
* [TODO] describe what it can do
* TERM/LPV Approach flags on PFD shown when needle sensitivity increased

## FADEC
* TO and CLB detents with indication on engine display
* FADEC will increase N1 in CLB detent with altitude to meet desired thrust
* CRZ works like normal throttle control

## FMS Changes
* Reserve fuel can now be changed
* Added approaches to FPLN page

## Engines
* Light off occurs at 12% N2

## PFD/MFD
* Correct display of autopilot modes and alignment 
* IAS hold will automatically switch to Mach when the values are the same
* IAS/Mach button switch now captures current mach number
* Added BARO minimums and aural callout
* Altitude capture alert and flashing display
* TO waypoint will flash when when approaching turn
* Course needle smoothing

## PPOS/PLAN map
* Added “NO FLIGHT PLAN” to ROSE/ARC modes when no flight plan detected
* Icons updated for airports, waypoints, and intersections
* Text enlarged for better readability
* Procedures are drawn more accurately to how they are charted
* TO waypoint will flash when approaching turn
* Temporary flight plans (modifying a route) displays as a dashed white line


## New Sounds (work in progress)
* Engine exterior and interior run, start, stop
* Avionics fans
* Spoiler drag
* Gear drag, extend, retract
* Cockpit wind and rain
* FMS, AP panel, DCP, CCP, and soft buttons
* Aurals (Altitude, Minimums, Caution/Warning, Landing Gear, Pull up, Overspeed etc.)
* Removed annoying TAWS System Test (To be replaced with accurate sound)
* Many other small changes ^^


## Things not available with the new Flight Plan Manager or VNAV as of now
* Holds
* Intercepting a course (Eg. Telling FMS to intercept a fix at a specific radial)
* VNAV Vertical Direct-To Fix
* Point/Bearing or Point/Bearing/Distance fixes
* Offsets

## Known Issues
* Sync to game flightplan (ATC/VFR Map) is very much work in progress and turned off by default (mod settings)
* Load/Save flights can have bad results
* Sound: Wind sound can stutter from time to time
* Due to AP limitations/adjustments to be made, aircraft might fly off course on certain RNP approaches with tight turns (Suggest to handfly for better accuracy & fun factor)
* Sometimes when turning more than 90 degrees onto an approach segment, VNAV might give a NOPATH condition because it sees that you are too high.  Engage FLC or VS and descend down and it should recapture the path.
* FMS direct-to turns beyond 60 degrees or so will overshoot, greatly over 90.


### Have fun!