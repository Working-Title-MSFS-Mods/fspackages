# Working Title CJ4 v0.4.0 Changes

Welcome to the latest update of the Working Title CRJ (v0.4.0). This is still very much a beta. Thank you to everyone who contributed to this release. We have been hard at work behind the scenes to tackle some of the core flight management systems, so the number of changes is shorter this time, but still with some fun and important features and fixes. Overall, this bird should be a bunch more fun to fly.

## Installation
Installation is easy, simply copy the `workingtitle-aircraft-cj4` folder inside the zip file to your MSFS Community folder. **Important: We recommend that you fully delete the previous `workingtitle-aircraft-cj4` folder before copying this release.**

## Key Features

* New custom engine fuel consumption model code based on FJ44 curves and pilot input
* Overhauled LEGS page for more flexibility and real unit functions (WIP)
* Many FPLN page bug fixes
* A few quality of life and critical bug fixes

### Engine Model
* Engine fuel consumption model has been custom coded and replaces the sim fuel consumption. Fuel consumption, especially at cruise, should be much, much closer to published. Expect 1800-1850pph per side at ISA full power and 500-800pph per side at cruise, depending on altitude, mach, and power settings.
* Thrust now scales exponentially with N1 instead of linearly. Power settings based on throttle position

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

### FPLN Page
* Fixed issue where adding via airway would not add all fixes along airway to flight plan
* Fixed issue where a blank line was not always provided to add a fix
* Condensed display to only show airway entry and exit as per the real unit
* Fixed issue where VIA was not displayed on page 2+
* Fixed issue where attempting to delete the first fix on page 1 would insert CLRIC
* Fixed issue where unable to delete with a departure active

### FUEL MGMT Page
* Total fuel used now initialized to its starting point when the FMC loads

### TUNE Page
* Page now updates and syncs back radio changes made from other instruments or the simulator

### FMC Performance
* Attempted to work around the Asobo facility loader performance issues. Performance should be improved in most scenarios now.

### PFD/MFD
* Fixed issue where ILS localizers reporting DME distance as strings would crash the displays

## Known Issues
* You cannot currently select Direct-To of a fix on your approach that is not the initial approach fix. This is a limitation of the sim flightplan system at present. We are currently overhauling the flight plan management system to allow for much more flexibility and stability.
* After using Direct-To, the navigation will not always automatically sequence to the next fix and may enter ROL mode. You can re-activate NAV to navigate to the next fix if you encounter this issue.
* The aircraft is still using the built-in MSFS autopilot (for now). All the existing limitations of that still apply. It does behave a bit better with the various enhancements applied.
* Performance pages don't currently have input error handling for wind, temp or QNH. These values must be entered correctly and completly in the proper format for the page to work. Note that valid wind directions are 001 through 360 as of now.
* FLC stability appears to have regressed with the autopilot aircraft energy calculation changes in 1.9.3. We have attempted tuning the autopilot PIDs but as of right now the behavior of the underlying sim FLC PID itself seems to be at issue. We will continue to investigate.
