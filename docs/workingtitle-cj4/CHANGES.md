# Working Title CJ4 v0.8.0 Changes

Welcome to the Working Title CJ4 v0.8.0, one of the largest and most comprehensive updates to the aircraft to date. This update includes an enormous navigational systems overhaul, making it an excellent aircraft for a full range of IFR flight activities and procedures. We have also added a number of other great features, like a full FADEC and sound overhaul.

This release is incredibly large, and is such very much a beta release. Please check the list of outstanding issues below, and file any issues encountered on our GitHub Issues tracker.

We hope you enjoy flying this release!

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

## Custom Flight Plan Manager
* Independent from MSFS flightplan
* Much improved procedure data, even when using the stock NavBlue data
* Modifiable approaches
* Appropriate discontinuities
* Direct-to to any fix on the plan at any time
* Correct vectors, heading-to-altitude, and intercept legs

## Vertical Navigation (VNAV)
* Full support of all CJ4 VNAV modes including VVS, VFLC, and VPATH
* Continuous vertical path calculation
* Display of vertical path snowflake
* Display of required vertical speed donut to meet next restriction
* Display of TOD on the map
* Overhauled altitude modes including ALTS and ALTV
* Ability to add custom altitude restrictions in FMC LEGS page

## Lateral Navigation
* New lateral navigation over the top of existing AP
* Supports correct discontinuity behavior
* Compatibility with the new Flight Plan Manager
* Much improved ILS APPR capture success rate

## RNAV
* Ability to fly RNAV procedures at all times
* Correct sensitivity scaling for the enroute (2NM), terminal (1NM), and approach phases (.3NM)
* Correct PFD annunciations for navigational sensitivity
* Full LPV approach support, including correct increasing angular sensitivity as distance to threshold decreases
* Full AP support of APPR and GP modes for RNAV approaches

## FADEC
* Proper flat rating of engine for consistent performance at varying field elevations and temperatures
* TO and CLB throttle detents with indication on MFD N1 display
* FADEC properly targets increasing thrust curve and N1 with altitude in CLB
* Full CRZ throttle range

## FMC
* Reserve fuel can now be changed
* Revised the format of the FLPN page to better match the real unit, especialy for approaches
* Approach ref temp of zero can now be entered

## Engines
* Light now off occurs at 12% N2
* Performance adjustments to fit climb profile using FADEC

## PFD/MFD
* Complete overhaul of the PFD Flight Mode Annunciator to match the correct CJ4 mode symbology 
* IAS hold will now automatically switch to Mach when the values are the same
* IAS/Mach button switch now captures current mach number
* Added ability to adjust BARO minimums and added minimums aural callout
* Added altitude capture aural alert and flashing altitude selection indicator
* Added FMC waypoint sequence alerting: waypoint ident and distance will flash 5 seconds before sequencing
* Course needles now smoothly swing to position as per the real display
* Fixed an issue where the upper panel knob also controlled menues in the MFD

## PPOS/PLAN map
* Added “NO FLIGHT PLAN” to ROSE/ARC modes when no flight plan detected
* Added “DISCONTINUITY” to ROSE/ARC modes when discontinuity is reached
* Icons updated for airports, waypoints, and intersections
* Added correct label font and sizing for map labels
* Procedures should now be drawn more accurately to how they appear in the procedure charts
* Temporary flight plans (modifying a route) now displays as a dashed white line

## New Sounds (work in progress)
* Engine exterior and interior run, start, stop
* Avionics fans
* Spoiler drag, Gear drag, extend, retract
* Cockpit wind and rain
* FMS, AP panel, DCP, CCP, and soft buttons
* Aurals (Altitude, Minimums, Caution/Warning, Landing Gear, Pull up, Overspeed etc.)
* Removed TAWS System Test (To be replaced with accurate sound)

## Misc
* New camera presets (pax, lavatory etc.)

---
## ℹ️ Navigational items not currently implemented but scheduled for future updates
* Holds and procedure turns
* FMC INTC CRS capability
* VNAV Vertical Direct-To Fix
* Manual Point/Bearing or Point/Bearing/Distance fixes
* Route offsets
* LNAV/VNAV approaches. Currently all RNAV approaches use LPV in APPR mode due to no minimums type information in the available navdata.

## ⚠️ Known Issues
* Sync to the game flightplan (ATC/VFR Map) is very much work in progress and turned off by default. You can enable this feature in MOD SETTINGS on the FMC.
* Some external applications that use the GPS/Flight plan SimVars may not function correctly or as expected.
* Loading and saving flights can occasionally have bad results.
* Custom liveries can render FADEC inoperative if they ship with a panel.cfg. You must uninstall them or remove their panel.cfg from the livery folder. This is a limitation of the Asobo livery system.
* Autopilot modes cannot be triggered via keybindings or controllers and must currently be triggered in the cockpit with the mouse.
* Sound: Wind sound can stutter from time to time.
* Due to sim autopilot bank rate limitations, the aircraft may overshoot on certain RNP approaches with tight turns. If you encounter this, we recommend handflying the approach with the given lateral and vertical guidance.
* Sometimes when turning more than 90 degrees onto an approach segment, VNAV might give a NOPATH condition because it sees that you are too high.  Engage FLC or VS and descend down and it should recapture the path.
* The FMS now builds turn anticipation into direct-to course projection. However, you will still encounter some overshoot beyond 60 or so degrees.

### 🎅 Have fun! 🎅
