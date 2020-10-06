# Working Title CJ4 v0.3.1 Changes

Welcome to the latest update of the Working Title CRJ (v0.4.0). This is still very much a beta. Thank you to everyone who contributed to this release. We have been hard at work behind the scenes to tackle some of the core flight management systems, so the number of changes is shorter this time, but still with some fun and important features and fixes.

## Installation
Installation is easy, simply copy the `workingtitle-aircraft-cj4` folder inside the zip file to your MSFS Community folder. **Important: We recommend that you fully delete the previous `workingtitle-aircraft-cj4` folder before copying this release.**

## Key Features

* New custom engine fuel consumption model code based on FJ44 curves and pilot input
* Overhauled LEGS page for more flexibility and real unit functions (WIP)
* A few quality of life and critical bug fixes

### Engine Model
* Engine fuel consumption model has been custom coded and replaces the sim fuel consumption. Fuel consumption, especially at cruise, should be much, much closer to published. Expect 1800-1850pph per side at ISA full power and 500-800pph per side at cruise, depending on altitude, mach, and power settings.

### LEGS Page
* Added ability to insert a new fix
* Added ability to remove whole segments by pressing LSK of one fix and then LSK of another
* Added ability to to direct-to a leg by pressing LSK of the fix and then dropping onto the magenta line
* Added ability to delete individual fixes
* Magenta fix distance updates distance to go as aircraft moves

### FUEL MGMT Page
* Total fuel used now initialized to its starting point when the FMC loads

### TUNE Page
* Page now updates and syncs back radio changes made from other instruments or the simulator

### PFD/MFD
* Fixed issue where ILS localizers reporting DME distance as strings would crash the displays

## Known Issues
* You cannot currently select Direct-To of a fix on your approach that is not the initial approach fix. This is a limitation of the sim flightplan system at present. We are currently overhauling the flight plan management system to allow for much more flexibility and stability.
* After using Direct-To, the navigation will not always automatically sequence to the next fix and may enter ROL mode. You can re-activate NAV to navigate to the next fix if you encounter this issue.
* The aircraft is still using the built-in MSFS autopilot (for now). All the existing limitations of that still apply. It does behave a bit better with the various enhancements applied.
* Performance pages don't currently have input error handling for wind, temp or QNH. These values must be entered correctly and completly in the proper format for the page to work. Note that valid wind directions are 001 through 360 as of now.
* FLC stability appears to have regressed with the autopilot aircraft energy calculation changes in 1.9.3. We have attempted tuning the autopilot PIDs but as of right now the behavior of the underlying sim FLC PID itself seems to be at issue. We will continue to investigate.
