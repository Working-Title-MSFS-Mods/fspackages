# Working Title G3000

### Latest version: v0.4.0-beta2

### Description
This is a mod for MSFS2020 that aims to improve the in-game G3000 and G5000. The goal is to bring functionality closer to the real-life units, with a focus on both features and layout/UI.

This mod was created with cross-compatibility in mind. It modifies the minimum number of base files possible to achieve its goals, so it should be compatible with most other mods, including all other WorkingTitle mods. However, because of the nature of the mod, it will conflict with other mods that make changes to the G3000.

### Installation
Download `workingtitle-g3000-v0.4.0-beta2.zip` from the Github release page. Do not download the Source code files unless you are sure you want those.

To install, copy the `workingtitle-g3000` folder from the zip file into your `Community` directory.

### Release Highlights (v0.4.0-beta2)
**Fixes**
- \[MFD\] Selecting the DTG field for the nav data bar no longer causes the MFD to freeze.
- \[Weather Radar\] Turning NEXRAD on for the navigation map in the right MFD pane no longer interferes with the weather radar display in the left MFD pane when the right pane is not visible. (The interference still persists if both panes are visible).
- \[GTC\] The lower knob (G3000) or right knob (G5000) now controls PFD inset map range when the touchscreen controller has the PFD home page or any of its subpages open.
- \[GTC\] For the G5000, turning the right knob no longer changes map or weather radar range when a frequency select or audio/radio page is open.
- \[Misc\] Negative numbers are now displayed correctly without an extra minus sign.

#### Release Highlights for v0.4.0-beta1

- Added MFD "HALF" mode, which splits the MFD into left and right panes.
- New navigational map features:
  - Airways.
  - Country and state/province borders and labels.
  - Map Pointer Information display.
- Updated flight plan rendering and waypoint icons to more closely resemble the real-life units.
- New weather radar displays and settings menu.
- Support for Airport Info pane.

**Fixes**
- \[PFD\] The inset map no longer bleeds through its borders.
- \[NavMap\] Map symbols (cities, waypoints, etc) are now better aligned with the terrain texture at high latitudes and when zoomed out.
- \[Weather Radar\] In Vertical Scan mode, the vertical scale is now correctly labeled.

### Known Issues
- \[Stability\] The game will CTD when clearing origin and destination from the flight plan and attempting to enter a new origin/destination.
- \[PFD\] (Vanilla issue) Co-pilot PFD softkeys are nonfunctional in the TBM 930.
- \[NavMap\] Roads and airspaces are currently not available to display. The way the game loads data for these features is unreliable at best, and more time is needed to come up with a satisfactory solution to rendering them. Expect them to be added back at a later date.
- \[NavMap\] The flight plan renderer currently does not draw turn anticipation arcs or turn to intercept legs. These will be added later.
- \[NavMap\] All airport waypoints are shown as if they are serviced, regardless of whether they actually are. This is because waypoint data from the game is currently missing this information.
- \[NavMap\] Airport waypoint symbols will only show around a certain geographic distance from the center of the map (this does not apply to airports that are part of the active flight plan). This is due to the way the game searches for airports (the number of results is limited for performance reasons and there is no option to filter the search e.g. by size to reduce the performance penalty).
- \[Weather Radar\] When NEXRAD is enabled for the navigation map in the right MFD pane, the weather radar display in the left MFD pane will have artifacts. This does not occur with the opposite arrangement (i.e. NEXRAD enabled in left MFD pane, weather radar in right MFD pane). The bug also occurs when enabling NEXRAD for the PFD inset map. A workaround for now is to simply disable NEXRAD or to enable it in the left pane instead of the right (and disable it for the PFD inset map) if you wish to use it in conjucntion with the weather radar.
- \[TSC\] The airport info page will not populate the appropriate airport (if one was previously selected) when switching between MFD panes. A workaround is to reselect the desired airport.

### FAQ
- **Q**: I copied the mod folder to my Community folder but don't get any of the new features. What do I do?
  - **A**: Make sure you downloaded the *correct* mod folder. It should be named `workingtitle-g3000` and be contained in a .zip file named `workingtitle-g3000-v[version number]`.
- **Q**: Why do I no longer have synthetic vision on the PFD after installing the mod?
  - **A**: The mod introduces the option to toggle synthetic vision on/off and the setting defaults to off. To turn it back on, use the touchscreen controllers and navigate to PFD Home -> PFD Settings -> SVT Terrain Enable. Alternatively, *for the TBM 930 only*, use the PFD softkeys to navigate to PFD Settings -> Altitude Overlays -> Synthetic Terrain.
- **Q**: When I copy the mod folder to my Community folder, why do I get an error saying the file path name is too long?
  - **A**: This is a Windows issue. By default, Windows limits file paths to 260 characters. You can disable this limit by modifying the system registry (not as scary as it sounds). Tutorials for how to do so can easily be found with a Google (or Bing) search.
- **Q**: Why do I sometimes get low performance/FPS with the mod?
  - **A**: The single largest performance sink (when it comes to avionics) is the navigational map. The mod actually uses a completely new code base for the navmap that is _more_ performant than the default. However, the mod also allows many more features to be drawn on the map than is possible with the unmodded map (as well as allowing for two independent navmaps to be displayed on the MFD), which is where performance can start to suffer. Generally, the more _waypoints_ and _text labels_ drawn on the map, the greater the impact on performance.
- **Q**: Does the mod support VNAV or inputting airways into the flight plan?
  - **A**: Not yet. Support will be coming with a future update.

### Credits
- Custom city database is sourced from simplemaps (simplemaps.com/data/world-cities) under the CC Attribution 4.0 license.
- Border data is sourced from Natural Earth (www.naturalearthdata.com).
- Thank you to StuTozer/ElectrikKar for allowing us to integrate his Touchscreen Restyled Mod.
- This mod uses the Roboto font (designed by Christian Robertson), licensed under Apache 2.0.
- This mod uses the d3-array, d3-geo, and topojson libraries.