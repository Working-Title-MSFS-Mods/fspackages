# Working Title CJ4 v0.12.1
Welcome to the Working Title CJ4 v0.12.1. This version brings a boatload of bug fixes and tweaks, including a new custom vertical autopilot that has allowed us to add altitude capture for PTCH mode, TO/GA modes and improve the altitude capture mechanics of the autopilot.

## READ THE GUIDE
Please, please, please read the guide for instructions on using features. A lot of hard work went into writing the guide and the Discord channels are clogged with questions that are readily answered in the guide.

GUIDE: https://docs.google.com/document/d/1qzxPMTSQRkvau8QOi7xUqNvjx9rbww_qHlso5AT5OnI

## Installation
Installation is easy, simply copy the `workingtitle-aircraft-cj4` folder inside the zip file to your MSFS Community folder. 

**Important: We recommend that you fully delete the previous `workingtitle-aircraft-cj4` folder before copying this release.**

# Changes

- Fixed bugs with parsing TUN page inputs.
- Minor cleanup on DSPL MENU FMC page.
- Fixed bugs with leg altitude (constraint) parsing to address some incorrect constraints in some European approaches.
- Fix for erroneous sim autopilot altitude capture when using a hardware button tied to all the altitude slots and not just slot 1.
- Fix for some erroneous situations where VNAV PATH kicks you to PTCH incorrectly.
- Fix for sequencing missed approach on Go-Around after a new approach is selected.

## ⚠️ Known Issues
* In the latest versions of Navigraph data, some "lettered" or non-runway-specific approaches now appear as something like RNAV A - 00 and do not allow the selection of a landing runway, preventing using the Approach Refs page - this is something we will be working to address in the future.
* Some external applications that use the GPS/Flight plan SimVars may not function correctly or as expected when FP Sync is off.
* Loading and saving flights can have bad results.
* Custom liveries can render FADEC inoperative if they ship with a panel.cfg. Painters should reference the new [REPAINT_README.md](https://github.com/Working-Title-MSFS-Mods/fspackages/blob/main/docs/workingtitle-cj4/REPAINT_README.md) file included in the docs folder of the Github repository.
* Autopilot modes cannot be triggered via key bindings or controllers and must currently be triggered in the cockpit with the mouse. External binding applications are adding support for LVars and HEvents. Used SimVars are documented [here](https://github.com/Working-Title-MSFS-Mods/fspackages/wiki/Sim-Variables)
* Sometimes a heading to altitude instruction on takeoff will display further than the first RNAV fix on an RNAV departure procedure; in these cases the workaround is to cross-check the DP chart and remove the erroneous waypoint either by deleting the heading to altitude fix or dropping the first RNAV fix onto the magenta line in the LEGS page.
* Due to sim autopilot bank rate limitations, the aircraft may overshoot on certain RNP approaches with tight turns. If you encounter this, we recommend hand flying the approach with the given lateral and vertical guidance.
