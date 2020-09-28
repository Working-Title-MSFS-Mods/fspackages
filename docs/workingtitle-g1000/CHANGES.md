# Changes in this version

## Main features

* Added track-up mode for both PFD and MFD
* Fixed unwanted U-turn on ACTIVATE APPROACH
* Fixed reversed behavior of NOSE UP/DN buttons in FLC mode
* Added HPa mode to altimeter
* Added a preference saving system tied to plane model
* Configured it to currently preserve the following settings:
  * PFD and MFD brightness
  * V Speeds
  * Track up mode
  * Barometer mode
  * HSI settings for BRG1, BRG2, and DME
* Support loading plane configuration information even in encrypted planes
* Detect hardware avionics knobs in all models and configure them automatically
* Added support for additional XML-configurable ENGINE pages on MFD
* Lots of changes to colors and styling to closer match reality

## PFD and MFD enhancements

* Added new vertical column tape gauge for engine display
* Updated circular gauge to support custom gradations and rounding
* Added a flight path marker on the PFD when in Syn Vis mode above 30kts
* Correctly handle wind data when on ground or wind speed <1 knot
* Fixed reversed wind arrow at all times on MFD
* Improve MFD soft key menus, including new switch for TRACK UP
* Increased MFD max range to 2000 with more intermediate steps
* Move weather radar to MAP page group, only show if radar is on board
* Change brightness of PFD/MFD knobs and softkeys along with display

## Styling improvements
* Change PFD and MFD headers to more closely match the real font size, spacing, and colour
* More accurate colors on attitude indicator, horizon, and map; new gradient on horizon
* Updated flight director and attitude arrows
* Updated styling of airport waypoint info page (more to come)
* Updated styling of softkey menus to be more realistic

## Miscellaneous

* Added sample engine page configuration for G36 Bonanza
* Fix false DON'T SINK alert when flying patterns / touch and goes
* Improve representation of whole numbers as decimals