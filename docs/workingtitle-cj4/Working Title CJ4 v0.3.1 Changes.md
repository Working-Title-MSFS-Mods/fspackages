# Working Title CJ4 v0.3.1 Changes

Welcome to the latest update of the Working Title CRJ (v0.3.1). This is still very much a beta. Thank you to everyone who contributed to this release. This update focuses on compatibility with MSFS 1.9.3, but also includes a few new features and quality of life updates as well.

## Installation
Installation is easy, simply copy the `workingtitle-aircraft-cj4` folder inside the zip file to your MSFS Community folder. **Important: Due to some file location changes in the latest MSFS version, it is mandatory that you fully delete the previous `workingtitle-aircraft-cj4` folder before copying this release.**

## Key Features

* Now compatible with MSFS 1.9.3

### FPLN Page
* Incorrect page numbering has been fixed
* Added colors to selected SIDS/Runways for DEP page only (WIP due to 1.9.3 patch)
* Added ability to insert waypoints in the middle of the flight plan
* Fixed issue where FPLN would always return to page 1 after EXEC

### DEP/ARR Page
* Executing a change doesn’t move you away from the page
* Improved formatting

### LEGS Page
* Adjusted layout and colors to better match the real unit

### TUNE Page
* Fixed issue where nav radios would not update the sim radios on update

### PFD/MFD
* Adjusted font size, color, and spacing for better readability and accuracy

### PFD
* Added DME readout for VORs
* Changed to use correct colors (Magenta for FMS, green for ground NAVAIDS)
* Changed formatting of VOR info block to match the correct layout and element spacing

### Aircraft Exterior Model
* Aircraft lights have been updated in style to add some lens flaring, brighter visibility, and textures (thanks @Uwajimaya)

## Known Issues
* You cannot currently select Direct-To of a fix on your approach that is not the initial approach fix. This is a limitation of the sim flightplan system at present. We are investigating solutions to this issue.
* After using Direct-To, the navigation will not always automatically sequence to the next fix and may enter ROL mode. You can re-activate NAV to navigate to the next fix if you encounter this issue.
* The aircraft is still using the built-in MSFS autopilot (for now). All the existing limitations of that still apply. It does behave a bit better with the various enhancements applied.
* TUN page doesn't update automatically when radios are updated externally - reopening the TUN page will reflect these changes.
* Performance pages don't currently have input error handling for wind, temp or QNH. These values must be entered correctly and completly in the proper format for the page to work. Note that valid wind directions are 001 through 360 as of now.
* FLC stability appears to have regressed with the autopilot aircraft energy calculation changes in 1.9.3. We have attempted tuning the autopilot PIDs but as of right now the behavior of the underlying sim FLC PID itself seems to be at issue. We will continue to investigate.
