# Working Title CJ4 v0.4.1 Changes

Welcome to the latest update of the Working Title CJ4 (v0.4.1). This is still very much a beta. Thank you to everyone who contributed to this release.

Feel free to test out our new Simbrief Profile: [SIMBRIEF PROFILE](https://www.simbrief.com/system/dispatch.php?sharefleet=eyJ0cyI6IjE2MDI1MzkxMTUxODMiLCJiYXNldHlwZSI6IkMyNUMiLCJjb21tZW50cyI6IldPUktJTkcgVElUTEUgQ0o0IiwiaWNhbyI6IkMyNUMiLCJuYW1lIjoiQ0lUQVRJT04gQ0o0IiwiZW5naW5lcyI6IkZKNDQtNEEiLCJyZWciOiJONTI1V1QiLCJmaW4iOiIyNTQiLCJzZWxjYWwiOiIiLCJoZXhjb2RlIjoiIiwiY2F0IjoiTSIsInBlciI6IkIiLCJlcXVpcCI6IlNERTJFM0ZHSFJXWFlaIiwidHJhbnNwb25kZXIiOiJMQjEiLCJwYm4iOiJBMUIyQzJEMkQzTzJPM1MyIiwiZXh0cmFybWsiOiIiLCJtYXhwYXgiOiI3Iiwid2d0dW5pdHMiOiJMQlMiLCJvZXciOiIxMDI4MCIsIm16ZnciOiIxMjUwMCIsIm10b3ciOiIxNzExMCIsIm1sdyI6IjE1NjYwIiwibWF4ZnVlbCI6IjU3NjIiLCJwYXh3Z3QiOiIxNzAiLCJkZWZhdWx0Y2kiOiIiLCJmdWVsZmFjdG9yIjoiUDAwIiwiY3J1aXNlb2Zmc2V0IjoiUDAwMDAifQ--)

## Installation
Installation is easy, simply copy the `workingtitle-aircraft-cj4` folder inside the zip file to your MSFS Community folder. **Important: We recommend that you fully delete the previous `workingtitle-aircraft-cj4` folder before copying this release.**

## Key Features

* Added Passenger Briefing Announcements (accessed from MFD Upper Menu and PASS BRIEF BUTTON)
* Fixed bugs with engine thrust when engines off ([#222](https://github.com/Working-Title-MSFS-Mods/fspackages/issues/222))
* Adjusted flight dynamics to minimize (but not eliminate) the AP porpoising effect ([#163](https://github.com/Working-Title-MSFS-Mods/fspackages/issues/163))
* Fixed V Speed bug (where v speeds would become stuck at -1 after landing)
* Updated CAS messages ([#242](https://github.com/Working-Title-MSFS-Mods/fspackages/issues/242))
* Sound Updates/Fixes
* FMS Bug Fixes

### Engine Model
* Thrust when engines off bug squashed ([#222](https://github.com/Working-Title-MSFS-Mods/fspackages/issues/222))

### Flight Model
* Adjusted elevator trim effectiveness to reduce porpoising and facilitate (careful) FLC usage

### LEGS Page
* Fixed Direct to IAF from LEGS page ([#220](https://github.com/Working-Title-MSFS-Mods/fspackages/issues/220))
* Fixed approach waypoint display in LEGS page ([#220](https://github.com/Working-Title-MSFS-Mods/fspackages/issues/220))

### FPLN Page
* Fixed bug when adding airways ([#226](https://github.com/Working-Title-MSFS-Mods/fspackages/issues/226)) (thanks [@tscharlii](https://github.com/tscharlii) )
* Fixed bug where invalid waypoints didn't always cause an error

### PERF Page
* Added input filters for QNH on takeoff and landing perf pages (user can now enter 29.92, 299 or 2992)
* Added protection for TAKEOFF and APPROACH REF pages when no runway is selected (error message will appear)
* Fixed weights 

### PFD/MFD
* Fixed FMS Text distances on MFD ([#232](https://github.com/Working-Title-MSFS-Mods/fspackages/issues/232))
* Added PASS BRIEF announcments
* Fixed V Speed bug where some speeds were locked at -1 after a segment ([#221](https://github.com/Working-Title-MSFS-Mods/fspackages/issues/221))
* Fixed MFD plane not centered on map ([#219](https://github.com/Working-Title-MSFS-Mods/fspackages/issues/219))
* Updated CAS messages for Pitot Heat, Parking Break and Oxy Masks ([#242](https://github.com/Working-Title-MSFS-Mods/fspackages/issues/242) and [#183](https://github.com/Working-Title-MSFS-Mods/fspackages/issues/183))

### Audio
* Fixed no chime when playing seatbelt announcement
* Fixed erronious chimes when setting battery master to on
* Fixed sounds for internal/external view swaps/fixed passenger sounds stopping when switching to outside view
* Added passenger briefing announcements (MFD)
* Fixed announcments to restrict to only one announcement at a time
* Improvements to climate control knob sound

## Known Issues
* Sometimes when entering an airway and the exit fix, the airway name will change to the shared airway, however the routing is still correct.
* You cannot currently select Direct-To of a fix on your approach that is not the initial approach fix. This is a limitation of the sim flightplan system at present. We are currently overhauling the flight plan management system to allow for much more flexibility and stability.
* After using Direct-To, the navigation will not always automatically sequence to the next fix and may enter ROL mode. You can re-activate NAV to navigate to the next fix if you encounter this issue.
* The aircraft is still using the built-in MSFS autopilot (for now). All the existing limitations of that still apply. It does behave a bit better with the various enhancements applied.
* FLC stability appears to have regressed with the autopilot aircraft energy calculation changes in 1.9.3. We have made some improvements to this behavior in this update. We will continue to investigate after the 13 October 2020 patch is released.
