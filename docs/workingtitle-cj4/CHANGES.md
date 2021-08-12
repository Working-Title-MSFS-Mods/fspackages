# Working Title CJ4 v0.12.7
Welcome to the Working Title CJ4 v0.12.7. This version brings some post MSFS Sim Update 5 fixes.

Thanks to everyone, as always, for your contributions! We really love working with you all.

## SU5 Compatibility
Please note that the core sim interaction/model behaviors have changed dramatically with SU5, and there is a new interaction system. See the Known Issues for some issues with this. We highly recommend using the new LOCK Cockpit Interaction System with Instrument Tooltips off. To access these settings, go to Options -> General Options -> Accessibility.

## SU5 Compatibility
Please note that the core sim interaction/model behaviors have changed dramatically with SU5, and there is a new interaction system. See the Known Issues for some issues with this. We highly recommend using the new LOCK Cockpit Interaction System with Instrument Tooltips off. To access these settings, go to Options -> General Options -> Accessibility.


## READ THE GUIDE
Please, please, please read the guide for instructions on using features. A lot of hard work went into writing the guide and the Discord channels are clogged with questions that are readily answered in the guide.

GUIDE: https://docs.google.com/document/d/1qzxPMTSQRkvau8QOi7xUqNvjx9rbww_qHlso5AT5OnI

## Installation
Installation is easy, simply copy the `workingtitle-aircraft-cj4` folder inside the zip file to your MSFS Community folder. 

**Important: We recommend that you fully delete the previous `workingtitle-aircraft-cj4` folder before copying this release.**

# General Changes
- Adjusted maximum screen brightness
- Fix Baro Knob animation and function
- Adjusted scale of PPOS/PLAN map modes so distances are more accurate again in relation to the range rings
- Fix Lower CCP knob long press for reselecting charts in LOCK mode
- Fix entering ABOVE/BELOW restrictions results in wrong order of A/B 
- SimBrief import now skips waypoints it was not able to import but continues the process (thanks @billtt)

## ⚠️ Known Issues
* SU5 Compat - because of huge changes in the underlying model behaviors to accommodate the new sim interaction system, there may be some bugs with interactions, including some missing sounds with buttons, some odd indications when hovering over a button or light, etc.
* The joystick used for panning charts does not work in Legacy interaction mode
* B/C button throws an error in the FMC - do not use B/C for now.
* Some "lettered" or non-runway-specific approaches now appear as something like RNAV A - 00 and do not allow the selection of a landing runway, preventing using the Approach Refs page - this is something we will be working to address in the future.
* Some external applications that use the GPS/Flight plan SimVars may not function correctly or as expected when FP Sync is off.
* Loading and saving flights can have bad results.
* Custom liveries can render FADEC inoperative if they ship with a panel.cfg. Painters should reference our new [Repainter's Guide](https://www.workingtitle.aero/packages/cj4/guide/repainter) for solutions.
* Autopilot modes cannot be triggered via key bindings or controllers and must currently be triggered in the cockpit with the mouse. External binding applications are adding support for LVars and HEvents. Used SimVars are documented in our [Guide on SimVars](https://www.workingtitle.aero/packages/cj4/guides/simvars).
* Due to sim autopilot bank rate limitations, the aircraft may overshoot on certain RNP approaches with tight turns. If you encounter this, we recommend hand flying the approach with the given lateral and vertical guidance.
