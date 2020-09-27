# Working Title CJ4 v0.3.0 Changes

Welcome to the second installment of the Working Title CRJ (v0.3.0). This is still very much a beta. Thank you to everyone who contributed to this release. This update focuses on a number of fixes to the prior version, but also includes quite a number of new features.

Demo Video: https://youtu.be/xO29LNrNY-8

## Installation
Installation is easy, simply copy the `workingtitle-aircraft-cj4` folder inside the zip file to your MSFS Community folder.

## Key Features
* Complete rebuild of templating system to accommodate FMS3000 specific formatting 'quirks' including inconsistent page numbering, inconsistent indenting, etc.
* Enhanced EXEC, ACT/MOD and Message handling and resolved several EXEC related bugs.
* Added AoA ON/OFF/AUTO PFD Menu Line and adjusted AoA Show/Hide logic.
* Updated LEGS page Layout
* Built new FPLN pages
* Further enhanced PERF pages, added temporary landing weight calculation (to be further refined with actual performance prediction)
* Added additional IDX pages, including DATABASE pages allowing lookup of any navaid in the database
* Improved autopilot handling with special attention to FLC mode (works much better for managing climb and descent speed, but still is flaky if enabled shortly after takeoff)
* Added functionality to several in-cockpit knobs and switches
* Added aircon/fan sounds as well as seatbelt announcement
* Improved cockpit lighting
* Added externally visible cabin lighting
* Added DSPL MENU & MFD ADV pages and functionality, including the ability to turn on/off supported map features and step through flight plan waypoints on PLAN view
* Improved TUN page handling of frequencies, including parsing 8.33/25khz spacing properly

### Direct To Page
* Improved formatting

### LEGS Page
* Improved formatting

### IDX / INIT REF Index Page
* Updated all templates, indents, titles and fonts throughout the pages and menus
* PROG Page 1 - updated PROG page to protect against errors
* PROG Page 2 - shows current wind, headwind component, tailwind component, ISA DEV, flight plan cross track deviation and TAS
* Database Pages now work for all waypoint types (Airport, VOR, NDB, RNAV Waypoints)

### PERF / PERF INIT
* Updated all templates, indents, titles and fonts throughout the pages and menus
* Updated takeoff and landing calculations
* Added further error protection on all PERF pages
* Updated landing weight to a calculated field (to be enhanced further)
* Takeoff and landing weights will turn yellow when they have exceeded the maximum values

### TUN Page
* Updated layout and fields
* Added shorthand inputs and all valid frequencies should be enterable

### FPLN Page
* Updated all templates, indents, titles and fonts throughout the pages and menus
* Improved EXEC, ACT/MOD and Message logic 

### DEP/ARR Page
* Updated all templates, indents, titles 

### DSPL MENU Page
* DSPL MENU on FMC now allows you to toggle intersections, navaids, airports, and flight plan altitude restrictions onto the PFD and MFD displays

### MFD ADV Page
* MFD ADV on FMC now allows you to cycle through flight plan waypoints on the MFD PLAN page

### PFD
* Updated NAV BAR at bottom of PFD to display UTC with HH:MM:SS
* Adjusted PFD menu to remove inaccurate 'units' submenu and add AOA menu item allowing AoA to be on AUTO, ON or OFF. Auto keeps Flaps 35 logic, ON turns AoA on for all phases of flight and OFF removes the AoA for all phases of flight.
* Enabled viewing of intersections, navaids, airports, and flight plan altitude restrictions on the MFD and PFD

### MFD
* Enabled stepping through waypoints in PLAN mode via MFD ADV page on FMS
* Enabled viewing of intersections, navaids, airports, and flight plan altitude restrictions on the MFD and PFD

### Misc
* Improved Autopilot handling, specifically for FLC mode (**credit: wizzlebippi**)
* Pilot fan knob works with accompanying sound (**credit: J-Hoskin**)
* CLIMATE CONTROL knob works (**credit: J-Hoskin**)
* COCKPIT TEMP knob works (**credit: J-Hoskin**)
* SOURCE knob works (**credit: J-Hoskin**)
* Seatbelt button works with accompanying sound (**credit: J-Hoskin**)
* Improved cockpit and cabin lighting (including externally visible cabin lights at night)

## Known Issues
* You cannot currently select Direct-To of a fix on your approach that is not the initial approach fix. This is a limitation of the sim flightplan system at present. We are investigating solutions to this issue.
* After using Direct-To, the navigation will not always automatically sequence to the next fix and may enter ROL mode. You can re-activate NAV to navigate to the next fix if you encounter this issue.
* There are cosmetic issues regarding the PFD and MFD (shapes, text, alignments). The PFD and MFD have not gotten a full layout overhaul as of this time.
* The aircraft is still using the built-in MSFS autopilot (for now). All the existing limitations of that still apply. It does behave a bit better with the various enhancements applied.