# Changelog

### v0.6.2
**New Features**
- \[Traffic\] Enabled support for laurinius's MSFS Traffic Service app, which adds Offline AI traffic and SimConnect-injected traffic to the mod's traffic systems.
  - Configuration settings for this feature can be found in the mod config file.

**Changed Features**
- \[GTC\] Airport icons, when shown, now indicate the direction of the longest runway at the airport.

**Fixes**
- \[General\] Fixed a bug with initializing airport data with no listed runways.
- \[NavMap\] While in TRACK UP mode on the ground, the compass arc's reference tick mark now correctly indicates the aircraft's current heading instead of ground track (which cannot always be reliably calculated on the ground).
- \[Traffic\] Fixed an error with ground track computation for traffic contacts.
- \[PFD\] Airspeed altimeter speed bugs are no longer mispositioned when airspeed is below the minimum indicated airspeed.
- \[GTC\] Fixed a bug where the Charts page would sometimes automatically change the selected airport after closing a popup or navigating back to it from the pan/zoom control page.

### v0.6.1
**Changed Features**
- \[Charts\] The airplane icon is now visible in ALL view as long as the chart is geo-referenced and the projected position of the airplane is not in an inset.
- \[GTC\] Improved performance while the Map Settings page is open.
- \[GTC\] Improved performance while the Nearest Waypoints pages are open.

**Fixes**
- \[Compatibility\] Fixed an error related to parsing certain Navigraph approach data that would cause major performance degradation as well as other undesired effects related to flight plan logic and rendering.
- \[Compatibility\] Automatic ILS frequency loading now works properly when using Navigraph FMS data.
- \[NavMap\] Fixed an error that would sometimes cause the active flight plan waypoint to become "stuck" on the map after removing it from the flight plan.
- \[Traffic\] If a contact is lost while triggering a traffic advisory, the traffic advisory is now properly removed.
- \[PFD\] Fixed a regression introduced in v0.6.0 that caused the airspeed indicator reference speed bug to be slightly out of position.
- \[PFD\] The NAV/DME info and bearing info displays now correctly report DME distance from DME-only stations, and will not report data from stations from which they are not receiving a signal.

### v0.6.0
**New Features**
- \[General\] Implemented traffic awareness and alert systems for both the TBM930 and Longitude.
  - When the system is active, traffic alerts (TAs) will display a "TRAFFIC" annunciation on the PFD. Additionally, if no PFD inset is enabled, the PFD inset traffic map will automatically be displayed. Alternatively, if the PFD inset map is enabled, the traffic overlay for the inset map will automatically be displayed.
  - Traffic can be visualized in several ways:
    - Enable the traffic pane on the MFD by using the GTC to navigate to MFD Home -> Traffic.
    - Enable the traffic overlay in the navigation map by using the GTC to navigate to MFD Home -> Map -> Map Settings -> Sensors tab -> Traffic.
    - Enable the traffic inset on the PFD by using the GTC to navigate to PFD Home -> Traffic Map.
      - Alternatively, in the TBM930 only, press the Traffic Map PFD softkey, or navigate to PFD Map Settings -> Map Layout -> Inset Traffic.
    - Enable the traffic overlay in the PFD inset map by using the GTC to navigate to PFD Home -> PFD Map Settings -> Sensors tab -> Traffic.
      - Alternatively, in the TBM930 only, use the PFD softkeys to navigate to PFD Map Settings -> Traffic.
  - The traffic settings menu can be found by using the GTC to navigate to MFD Home -> Traffic -> Traffic Settings _or_ MFD Home -> Map -> Map Settings -> Sensors tab -> Traffic Settings _or_ PFD Home -> PFD Map Settings -> Sensors tab -> Traffic Settings.
  - Settings specific to the navigation map traffic overlay can be found by using the GTC to navigate to MFD Home -> Map -> Map Settings -> Sensors tab -> Traffic Settings -> Map Settings _or_ PFD Home -> PFD Map Settings -> Sensors tab -> Traffic Settings -> Map Settings.
- \[General\] Added Navigraph charts integration. *Use of this feature requires a paid Navigraph subscription*.
  - To link a Navigraph account, use the GTC to navigate to MFD Home -> Utilities -> Database Status -> Navigraph Charts.
  - To enable the charts pane on the MFD, use the GTC to navigate to MFD Home -> Charts.
    - Charts can be rotated, zoomed, and scrolled using the GTC Charts Control page.
    - The charts pane supports a live airplane icon overlay for geo-referenced charts while in Plan View.
  - Use the Charts page on the touchscreen controller to select desired charts for viewing.
- \[General\] Added settings to configure Time Format and Local Time Offset.
  - The following time formats are available: Local 12 hr, Local 24 hr, and UTC.
  - To change these settings, use the GTC to navigate to MFD Home -> Utilities -> Avionics Settings -> System tab.
- \[General\] Added settings to filter airports which appear in the Nearest Airports list. Airports may be filtered by runway length and/or runway surface type.
  - To change these settings, use the GTC to navigate to MFD Home -> Utilities -> Avionics Settings -> System tab.
- \[MFD\] Added support for the Nearest Waypoint pane. When active, this pane highlights the selected nearest waypoint (airport, intersection, VOR, NDB).
- \[GTC\] Added information pages for Intersections, VORs, and NDBs. These pages can be found by navigating to MFD Home -> Waypoint Info.

**Changed Features**
- \[NavMap\] Having many waypoints displayed on the map now incurs less of a performance cost.
- \[MFD\] Increased the size of the weather radar display in the WX Radar Pane.
- \[GTC\] Removed map pointer control scroll speed limit.
- \[GTC\] The Airport Info page now displays the time zone offset for the selected airport.
- \[GTC\] Updated the Nearest Waypoint pages to more closely match the real-life units.
- \[VFR Map\] Added an option in the mod config file to enable/disable the custom VFR Map.
- \[VFR Map\] Increased font size for the custom VFR map.

**Fixes**
- \[Compatibility\] For the Longitude: increased the default CRU thrust limit to 95% N1. This will allow the airplane to maintain Mmo at higher altitudes for those who have installed dakfly's Longitude performance mod.
- \[General\] The aural minimums alert no longer triggers immediately after takeoff.
- \[General\] Calculations for distance and ETE are now more accurate for flight plan legs that involve transition turns.
- \[General\] For the Longitude: altimeter pressure setting increment/decrement hotkeys now work properly again.
- \[NavMap\] Fixed a game freeze related to rendering certain airways.

### v0.5.1
**Fixes**
- \[Compatibility\] Fixed compatibility issue with dakfly's Longitude performance mod.
- \[PFD\] The autopilot display will now correctly flash an autopilot disconnect warning when the autopilot is disconnected through means other than pressing the AP key.
  - For the TBM 930: the warning will flash indefinitely until it is acknowledged by pressing the AP/Trim disconnect switch on the control wheel.
  - For the Longitude: the warning will flash for 5 seconds, then stop.
- \[PFD\] Fixed airspeed indicator behavior when IAS is below the minimum reportable speed (20 KIAS for the TBM930, 40 KIAS for the Longitude):
  - The IAS display shows "---" instead of the minimum speed.
  - The trend vector is hidden.
- \[PFD\] For the Longitude: the autopilot display will now flash an autothrottle disconnect caution alert when the autothrottle is turned off.
- \[PFD\] For the Longitude: fixed erroneous display in the navigation status display ETE field when ground speed is 0.
- \[PFD\] For the Longitude: the airspeed indicator now always shows the reference speed (and bug).
- \[PFD\] For the Longitude: 'NO WIND DATA' annunciation no longer overflows its container.
- \[GTC\] The "Home" button in the Timers page now works properly.
- \[GTC\] When in the Map Pointer Control page, pressing the bottom knob will now exit the page as intended.

### v0.5.0
**New Features**
- \[General\] Enabled measurement unit selection. You may now choose between different sets of measurement units in several categories, which affects how various on-screen values are displayed. Note that some on-screen values are not affected by these settings (e.g. the PFD airspeed indicator will always display airspeed in knots).
  - These settings can be changed by using the GTC and navigating to MFD Home -> Utilities -> Setup -> Avionics Settings -> Units tab.
  - The following categories are customizable:
    - Nav Angle (magnetic or true)
    - Distance/Speed (nautical or metric)
    - Altitude/Vertical Speed (feet or meters)
    - External Temperature (Celsius or Fahrenheit)
- \[Misc\] Certain aircraft reference values are now configurable via the mod config file (located at `workingtitle-g3000\html_ui\WTg3000.cfg`).

**Changed Features**
- \[PFD\] Overhauled the autopilot display to more closely match the real Garmin units.
  - For the Longitude: the display now supports annunciations for auto-throttle modes. It will also display the reference speed when auto-throttle is active and in SPD mode.
- \[PFD\] Overhauled the airspeed indicator to more closely match the real Garmin units.
  - The airspeed indicator now displays mach units at the bottom instead of TAS. The mach display is disabled below M0.3 for the TBM930 and M0.4 for the Longitude.
  - The airspeed indicator will now display an overspeed caution/warning by turning the IAS/mach displays yellow/red.
  - When mach units are used for FLC mode, the reference speed display at the top of the airspeed indicator changes from knots to mach units. Moreover, the reference speed bug on the airspeed tape will be placed at the IAS value that is equivalent to the reference mach speed.
  - For the Longitude only:
    - The overspeed ("barber pole") speed strip will dynamically change based on pressure altitude to reflect true Vmo/Mmo:
      - Vmo increases linearly from 290 knots at sea level to 325 knots at 8000 feet.
      - Vmo = 325 knots from 8000 feet to the crossover altitude (29375 feet).
      - Mmo = 0.84 above the crossover altitude.
    - The underspeed (solid yellow/red) speed strips will dynamically change based on the angle of attack to correspond to the yellow/red ranges on the Angle of Attack Indicator.
- \[PFD\] Overhauled the altimeter to more closely match the real Garmin units.
  - Enabled meters overlay. This setting can be changed by using the GTC and navigating to PFD Home -> PFD Settings. Alternatively, for the G3000 only, use the PFD softkey menu and navigate to PFD Settings -> Other PFD Settings -> Altitude Units -> Meters.
- \[PFD\] Changed the style/positioning of the following displays to more closely match the real Garmin units:
  - Radar Altimeter
  - Minimums Display
  - Wind Data Display
  - Angle of Attack Indicator
  - Navigation Status Bar
  - NAV/DME Information Bar
  - Bearing Information Bar
- \[PFD\] Changed the style of the G3000 PFD softkey menus to more closely match the real-life unit.
- \[PFD\] The "Auto" display mode for the PFD Angle of Attack Indicator is no longer available in the G3000.
- \[NavMap\] The high-latitude behavior of the map has been changed to take into account the range of the map. At smaller map ranges, the map can be centered at higher latitudes up to +/- 85 degrees (previously the map was restricted to 70 degrees at all ranges).
- \[GTC\] Added the ability to drag-to-scroll in various pages. These pages also now have scroll-up/scroll-down buttons enabled in the button bar.
- \[Misc\] For the Longitude: In autothrottle CLIMB mode, thrust is limited to 95% N1 (CLB thrust). After leveling off (switching from CLIMB to any other autothrottle mode), CLB thrust is available for another 10 minutes, after which the autothrottle will be limited to 85% N1 (CRU thrust). Engaging CLIMB mode again will reset the autothrottle limit to CLB thrust.
  - The default CLB and CRU values are arbitrary since no references could be found. If so desired, these values can be customized in the mod config file (located at `workingtitle-g3000\html_ui\WTg3000.cfg`). Both support lookup tables keyed to pressure altitude and delta ISA temperature.

**Fixes**
- \[PFD\] The "barber pole" speed strip on the airspeed indicator now appears at the correct speeds.
- \[PFD\] Fixed a regression in v0.4.2/Sim Update 3 that caused the altimeter's baro setting display to not always display all four significant digits in "IN HG" mode.
- \[PFD\] Fixed the scale of the Angle of Attack Indicator. Zero AoA is no longer in the middle of the scale. The top of the scale now theoretically represents the critical (stall) AoA, and zero on the scale represents the zero-lift AoA.
  - The scale for the TBM930 is based on the values found in the targetperformance.cfg file.
  - The scale for the Longitude is somewhat arbitrary since no references could be found, but should be at least in the ballpark of a "correct" scale based on empiric performance data gathered from within the sim.
  - The scale is not adjusted for differences in configuration (e.g. flaps) or mach speed.
- \[PFD\] The "Auto" display mode for the PFD Angle of Attack Indicator in the G5000 now functions properly: when selected, the AoA indicator will be displayed if the landing gear are down or if flaps are set to any setting other than fully retracted.
- \[PFD\] For the Longitude: The PFD altimeter is now synced with the same altimeter used by the autopilot (which is also synced to the standby altimeter). This will fix the issue of the autopilot appearing to hold at an altitude different from the selected altitude if the PFD and standby altimeter baro settings are not the same. This change has the side effect of rendering the standby altimeter baro knob unusable, since the standby altimeter is now slaved to the PFD altimeter.
- \[PFD\] For the Longitude: the joystick above the PFD displays can now be used to increase/decrease the range of the PFD Inset Map.
- \[NavMap\] The flight plan renderer now correctly draws the turning "transitions" into approaches which the sim's default autopilot flies when directly sequencing from the last leg before an approach into the first leg of the approach would result in a greater than 90-degree angle turn.
- \[GTC\] The backspace button in the frequency entry pop-up window is no longer broken.
- \[GTC\] Speed Bug settings are now properly synchronized across different touchscreen controllers.
- \[Misc\] Loading/activating an ILS/LOC approach will automatically load the approach frequency into the nav radio. The exact behavior of this function depends on whether the G3000 or G5000 is being used, whether the selected autopilot/CDI nav source is FMS or NAV, and whether the approach frequency was already loaded into the nav radio.
- \[Misc\] When flying an ILS/LOC approach, the selected autopilot/CDI nav source is FMS, and the approach frequency is loaded into the active frequency field of NAV1 or NAV2, the system will automatically switch the nav source to NAV1/NAV2 when the following conditions are first met: the next active waypoint is the FAF and the plane is within 15 NM of the FAF, OR the next active waypoint is past the FAF.
- \[Misc\] Added the missing default reference Vspeeds for the Longitude. Note that these speeds are the published real-life values; performance in the sim may differ.

### v0.4.2
**Fixes**
- \[Compatibility\] Now compatible with game patch 1.14.5.0 (Sim Update 3).
- \[PFD\] PFD softkey functions related to changing inset map settings now work as intended.

### v0.4.1
**New Features**
- \[General\] Added mod .cfg file. It can be found at `workingtitle-g3000\html_ui\WTg3000.cfg`.
- \[NavMap\] Added support for road display (not available for the PFD Inset Map). Requires the optional `workingtitle-g3000-roaddata` package.
  - Roads can be toggled on/off by navigating to MFD Home -> Map Settings -> "Land" tab.
  - Config settings for roads can be found in the WTg3000.cfg file.

**Changed Features**
- \[NavMap\] Increased city and waypoint label font size in the MFD navigation map.
- \[VFR Map\] The VFR Map no longer incurs a performance cost when it is minimized/hidden.
- \[VFR Map\] Changed the VFR Map to more closely resemble the Garmin G3000 navigation map when flying the TBM930 and Longitude.

**Fixes**
- \[General\] Fixed performance degradation over time.

### v0.4.0
**New Features**
- \[MFD\] Added MFD "HALF" mode, which splits the MFD into left and right panes.
  - To toggle between FULL and HALF modes, navigate to MFD Home using the touchscreen controllers and press the "FULL" or "HALF" button in the navigation bar.
  - In FULL mode, both touchscreen controllers control the only pane that is displayed.
  - In HALF mode, each touchscreen controller controls one pane at a time. For each touchscreen controller, the pane that is currently selected can be visualized in the label bar next to the upper knob (in the upper-right corner of the screen). Two boxes represent the left and right panes. The currently selected pane is highlighted in either cyan (GTC1) or purple (GTC2). The pane that is not selected appears black.
  - To switch the pane selected by a touchscreen controller, turn the inner upper knob.
  - In the MFD display, the border of each half pane changes color depending on which touchscreen controller has selected it. The border will be black if it is selected by neither controller, cyan if selected by GTC1, purple if selected by GTC2, and blue if selected by both.
  - To improve performance, in HALF mode each pane is updated at half refresh rate.
- \[MFD\] Added support for the Airport Info pane.
  - The currently selected MFD pane will automatically switch to the Airport Info pane when the GTC enters the Airport Info page. The MFD pane will switch back to the previous active pane when exiting the Airport Info page.
  - The Airport Info pane automatically adjusts centering and zoom to show the currently selected airport in the Airport Info page. If no airport is selected, the pane will default to coordinates <0 N, 0 E>. Runways for the selected airport are drawn and labeled in the Airport Info Pane.
- \[NavMap\] Added ability to show airways.
  - Airways can be toggled on/off by navigating to PFD Home -> PFD Map Settings -> "Aviation" tab, or MFD Home -> Map Settings -> "Aviation" tab.
- \[NavMap\] Added ability to show country and state/province borders and labels.
  - Country borders/labels are always visible. State/province borders/labels can be toggled on/off by navigating to PFD Home -> PFD Map Settings -> "Land" tab, or MFD Home -> Map Settings -> "Land" tab.
- \[NavMap\] Added the Map Pointer Information display for when the map pointer is active. The display shows the distance and bearing from the aircraft's current position to the pointer's position, and the lat/long coordinates of the pointer's position.
- \[NavMap\] Added the mini compass heading indicator (top-left corner).

**Changed Features**
- \[NavMap\] Updated flight plan path rendering to more closely match the real-life Garmin units.
- \[NavMap\] Updated waypoint icons to more closely match those found in the real-life Garmin units.
- \[NavMap\] Changed the controls for NEXRAD overlay. These can now be found in the appropriate Map Settings menu, under the "Sensor" tab.
- \[NavMap\] Tweaked absolute terrain colors.
- \[Weather Radar\] Changed the controls for the weather radar (WX radar). Navigating to MFD Home -> Weather Selection -> WX Radar will now open a new settings page.
- \[GTC\] Minor overhaul to the Airport Info page. The Runways tab now shows more accurate runway surface information (where data are available).

**Fixes**
- \[PFD\] The inset map no longer bleeds through its borders.
- \[PFD\] The timer display is now functional.
- \[Flight Plan\] Fixed a bug where the navigation map and the GTC active flight plan page would display the active leg as being one leg ahead of the true active leg.
- \[NavMap\] Map symbols (cities, waypoints, etc) are now better aligned with the terrain texture at high latitudes and when zoomed out.
- \[NavMap\] Flight plan paths that cross the antimeridian (180° E/W) are now drawn correctly.
- \[NavMap\] Waypoint labels no longer sometimes blink or flash on/off rapidly.
- \[Weather Radar\] In Vertical Scan mode, the vertical scale is now correctly labeled.
- \[GTC\] The PFD inset map can now be toggled on/off within the PFD Map Settings page.
- \[GTC\] The lower knob (G3000) or right knob (G5000) now controls PFD inset map range when the touchscreen controller has the PFD home page or any of its subpages open.
- \[GTC\] For the G5000, turning the right knob no longer changes map or weather radar range when a frequency select or audio/radio page is open.
- \[GTC\] In the Timers page, the "Start" button now correctly changes to a "Stop" button when the timer is active.

### v0.3.4
**Fixes**
- \[NavMap\] The map now correctly draws approach waypoints and paths.
- \[PFD\] The autopilot display now correctly flashes warnings (e.g. when the autopilot is disengaged).
- \[Compatibility\] Improved compatibility with non-WorkingTitle mods.

### v0.3.3
**Fixes**
- \[Compatibility\] Brought up to date with game patch 1.12.13.0 (SIM UPDATE 2).

### v0.3.2
**Fixes**
- \[Compatibility\] Brought up to date with game patch 1.10.11.0 (Update 6).

### v0.3.1
**Fixes**
- \[Compatibility\] Improved compatibility with the WorkingTitle CJ4 mod.
- \[NavMap\] Fixed an issue where waypoints in a flight plan sometimes had missing labels.
- \[NavMap\] City labels no longer appear in the weather radar screens.

### v0.3.0
**Fixes**
- \[Misc\] Fixed a regression in v0.3.0-pre1 where adjusting screen backlight brightness via the touchscreen controllers was broken in the TBM if using custom liveries.
- \[PFD\] The Terrain softkey no longer displays a value of "undefined".
- \[PFD\] Terrain mode and DCLTR settings for the inset map now save correctly between sessions.
- \[TSC\] Fixed an issue where the pressing the down button in the active flight plan page would cause a CTD under certain circumstances. Also generally improved the scroll behavior in the active flight plan page.
- \[TSC\] Fixed a regression in v0.3.0-pre1 where the physical knobs would not function correctly while certain pop-up windows were displayed.

### v0.3.0-pre1
**New Features**
- \[Compatibility\] The mod is now fully compatible with the Cessna Citation Longitude.
- \[PFD\] Added the ability to control SVT toggle and altimeter barometric units settings via the touchscreen controller.
  - To change these settings, navigate to PFD Home -> PFD Settings.
- \[MFD\] Added the ability to customize the navigation data bar (located at the top of the MFD). The player can now select what type of information gets displayed in each of the eight data fields. The currently supported data types are: BRG, DIS, DTG, DTK, END, ENR, ETA, ETE, FOB, FOD, GS, LDG, TAS, TKE, TRK, XTK.
  - To change these settings, navigate to MFD Home -> Utilities -> Setup -> Avionics Settings -> MFD Data Fields tab.

**Changed Features**
- \[Misc\] Integrated StuTozer/ElectrikKar's Touchscreen Restyled Mod. This overhauls the look of the touchscreen controllers to more closely match those on the real Garmin units.
  - In addition to the changes ported from the Touchscreen Restyled Mod, many more have been made on top of those in order to achieve an even more authentic look.
- \[NavMap\] Reworked how text labels are culled from the navigational map. Culling should now be better at avoiding label overlap. In addition, the map will now prioritize certain labels over others.
  - The priority order is airports > VOR > NDB > INT > cities. Larger airports and cities also get priority over smaller ones.

**Fixes**
- \[Misc\] Display brightness is now saved between sessions for the TBM 930.
- \[NavMap\] Fixed a bug where the track vector overlay would disappear under certain conditions.
- \[NavMap\] Performance optimizations for the city display.
- \[NAVCOM\] Fixed a bug where changing the ADF frequency in the touchscreen controller's Audio/Radio page would lead to unexpected changes in NAV frequencies.

### v0.2.2
**Fixes**
- \[Compatibility\] Now compatible with game patch 1.10.7.0 (Update 5).

### v0.2.1
**Fixes**
- \[Compatibility\] Fixed issue that caused gigantic obstacle icons to be displayed on the G1000 navigational map if the WT G1000 mod is concurrently installed.
- \[Compatibility\] Fixed issue that caused INT waypoint and some airport symbols to not be displayed correctly on the G1000 if the WT G1000 is concurrently installed.
- \[PFD\] You are now able to select PFD wind options while on the ground. The display will still read NO WIND DATA if enabled, but the system will remember your setting and use the right display format when in the air.
- \[NavMap\] Performance optimizations for the range ring/compass and fuel ring overlays.

### v0.2.0
**Fixes**
- \[Compatibility\] Fixed issue that would cause the G1000 MFD screen to freeze when entering WPT page if the WT G1000 mod (v0.3.1) is also installed.
- \[Compatibility\] Disabled new functionality for the Longitude to avoid locking users into settings they could not control in-game. The mod now only applies cosmetic changes to the Longitude, including:
  - Updated terrain colors.
  - Updated formatting of symbols and text labels on the navigational map.
- \[NavMap\] Fixed issue where turning weather on would change map zoom.

### v0.2.0-pre2
**Fixes**
- \[Compatibility\] Fixed issue where installing both this mod and the WorkingTitle G1000 mod would cause G1000 screens to freeze.

### v0.2.0-pre1
**New Features**
- \[MISC\] Certain G3000 settings will now be automatically saved and reloaded between flights. This includes nearly all map settings as well as SVT toggle and Baro Units.
- \[PFD\] Added ability to toggle Synthetic Vision Technology (SVT) on/off.
  - To change this setting, use the PFD softkey menu to navigate to PFD Map Settings -> Attitude Overlays, then press Synthetic Terrain to toggle on/off.
- \[PFD\] Added ability to switch the altimeter barometric units between inHg and hPa.
  - To change this setting, use the PFD softkey menu to navigate to PFD Map Settings -> PFD Settings -> Other PFD Settings -> Altitude Units, then press either IN or HPA.
- \[NavMap\] Added range compass and range ring overlays.
  - The range compass overlay is shown in TRK/HDG up modes and displays magnetic bearings in an 120-degree arc in front of the plane. The on-map distance from the plane to the range compass arc is displayed near the left end of the arc.
  - The range ring overlay is shown in NORTH UP mode. The on-map distance from the plane to the ring is displayed in the top-left quadrant of the ring.
- \[NavMap\] Added the following overlays:
  - Track vector overlay. This will show the predicted track of the plane for 30-second to 20-minute lookahead times. Note that for lookahead times greater than 60 seconds, the track vector is always a straight line even if the plane is turning.
  - Fuel range ring. The inner, dotted ring shows estimated distance to reserve fuel. Time to reserve fuel is displayed at the 12 o'clock position on the inner ring. The outer, solid ring shows estimated total endurance distance. If only reserve fuel is left, the inner ring is not shown and the outer ring will change from green to yellow. Reserve fuel time defaults to 45 min but can be manually set as well.
  - Altitude intercept arc. This will show the approximate distance to reach the target altitude if one is set in the PFD. The arc will only display when the plane is actually ascending or descending toward the target altitude.
  - To toggle these overlays on/off and change associated settings, navigate to MFD Home -> Map Settings -> "Other" tab or PFD Home -> PFD Map Settings -> "Other" tab.
- \[NavMap\] Added ability to show cities backed by a worldwide city database from simplemaps. Cities are represented by a gray circle symbol on the map. The map differentiates between three different city sizes (Large = pop > 500K, Medium = pop > 50K, Small = pop < 50K) and will adjust sizes of symbols accordingly.
  - To toggle display of city symbols or change max range settings, navigate to MFD Home -> Map Settings -> "Land" tab or PFD Home -> PFD Map Settings -> "Land" tab.
- \[NavMap\] Added ability to toggle terrain display between Off, Absolute, and Relative.
  - Off will show water as blue and all land as black.
  - Absolute will color terrain according to elevation above MSL (the default behavior in vanilla).
  - Relative will color terrain according to vertical distance from the plane's current altitude.
    - Black: >2000 ft below plane.
    - Green: 1000-2000 ft below plane.
    - Yellow: 500-1000 ft below plane.
    - Red: <500 ft below plane.
  - To change this setting, navigate to MFD Home -> Map Settings -> "Sensor" tab or PFD Home -> PFD Map Settings -> "Sensor" tab. Alternatively, for the PFD Inset Map only, use the PFD softkey menu to navigate to PFD Map Settings, then press Terrain to cycle through the different modes.
- \[NavMap\] Added ability to toggle display and set maximum range for INT waypoint symbols.
- \[NavMap\] Added ability to toggle the wind overlay on the main navigational map on/off.
  - To change this setting, navigate to MFD Home -> Map Settings -> "Other" tab.
- \[NavMap\] Added the Auto-North Up ("North Up Above") setting, which automatically switches map orientation to NORTH UP mode when map range exceeds a certain user-configurable value.
  - To turn this feature on/off or change the range at which Auto-North Up activates, navigate to MFD Home -> Map Settings -> "Other" tab or PFD Home -> PFD Map Settings -> "Other" tab.

**Changed Features**
- \[NavMap\] Changed zoom levels to those used by the real G3000.
- \[NavMap\] Adjusted zoom behavior so that the nominal (displayed) range is always equal to half the distance between the plane icon and the top of the map. In HDG/TRK UP modes, the range compass marks the nominal range from the plane. In NORTH UP mode, the range circle does the same.
- \[NavMap\] Modified terrain colors to better match those used by the real G3000.
- \[NavMap\] Changed the formatting of the wind overlay on the main navigational map to better match the real G3000. The overlay will now hide the arrow if wind speed is less than 1 kt and will display NO WIND DATA when the plane is on the ground.
- \[NavMap\] Removed the black backgrounds behind text labels shown on the map.
- \[NavMap\] Tweaked the sizes of some symbols and fonts.
  - Decreased size of airplane symbols.
  - Decreased size of symbols for non-towered airports and INT waypoint symbols.
  - Decreased font size for all airport labels except for Class I airports.

**Fixes**
- \[NavMap\] Scroll mode is no longer broken in HDG/TRK up modes.

### v0.1.0
**New Features**
- \[MISC\] Added the ability to adjust backlighting via the G3000 touchscreen menu.
  - The menu adjustment will affect all G3000 screens (PFD, MFD, touchscreen) as well as backlighting of the PFD bezel keys (softkeys), and touchscreen knobs and bezel keys.
  - To change this setting, navigate to MFD Home -> Aircraft Systems -> Lighting Config. Use the slider or Inc/Dec buttons to adjust the backlight.
- \[MISC\] Changed the default look of buttons on the touchscreen displays.
- \[PFD\] PFD softkeys with disabled functionality are now displayed as grayed-out.
- \[PFD\] Added the ability to toggle PFD inset map on/off.
  - To change this setting, use the PFD softkey menu to navigate to PFD Map Settings -> Map Layout, then select Map Off or Inset Map.
  - When the PFD inset map is disabled, associated softkeys will be automatically disabled until the map is turned back on.
- \[PFD\] Added ability to enable NEXRAD weather overlay for PFD inset map.
  - To change this setting, use the PFD softkey menu to navigate to PFD Map Settings, then select WX Overlay. When the weather overlay is enabled, the softkey will display "NEXRAD".
- \[MFD\] The wind display in the main navigational map will no longer show a bearing (arrow) if wind speed is less than 1 kt. The display will also now show NO WIND DATA if the aircraft is not moving.
- \[NavMap\] Increased maximum range of the navigational map to 1000 NM.
- \[NavMap\] Added the ability to change navigational map orientation to either Heading Up (the new default), Track Up, or North Up.
  - When Heading Up or Track Up is selected, the map will center itself slightly ahead of the aircraft along the current heading/track in order to increase the visible range of the map ahead of the aircraft.
  - To change this setting for the main navigational map, navigate to MFD Home -> Map Settings -> Map Orientation.
  - To change this setting for the PFD inset map, navigate to PFD Home -> PFD Map Settings -> Map Orientation.
- \[NavMap\] Added the ability to choose between four declutter (detail) settings for the navigational map.
  - The available declutter levels are: **None**: All map elements visible, **DCLTR 1**: Roads and cities decluttered, **DCLTR 2**: DCLTR 1 plus airways, airspaces, and navaids decluttered, **Least**: Everything decluttered except flight plan waypoints.
  - To change this setting for the main navigational map, navigate to MFD Home -> Map Settings -> Map Detail.
  - To change this setting for the PFD inset map, navigate to PFD Home -> PFD Map Settings -> Map Detail, _or_ use the PFD softkey menu to navigate to PFD Map Settings, then select Detail.
- \[NavMap\] Added the ability to sync map settings across the main navigational map and the PFD inset maps.
  - Currently it is not possible to independently configure the two PFD inset maps, so the only available sync option is "All". Also, the map settings will automatically sync based on the Map Setting menu from which the syncing was enabled: if enabled through the PFD Map Settings menu, all maps will sync to the PFD inset map; if enabled through the MFD Map Settings menu, all maps will sync to the main navigational map. Functionality may be brought closer to the real G3000 in a future update.
  - To change this setting, navigate to MFD Home -> Map Settings -> Map Sync or PFD Home -> PFD Map Settings -> Map Sync.
- \[NavMap\] Added the ability to set the maximum range at which individual categories of symbols will display on the navigational map and the ability to toggle them off/on entirely. This gives finer control of what is displayed on the map than what DCLTR offers.
  - Currently, toggles and range settings are available for the following symbols: Airspaces (currently only one master setting for all airspaces), Airports (Small, Medium, and Large), VORs, NDBs, and Roads (Highway, Trunk, and Local).
  - To change this setting for the main navigational map, navigate to MFD Home -> Map Settings, then use the tabbed settings on the right side of the screen.
  - To change this setting for the main navigational map, navigate to PFD Home -> PFD Map Settings, then use the tabbed settings on the right side of the screen.
- \[NAV/COM\] The Audio/Radio menu will now display station identifiers in the upper right-hand corner of the frequency box (the right-most column) for NAV1 and NAV2 when they are receiving a valid signal on the active frequency.

**Fixes**
- \[PFD\] Modified PFD softkey menus to be more accurate to the real G3000.
- \[MFD\] The wind display in the main navigational map now shows the correct wind direction instead of being offset by 180 degrees.
- \[MFD\] The navigational data bar will now display distance to the nearest 0.1 NM instead of 1 NM for distances less than 100 NM.
- \[NavMap\] Adjusted formatting and location of the navigational map orientation and range displays to match the real G3000.
- \[NavMap\] Improved drawing of road and airspace graphics in the navigational map. These should update much more smoothly as the map pans/rotates.