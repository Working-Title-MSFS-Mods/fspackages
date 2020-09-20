v0.2.0 RELEASE NOTES

Key Features:
-Fixed Direct To routing when attempting to go direct to IAF or enroute waypoints
-Enabled proper EXEC/CANCEL MOD function and removed the 'Activate' logic
-Created Custom Font and implemented across FMC, PFD and FMS
-Updated FMC Layout, Coloring, Keyboard Lighting; added message line and EXEC notification to FMC layout
-Fixed LEGS page listing to include all flight plan and approach waypoints
-Added PERF pages and functions, including takeoff, landing and fuel management
-Added IDX pages and functions, including progress pages, approach details
-Fixed PFD and MFD NAV BAR details
-Adjusted engine performance and fuel flow to more closely reflect reality (much more work to be done)
-Removed reverse thrust
-Eliminated erroneous cabin pressure alarms (will need to be remodeled later)

In Direct To Page:
1. Adjusted waypoint listing to show origin, departure, enroute, arrival and first approach fix
2. Added proper handling for activating a direct to the IAF in an approach without causing the plane to fly back to a prior fix and auto activating the approach from present position.
3. Added EXEC/CANCEL MOD logic to replace 'Activate' logic 

In LEGS Page:
1. Fixed errors in display of flight plan waypoints
2. Added approach waypoints to legs listing

In IDX/InitRefIndexPage:
1. Status Page - shows database, time, date 
2. GNSS Pos Page - shows current GPS Lat/Lon, date, time
3. PROG Page 1 - shows last, current, next and destination waypoints, distance in flight plan from current location and ETE
4. PROG Page 2 - shows current wind, headwind component, tailwind component, ISA DEV, flight plan cross track deviation and TAS
5. Database Initial Page now allows selecting waypoint from database
6. Database Airport Page now displays base data for any selected airport
7. Arrival Data Page now displays the selected approach airport, runway, runway elevation, approach type, approach name, frequency and approach course. 

In PERF/PerfInitPage:
1. Added Main Menu
2. Added Perf Init Page to set/read weight, fuel and cruise altitude
3. Added Takeoff Ref page 1 with working calculator for takeoff data for the selected departure runway, including wind, pressure altitude, runway condition, runway length
4. Added Takeoff Ref page 2 with calculated V speeds and calculated takeoff distance, including selectors for Flaps and Anti Ice state. Vspeeds can be sent to PFD and appear in magenta color when set by FMC.
5. Added Fuel Management page 1 calculating fuel remaining, displaying fuel flow, allowing setting of reserve fuel, showing endurance, range and endurance to reserve fuel and specific range.
6. Added Fuel Management page 2 showing fuel flow in each engine and fuel burned, with added 'reset initial fuel' button
7. Added Approach Ref page 1 with destination details, runway details and landing performance calculator, including headwind/crosswind components, runway condition, pressure altitude and temperature variables.
8. Added Approach Ref page 2 with calculated Vref and Vapp speeds and calculated landing field requirements and landing field available length. Vspeeds can be sent to PFD and appear in magenta color when set by FMC.

In TUN Page:
1. Updated layout and fields

In FPLN Page:
1. Updated layout and fields
2. Enabled first waypoint line management on page 1
3. Added EXEC/CANCEL MOD logic to replace 'Activate' logic 

In DEP/ARR Page:
1. Added EXEC/CANCEL MOD logic to replace 'Activate' logic 

In DSPL MENU Page:
1. Updated layout and established template (to do)

In MFD ADV Page:
1. Updated layout and established template (to do)

In PFD:
1. Removed erroneous display of GS/TAS from PFD Map
2. Fixed NAV BAR at bottom of PDF to display current accurate COM1 COM2 ATC1 RAT and UTC
3. Set AoA to only appear with Flaps 35
4. Added VRef(VRF) and Vapp(VAP) to the speed tape
5. Setup PFD coloring so that VSpeeds set by FMC are magenta and when manually set or edited they are set to cyan
6. Updated fonts to custom font

In MFD:
1. Removed erroneous display of GS/TAS from MFD Map
2. Fixed NAV BAR at bottom of MFD to display current accurate GS TAS RAT SAT and ISA DEV
3. Updated fonts to custom font
4. Removed bad CAS messages for PITOT and INERT SEP (more to do here...)

Misc:
1. Added YD functionality [credit: musurca]
2. Added/fixed many gear-related warnings [credit: musurca]
3. Improved exterior lighting (Landing/taxi light visibility) [credit: Uwajimaya]
