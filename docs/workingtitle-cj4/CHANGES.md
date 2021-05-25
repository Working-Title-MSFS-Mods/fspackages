# Working Title CJ4 v0.12.5
Welcome to the Working Title CJ4 v0.12.5. 

This versions brings compatibility to SimUpdate 4.

We've also again received great code contributions by developers from the community. Thank you very much all!
Besides that we've added a basic implementation for traffic display (TFC) and TCAS Control options in the FMS. TA/RA advisories are not implemented yet.


## READ THE GUIDE
Please, please, please read the guide for instructions on using features. A lot of hard work went into writing the guide and the Discord channels are clogged with questions that are readily answered in the guide.

GUIDE: https://docs.google.com/document/d/1qzxPMTSQRkvau8QOi7xUqNvjx9rbww_qHlso5AT5OnI

## Installation
Installation is easy, simply copy the `workingtitle-aircraft-cj4` folder inside the zip file to your MSFS Community folder. 

**Important: We recommend that you fully delete the previous `workingtitle-aircraft-cj4` folder before copying this release.**

# Changes

- Added Traffic Display (TFC) to the PFD and MFD 
- Added "ALT TAG" option on the FMS TCAS CONTROL page
- Added ABOVE/NORM/BELOW options on the FMS TCAS CONTROL page
- ... TODO ... dont forget to credit contributors

## ⚠️ Known Issues
* In the latest versions of Navigraph data, some "lettered" or non-runway-specific approaches now appear as something like RNAV A - 00 and do not allow the selection of a landing runway, preventing using the Approach Refs page - this is something we will be working to address in the future.
* Some external applications that use the GPS/Flight plan SimVars may not function correctly or as expected when FP Sync is off.
* Loading and saving flights can have bad results.
* Custom liveries can render FADEC inoperative if they ship with a panel.cfg. Painters should reference the new [REPAINT_README.md](https://github.com/Working-Title-MSFS-Mods/fspackages/blob/main/docs/workingtitle-cj4/REPAINT_README.md) file included in the docs folder of the Github repository.
* Autopilot modes cannot be triggered via key bindings or controllers and must currently be triggered in the cockpit with the mouse. External binding applications are adding support for LVars and HEvents. Used SimVars are documented [here](https://github.com/Working-Title-MSFS-Mods/fspackages/wiki/Sim-Variables)
* Sometimes a heading to altitude instruction on takeoff will display further than the first RNAV fix on an RNAV departure procedure; in these cases the workaround is to cross-check the DP chart and remove the erroneous waypoint either by deleting the heading to altitude fix or dropping the first RNAV fix onto the magenta line in the LEGS page.
* Due to sim autopilot bank rate limitations, the aircraft may overshoot on certain RNP approaches with tight turns. If you encounter this, we recommend hand flying the approach with the given lateral and vertical guidance.
