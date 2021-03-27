# Working Title G3000

### Latest version: v0.5.0

### Description
This is a mod for MSFS2020 that aims to improve the in-game G3000 and G5000. The goal is to bring functionality closer to the real-life units, with a focus on both features and layout/UI.

This mod was created with cross-compatibility in mind. It modifies the minimum number of base files possible to achieve its goals, so it should be compatible with most other mods, including all other WorkingTitle mods. However, because of the nature of the mod, it will conflict with other mods that make changes to the G3000.

### Installation
Download `workingtitle-g3000-v0.5.0.zip` from the Github release page. Do not download the Source code files unless you are sure you want those.

To install, copy the `workingtitle-g3000` folder from the zip file into your `Community` directory.

If you want to enable the road display for the navigation map, you must also download `workingtitle-g3000-roaddata-v0.1.0.zip` from the Github release page. To install the road data package, copy the `workingtitle-g3000-roaddata` folder from the zip file into your `Community` directory. Requires 1.3 GB of hard drive space.

### Configuration File
Certain mod settings can be customized via a configuration file which is located at `workingtitle-g3000\html_ui\WTg3000.cfg`. Documentation for the various settings can be found in the file itself. If you make changes to the file while the game is running, you must restart the game for the changes to take effect.

### Release Highlights for v0.5.0

- Enabled measurement unit selection. You may now choose between different sets of measurement units in several categories, which affects how various on-screen values are displayed.
- Overhauled the following PFD elements:
  - Autopilot Display
  - Airspeed Indicator
  - Altimeter
  - Radar Altimeter
  - Minimums Display
  - Wind Data Display
  - Angle of Attack Indicator
  - Navigation Status Bar
  - NAV/DME Information Bar
  - Bearing Information Bar

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

### Known Issues
- \[Compatibility\] Using this mod with the WorkingTitle GX mod may result in various flight planning bugs, such as blank waypoint entries in the GTC active flight plan page and avionics freeze when initiating a Direct To to an approach waypoint.
- \[PFD\] Citation Longitude: the standby altimeter baro knob does not function properly. The standby altimeter is now slaved to the PFD altimeter (so changing the PFD altimeter baro setting automatically changes the standby altimeter's as well).
- \[PFD\] TBM 930: Co-pilot PFD softkeys are nonfunctional.
- \[NavMap\] Airspaces are currently not available to display. The way the game loads data for these features is unreliable at best, and more time is needed to come up with a satisfactory solution to rendering them. Expect them to be added back at a later date.
- \[NavMap\] The flight plan renderer currently does not draw turn anticipation arcs or turn to intercept legs. These will be added later.
- \[NavMap\] All airport waypoints are shown as if they are serviced, regardless of whether they actually are. This is because waypoint data from the game is currently missing this information.
- \[NavMap\] Airport waypoint symbols will only show around a certain geographic distance from the center of the map (this does not apply to airports that are part of the active flight plan). This is due to the way the game searches for airports (the number of results is limited for performance reasons and there is no option to filter the search e.g. by size to reduce the performance penalty).
- \[Weather Radar\] When NEXRAD is enabled for the navigation map in the right MFD pane, the weather radar display in the left MFD pane will have artifacts. This does not occur with the opposite arrangement (i.e. NEXRAD enabled in left MFD pane, weather radar in right MFD pane). The bug also occurs when enabling NEXRAD for the PFD inset map. A workaround for now is to simply disable NEXRAD or to enable it in the left pane instead of the right (and disable it for the PFD inset map) if you wish to use it in conjunction with the weather radar.
- \[Misc\] MSFS will take an increased amount of time to fully shut down (up to several minutes) when closing the game after starting a flight that uses the road data package. The game window will still close promptly, but the game process will run in the background and game audio can be heard. The process is not frozen and will eventually shut down on its own, however if you wish to speed up the process, you can manually end-task or end-process MSFS through Task Manager.

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
- This mod uses the Roboto family of fonts (designed by Christian Robertson), licensed under Apache 2.0.
- This mod uses the d3-array, d3-geo, and topojson libraries.
