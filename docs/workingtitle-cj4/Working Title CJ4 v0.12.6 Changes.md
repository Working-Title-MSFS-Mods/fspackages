# Working Title CJ4 v0.12.6
Welcome to the Working Title CJ4 v0.12.6. This version brings compatibility for MSFS Sim Update 5, as well as a number of other enhancements and small fixes.

In this release we also have a number of community submissions. Thanks to everyone, as always, for your contributions! We really love working with you all.

## SU5 Compatibility
Please note that the core sim interaction/model behaviors have changed dramatically with SU5, and there is a new interaction system. See the Known Issues for some issues with this. We highly recommend using the new LOCK Cockpit Interaction System with Instrument Tooltips off. To access these settings, go to Options -> General Options -> Accessibility.


## READ THE GUIDE
Please, please, please read the guide for instructions on using features. A lot of hard work went into writing the guide and the Discord channels are clogged with questions that are readily answered in the guide.

GUIDE: https://docs.google.com/document/d/1qzxPMTSQRkvau8QOi7xUqNvjx9rbww_qHlso5AT5OnI

## Installation
Installation is easy, simply copy the `workingtitle-aircraft-cj4` folder inside the zip file to your MSFS Community folder. 

**Important: We recommend that you fully delete the previous `workingtitle-aircraft-cj4` folder before copying this release.**

# General Changes
- SU5 Compatibility (some bugs remain - see known issues)
- Improved brightness in the PFD/MFD (thanks @charles-vomacka)
- Improved altimeter scroller for PFD and SAI; implements the blocks instead of blank spaces for empty digits (thanks @charles-vomacka)
- Fix other SAI display bugs (thanks @slip)
- Added AoA smoothing and tweaked AoA for better Vref (thanks @slip)
- FLC mode now uses the mach value from VNAV Climb and the ias value from VNAV Descent FMS pages to set crossover speeds for FLC mode (auto-switching from MACH to IAS now happens at the speeds entered, if nothing is set, the default values remain)

# TCAS
- TUNE 1/2 page dynamic display "ABS" and "REL" from TCAS Control page. (thanks @slip)
- TCAS CONTROL page mode TA/RA/STBY (thanks @slip)
- Add TFC option to PFD overlay menu (thanks @slip)
- Add TFC option to MFD overlay menu (thanks @slip)
- add TFC state to MEM store buttons (thanks @slip)

## ⚠️ Known Issues
* SU5 Compat - because of huge changes in the underlying model behaviors to accommodate the new sim interaction system, there may be some bugs with interactions, including some missing sounds with buttons, some odd indications when hovering over a button or light, etc.
** The Lower CCP LONG Press does not work for reselecting charts - we will look further at this.
** B/C button throws an error in the FMC - do not use B/C for now.
* Some "lettered" or non-runway-specific approaches now appear as something like RNAV A - 00 and do not allow the selection of a landing runway, preventing using the Approach Refs page - this is something we will be working to address in the future.
* Some external applications that use the GPS/Flight plan SimVars may not function correctly or as expected when FP Sync is off.
* Loading and saving flights can have bad results.
* Custom liveries can render FADEC inoperative if they ship with a panel.cfg. Painters should reference our new [Repainter's Guide](https://www.workingtitle.aero/packages/cj4/guide/repainter) for solutions.
* Autopilot modes cannot be triggered via key bindings or controllers and must currently be triggered in the cockpit with the mouse. External binding applications are adding support for LVars and HEvents. Used SimVars are documented in our [Guide on SimVars](https://www.workingtitle.aero/packages/cj4/guides/simvars).
* Sometimes a heading to altitude instruction on takeoff will display further than the first RNAV fix on an RNAV departure procedure; in these cases the workaround is to cross-check the DP chart and remove the erroneous waypoint either by deleting the heading to altitude fix or dropping the first RNAV fix onto the magenta line in the LEGS page.
* Due to sim autopilot bank rate limitations, the aircraft may overshoot on certain RNP approaches with tight turns. If you encounter this, we recommend hand flying the approach with the given lateral and vertical guidance.
