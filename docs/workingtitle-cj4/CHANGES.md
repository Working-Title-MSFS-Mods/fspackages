# Working Title CJ4 v0.4.0 Changes

Welcome to the latest update of the Working Title CJ4 (v0.4.0). This is still very much a beta. Thank you to everyone who contributed to this release. We have been hard at work behind the scenes to tackle some of the core flight management systems, so the number of changes is shorter this time, but still with some fun and important features and fixes. Overall, this bird should be a bunch more fun to fly.

Feel free to test out our new Simbrief Profile: [SIMBRIEF PROFILE](https://www.simbrief.com/system/dispatch.php?sharefleet=eyJ0cyI6IjE2MDI1MzkxMTUxODMiLCJiYXNldHlwZSI6IkMyNUMiLCJjb21tZW50cyI6IldPUktJTkcgVElUTEUgQ0o0IiwiaWNhbyI6IkMyNUMiLCJuYW1lIjoiQ0lUQVRJT04gQ0o0IiwiZW5naW5lcyI6IkZKNDQtNEEiLCJyZWciOiJONTI1V1QiLCJmaW4iOiIyNTQiLCJzZWxjYWwiOiIiLCJoZXhjb2RlIjoiIiwiY2F0IjoiTSIsInBlciI6IkIiLCJlcXVpcCI6IlNERTJFM0ZHSFJXWFlaIiwidHJhbnNwb25kZXIiOiJMQjEiLCJwYm4iOiJBMUIyQzJEMkQzTzJPM1MyIiwiZXh0cmFybWsiOiIiLCJtYXhwYXgiOiI3Iiwid2d0dW5pdHMiOiJMQlMiLCJvZXciOiIxMDI4MCIsIm16ZnciOiIxMjUwMCIsIm10b3ciOiIxNzExMCIsIm1sdyI6IjE1NjYwIiwibWF4ZnVlbCI6IjU3NjIiLCJwYXh3Z3QiOiIxNzAiLCJkZWZhdWx0Y2kiOiIiLCJmdWVsZmFjdG9yIjoiUDAwIiwiY3J1aXNlb2Zmc2V0IjoiUDAwMDAifQ--)

## Installation
Installation is easy, simply copy the `workingtitle-aircraft-cj4` folder inside the zip file to your MSFS Community folder. 

**Important: We recommend that you fully delete the previous `workingtitle-aircraft-cj4` folder before copying this release.**

## Key Features

* New custom engine fuel consumption model code based on FJ44 curves and pilot input
* Overhauled LEGS page for more flexibility and real unit functions (WIP)
* Many FPLN page bug fixes
* A few quality of life and critical bug fixes
* Overhaul of DEP/ARR pages and working STAR approaches (thanks @tscharlii)
* Added functional options in the UPR MENU

### Engine Model
* Engine fuel consumption model has been custom coded and replaces the sim fuel consumption. Fuel consumption, especially at cruise, should be much, much closer to published. Expect 1800-1850pph per side at ISA full power at sea level and 500-800pph per side at cruise, depending on altitude, mach, and power settings.
* Thrust now scales exponentially with N1 instead of linearly. Power settings should feel much more accurate.

### Flight Model
* Added gear drag (Was non-existent before)
* Greatly reduced spoiler drag & pitch down moment (You shouldn't be losing airspeed in a 30 degree nose down dive with the speedbrakes out)
* Reduced flap drag 

### LEGS Page
* Added ability to insert a new fix
* Added ability to remove whole segments by pressing LSK of one fix and then LSK of another
* Added ability to to direct-to a leg by pressing LSK of the fix and then dropping onto the magenta line
* Added ability to delete individual fixes
* Magenta fix distance updates distance to go as aircraft moves
* Fixed issue where unable to delete with a departure active
* Made the WORKING prompt more consistent
* Added feature to show runway where possible
* Disabled the ability to adjust approach fixes due to simulator limitations
* Each waypoint now shows the distance to the next fix instead of the cumulative flight plan distance.
* Blue waypoint is the FROM waypoint
* Magenta waypoint is the current TO waypoint
* Only fixes with an altitude or speed restriction will populate on the right side in green.  (It does not show cruise altitude anymore)

### FPLN Page
* Fixed issue where adding via airway would not add all fixes along airway to flight plan
* Fixed issue where a blank line was not always provided to add a fix
* Condensed display to only show airway entry and exit as per the real unit
* Fixed issue where VIA was not displayed on page 2+
* Fixed issue where attempting to delete the first fix on page 1 would insert CLRIC
* Fixed issue where unable to delete with a departure active

### DEP/ARR Pages
* Proper formatting and flow of DEP/ARR pages (thanks @tscharlii)
* Fixed scrolling through procedures and runways (thanks @tscharlii)
* STAR approaches should now work properly (thanks @tscharlii)

### FUEL MGMT Page
* Total fuel used now initialized to its starting point when the FMC loads

### TUNE Page
* Page now updates and syncs back radio changes made from other instruments or the simulator

### PFD/MFD
* Fixed issue where ILS localizers reporting DME distance as strings would crash the displays
* Show animated radar bug
* MFD Checklists have been added
* Pax Brief Menu has been added (Unfortunately, no sounds for it yet, next release)
* Added FMS Text option (this essentially displays the PROG page on the MFD)
* Added functional PASS BRIEF, CHECKLIST, and SYS buttons on the CCP (Cursor Control Panel)

### Audio
* Improved BELT button audio (Currently the chime is non-functional for this.  Fix soon)
* Added SAFETY button chime and announcement and also chime when you turn the SAFETY and BELT buttons off.
* Increased volume of pilot and co-pilot fan air sounds

## Known Issues
* Modifications of the flight plan can be slow at times. The cause for this is Asobo's FacilityLoader which they need to fix. When the FMC shows "Working..." it indicates an operation is in progress.
* Sometimes when entering an airway and the exit fix, the airway name will change to the shared airway, however the routing is still correct.
* You cannot currently select Direct-To of a fix on your approach that is not the initial approach fix. This is a limitation of the sim flightplan system at present. We are currently overhauling the flight plan management system to allow for much more flexibility and stability.
* After using Direct-To, the navigation will not always automatically sequence to the next fix and may enter ROL mode. You can re-activate NAV to navigate to the next fix if you encounter this issue.
* The aircraft is still using the built-in MSFS autopilot (for now). All the existing limitations of that still apply. It does behave a bit better with the various enhancements applied.
* Performance pages don't currently have input error handling for wind, temp or QNH. These values must be entered correctly and completly in the proper format for the page to work. Note that valid wind directions are 001 through 360 as of now.
* FLC stability appears to have regressed with the autopilot aircraft energy calculation changes in 1.9.3. We have attempted tuning the autopilot PIDs but as of right now the behavior of the underlying sim FLC PID itself seems to be at issue. We will continue to investigate.
