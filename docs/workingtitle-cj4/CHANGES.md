# Working Title CJ4 v0.2.0 Changes

Welcome to the initial and very much beta release of the Working Title CJ4. Thank you to everyone who contributed to this release. We are all very excited to get this release in your hands, which offers a ton of improvement over the stock MSFS CJ4, focusing heavily on the FMC functionality, but with a number of other changes and improvements. There is a lot that has been added and a lot more to do still!

## Installation
Installation is easy, simply copy the `workingtitle-aircraft-cj4` folder inside the zip file to your MSFS Community folder.

## Key Features
* Fixed Direct To routing when attempting to go direct to IAF or enroute waypoints
* Enabled proper EXEC/CANCEL MOD function and removed the 'Activate' logic
* Created Custom Font and implemented across FMC, PFD and FMS
* Updated FMC Layout, Coloring, Keyboard Lighting; added message line and EXEC notification to FMC layout
* Fixed LEGS page listing to include all flight plan and approach waypoints
* Added PERF pages and functions, including takeoff, landing and fuel management
* Added IDX pages and functions, including progress pages, approach details
* Fixed PFD and MFD NAV BAR details
* Adjusted engine performance and fuel flow to more closely reflect reality (much more work to be done)
* Removed reverse thrust
* Eliminated erroneous cabin pressure alarms (will need to be remodeled later)

### Direct To Page
* Adjusted waypoint listing to show origin, departure, enroute, arrival and first approach fix
* Added proper handling for activating a direct to the IAF in an approach without causing the plane to fly back to a prior fix and auto activating the approach from present position.
* Added EXEC/CANCEL MOD logic to replace 'Activate' logic 

### LEGS Page
* Fixed errors in display of flight plan waypoints
* Added approach waypoints to legs listing

### IDX / INIT REF Index Page
* Status Page - shows database, time, date 
* GNSS Pos Page - shows current GPS Lat/Lon, date, time
* PROG Page 1 - shows last, current, next and destination waypoints, distance in flight plan from current location and ETE
* PROG Page 2 - shows current wind, headwind component, tailwind component, ISA DEV, flight plan cross track deviation and TAS
* Database Initial Page now allows selecting waypoint from database
* Database Airport Page now displays base data for any selected airport
* Arrival Data Page now displays the selected approach airport, runway, runway elevation, approach type, approach name, frequency and approach course. 

### PERF / PERF INIT
* Added Main Menu
* Added Perf Init Page to set/read weight, fuel and cruise altitude
* Added Takeoff Ref page 1 with working calculator for takeoff data for the selected departure runway, including wind, pressure altitude, runway condition, runway length
* Added Takeoff Ref page 2 with calculated V speeds and calculated takeoff distance, including selectors for Flaps and Anti Ice state. Vspeeds can be sent to PFD and appear in magenta color when set by FMC.
* Added Fuel Management page 1 calculating fuel remaining, displaying fuel flow, allowing setting of reserve fuel, showing endurance, range and endurance to reserve fuel and specific range.
* Added Fuel Management page 2 showing fuel flow in each engine and fuel burned, with added 'reset initial fuel' button
* Added Approach Ref page 1 with destination details, runway details and landing performance calculator, including headwind/crosswind components, runway condition, pressure altitude and temperature variables.
* Added Approach Ref page 2 with calculated Vref and Vapp speeds and calculated landing field requirements and landing field available length. Vspeeds can be sent to PFD and appear in magenta color when set by FMC.

### TUN Page
* Updated layout and fields

### FPLN Page
* Updated layout and fields
* Enabled first waypoint line management on page 1
* Added EXEC/CANCEL MOD logic to replace 'Activate' logic 

### DEP/ARR Page
* Added EXEC/CANCEL MOD logic to replace 'Activate' logic 

### DSPL MENU Page
* Updated layout and established template (to do)

### MFD ADV Page
* Updated layout and established template (to do)

### PFD
* Removed erroneous display of GS/TAS from PFD Map
* Fixed NAV BAR at bottom of PDF to display current accurate COM1 COM2 ATC1 RAT and UTC
* Set AoA to only appear with Flaps 35
* Added VRef(VRF) and Vapp(VAP) to the speed tape
* Setup PFD coloring so that VSpeeds set by FMC are magenta and when manually set or edited they are set to cyan
* Updated fonts to custom font

### MFD
* Removed erroneous display of GS/TAS from MFD Map
* Fixed NAV BAR at bottom of MFD to display current accurate GS TAS RAT SAT and ISA DEV
* Updated fonts to custom font
* Removed bad CAS messages for PITOT and INERT SEP (more to do here...)

### Misc
* Added YD functionality (**credit: musurca**)
* Added/fixed many gear-related warnings (**credit: musurca**)
* Improved exterior lighting (Landing/taxi light visibility) (**credit: Uwajimaya**)

## Known Issues
* The autopilot will disconnect LNAV mode and go to ROLL mode upon reaching an enroute Direct-To waypoint. The workaround is re-engaging NAV mode and the flight plan will resume.
* You cannot currently select Direct-To of a fix on your approach that is not the initial approach fix. This is a limitation of the sim flightplan system at present. We are investigating solutions to this issue.
* There are cosmetic issues regarding the PFD and MFD (shapes, text, alignments). The PFD and MFD have not gotten a full layout overhaul as of this time.
* The aircraft is still using the built-in MSFS autopilot (for now). All the existing limitations of that still apply. It does behave a bit better with the engine performance changes.
* Landing Weight Calculation has not been smoothed and will show erronious values when in takeoff and on the ground, and will show "-----" when on the ground or in situations where the distance to the destination is unavailable.
