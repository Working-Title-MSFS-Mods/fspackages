# Working Title CJ4 v0.6.0 Changes

Welcome to the latest update of the Working Title CJ4 (v0.6.0). Thank you to everyone who contributed to this release.

---

Demo video: TODO

Feel free to test out our new Simbrief Profile: [SIMBRIEF PROFILE](https://www.simbrief.com/system/dispatch.php?sharefleet=eyJ0cyI6IjE2MDI1MzkxMTUxODMiLCJiYXNldHlwZSI6IkMyNUMiLCJjb21tZW50cyI6IldPUktJTkcgVElUTEUgQ0o0IiwiaWNhbyI6IkMyNUMiLCJuYW1lIjoiQ0lUQVRJT04gQ0o0IiwiZW5naW5lcyI6IkZKNDQtNEEiLCJyZWciOiJONTI1V1QiLCJmaW4iOiIyNTQiLCJzZWxjYWwiOiIiLCJoZXhjb2RlIjoiIiwiY2F0IjoiTSIsInBlciI6IkIiLCJlcXVpcCI6IlNERTJFM0ZHSFJXWFlaIiwidHJhbnNwb25kZXIiOiJMQjEiLCJwYm4iOiJBMUIyQzJEMkQzTzJPM1MyIiwiZXh0cmFybWsiOiIiLCJtYXhwYXgiOiI3Iiwid2d0dW5pdHMiOiJMQlMiLCJvZXciOiIxMDI4MCIsIm16ZnciOiIxMjUwMCIsIm10b3ciOiIxNzExMCIsIm1sdyI6IjE1NjYwIiwibWF4ZnVlbCI6IjU3NjIiLCJwYXh3Z3QiOiIxNzAiLCJkZWZhdWx0Y2kiOiIiLCJmdWVsZmFjdG9yIjoiUDAwIiwiY3J1aXNlb2Zmc2V0IjoiUDAwMDAifQ--)

Check out our interim SoP doc: [Interim SoP Document](https://docs.google.com/document/d/15qb3g2ECsA8XH6gSbqbe5kGydNJ3Tj0j7vJPAWirwh4/edit?usp=sharing)


---

## Installation
Installation is easy, simply copy the `workingtitle-aircraft-cj4` folder inside the zip file to your MSFS Community folder. 

**Important: We recommend that you fully delete the previous `workingtitle-aircraft-cj4` folder before copying this release.**

## Key Features
* Overhauled PFD/MFD for better readability
* Added bearing pointers to PFD
* Mach number climbs work
* Transponder works
* Simbrief import fixes and error messages with database issues
* Proper altitude constraints (No VNAV yet) and arrival/approach sequencing.
* Added approach transitions for arrivals

### FMS
* Added proper input detection for Takeoff Ref Page
* QNH now automatically pulls from the PFD so there's no need to type it in
* Takeoff v-speeds and field length won't show if temperature or runway is not inputted
* Error messages for when the simbrief flight plan waypoint can't be found in sim database
* Added approach transitions for arrivals


### LEGS Page
* Proper altitude constraints for arrivals and approaches will be shown
* Adding an approach to an arrival should not put in 2 of the same fixes.

### TUNE Page
* Fixed a bug where swapping COM2 would swap COM1 instead
* Transponder now works (You must select it from the TCAS mode from STBY to TA/RA)

### PFD
* Better readability of target altitude
* Changed the target altitude bug to look like in the real plane
* The altitude select bug won't disappear when within 300ft of current altitude
* Baro setting is now easier to read
* Mach number will show correct value and 2 decimal places. (M0.71 vs M0.714)
* Mach number readout below airspeed tape is now easier to read.
* Added bearing pointers for FMS/VOR/ADF and accompanying data block
* Tuning radio from PFD was removed

### MFD
* Overhauled font, sizing, and positioning of upper engine readout displays for better readability and accuracy
* Fixed pitch trim indicator (was backward) and adjusted default trim position for better takeoff attitudes (Danice737)
* Fixed ISA temp deviation calculations (Temps should level off at 36,000 at the tropopause)
* FIxed battery amps displays so it's not -500 anymore (Electrical system still WIP) (Danice737)
* Added hydraulic pumps tied to N2 so they reach full normal pressure by 20% N2.



## Known Issues
* The speed constraints on arrivals may not show correctly because of database issues.
* After using Direct-To, the navigation will not always automatically sequence to the next fix and may enter ROL mode. You can re-activate NAV to navigate to the next fix if you encounter this issue.
* The aircraft is still using the built-in MSFS autopilot (for now). All the existing limitations of that still apply. It does behave a bit better with the various enhancements applied.
* Some flight plan distances may still be misreported when the approach is activated. Please log an issue if you encounter this with details.
* Some instances of the autopilot skipping approach waypoints still occur - this is deep in the sim handling of waypoints and is, for now, out of our hands. We will continue to research this.
