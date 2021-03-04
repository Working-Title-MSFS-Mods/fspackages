# Changelog

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