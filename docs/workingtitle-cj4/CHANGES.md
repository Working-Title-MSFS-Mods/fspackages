# Working Title CJ4 v0.12.0
Welcome to the Working Title CJ4 v0.12.0. This version brings a boatload of bug fixes and tweaks, including a new custom vertical autopilot that has allowed us to add altitude capture for PTCH mode, TO/GA modes and improve the altitude capture mechanics of the autopilot.

## READ THE GUIDE
Please, please, please read the guide for instructions on using features. A lot of hard work went into writing the guide and the Discord channels are clogged with questions that are readily answered in the guide.

GUIDE: https://docs.google.com/document/d/1qzxPMTSQRkvau8QOi7xUqNvjx9rbww_qHlso5AT5OnI

## Installation
Installation is easy, simply copy the `workingtitle-aircraft-cj4` folder inside the zip file to your MSFS Community folder. 

**Important: We recommend that you fully delete the previous `workingtitle-aircraft-cj4` folder before copying this release.**

# Changes

## VNAV CLIMB
VNAV Climb should now be working correctly - we know that we've warned many people in past versions to turn it off if it isn't working, but at this point we believe it works as designed. As a refresher, in the CJ4, VNAV in climb is NOT A PATH. It simply provides protection for the pilot to not exceed an AT or AT OR BELOW constraint in the departure procedure. The protection exists ONLY for waypoints that are loaded into the FMC as part of a DEPARTURE PROCEDURE. If you add other waypoints beyond the DP, those constraints will not be respected as climb constraints.

## AUTOPILOT/MODES
- Enabled APPR mode for ILS when tuned in PFD even when an approach is not loaded in the FMC.
- Added custom vertical autopilot to manage altitude capture and hold modes. (note: the ALT button is now tied to H:WT_CJ4_AP_ALT_PRESSED and the emissive lvar is L:WT_CJ4_ALT_HOLD)
- Added altitude capture for PTCH mode.
- Added altitude capture for TO/GA modes.
- Enabled ability to arm LNAV on the ground and set activation at 400' AGL.
- Fixed bug with not being able to turn off the Flight Director when FMA modes are annunciated - the FD button will now disable all modes when being turned off, as long as the AP is not on.
- Fixed bug that prevented VNAV button press from being read when APPR mode was active - now it is only force disabled when GP/GS have been captured and those are the active vertical modes.

## PFD
- Added PITCH REF value to the FMA when in PTCH mode.
- PFD Baro preset bug fixed where improper units would sometimes display with the baro preset window open.
- Fixed bugs with selected altitude < 0 or > 45,000; these values will not display AND the simvar values will not exceed those limits (you can't get stuck below 0 anymore).
- Removed inaccurate feature of resetting the FMA modes upon landing - they will now remain in the last selected modes until the FD is turned off.

## MFD
- Improved map/terrain mask (thanks Slip!).
- Improved ROSE/ARC display to better reflect the real aircraft.
- Improved min wind vector/speed display.
- Fixed bug where DES waypoint would appear even after it had been passed sometimes on the map.
- Improved gps track bug on MFD/PFD and enable during ground ops.
- Added ability for FMS Text VNAV window to display climb data even when no descent/arrival is picked, and also to show arrival/TOD data after climb constraints have passed.
- Fixed the Range Banana (altitude intercept arc) on the PFD/MFD to only display the point where the SELECTED altitude will be intercepted, not the VNAV altitude.

## FMC
- Added runway slope calculations to Takeoff and Landing Ref pages - you can now enter a slope and the relevant TOFL/LFL number will adjust accordingly.
- Added landing factor distance selection on Approach Ref page - you can now select the landing factor.
- Added ability to enter custom/new pax weight on PERF INIT page using format "/XXX" or "5/XXX" and the pax weight value is persistent.
- Added ability to enter Gross Weight on PERF INIT page to override ZFW and/or Pax/Cargo inputs.
- Fixed bug where the final approach fix calculation in LNAV sometimes chose the missed approach waypoint as the FAF.
- Fixed bug that sometimes caused the departure runway to be undefined (black FMC screen) after flight plan import.
- Adjusted DIRTO and Vertical Direct page and capabilities to fix bug not allowing a second vertical direct, not allowing a vertical direct to a current direct to waypoint.
- Added ability to select any vertical waypoint with a constraint for a direct to; when constraints are A/B or A/ the altitude targeted will be the ABOVE value.
- Fixed bug causing VREF/VAPP display error in FMC in certain circumstances.
- Removed departure runway altitude from flight plan and LEGS page.

## VNAV
- Fixed bug that would prevent a climb in cases where there is no SID, but a STAR exists and has constraints.
- Adjusted VNAV FMS Text window to display descent data as soon as the last departure constraint is passed, instead of waiting until the departure procedure has been completely flown.
- Fixed bug with missing some A/B or A/ constraints in the first descent segment in some rare cases.
- Changed behavior of path smoothing to cause the first descent segment to always be at the requested VPA in the VNAV DESCENT setup page.
- Fixed bug with VNAV calculations after a DIR TO.
- Adjusted behavior after FPLN change is made that adjusts the PATH; if the new PATH causes an out-of-activation range problem, AP mode changes to PTCH.
- Fixed bug where after PATH arms in an ABOVE PATH intercept situation, PATH won't disarm even if you deviate from intercept parameters.
- Extensive debugging and fixing of obscure/non-normal cases.

## FLIGHT MODEL
- Adjusted idle thrust.
- Adjusted 75% thrust error in thrust table.

## MODEL
- Adjusted behavior of the panel light knob to replicate the function of the knob in the real aircraft - full on is DAY setting, and this is the ONLY setting to get daytime charts.

## ⚠️ Known Issues
* In the latest versions of Navigraph data, some "lettered" or non-runway-specific approaches now appear as something like RNAV A - 00 and do not allow the selection of a landing runway, preventing using the Approach Refs page - this is something we will be working to address in the future.
* Some external applications that use the GPS/Flight plan SimVars may not function correctly or as expected when FP Sync is off.
* Loading and saving flights can have bad results.
* Custom liveries can render FADEC inoperative if they ship with a panel.cfg. Painters should reference the new [REPAINT_README.md](https://github.com/Working-Title-MSFS-Mods/fspackages/blob/main/docs/workingtitle-cj4/REPAINT_README.md) file included in the docs folder of the Github repository.
* Autopilot modes cannot be triggered via key bindings or controllers and must currently be triggered in the cockpit with the mouse. External binding applications are adding support for LVars and HEvents. Used SimVars are documented [here](https://github.com/Working-Title-MSFS-Mods/fspackages/wiki/Sim-Variables)
* Sometimes a heading to altitude instruction on takeoff will display further than the first RNAV fix on an RNAV departure procedure; in these cases the workaround is to cross-check the DP chart and remove the erroneous waypoint either by deleting the heading to altitude fix or dropping the first RNAV fix onto the magenta line in the LEGS page.
* Due to sim autopilot bank rate limitations, the aircraft may overshoot on certain RNP approaches with tight turns. If you encounter this, we recommend hand flying the approach with the given lateral and vertical guidance.
