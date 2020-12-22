# Working Title G3000

### Latest version: v0.3.3

### Description
This is a mod for MSFS2020 that aims to improve the in-game G3000 and G5000. The goal is to bring functionality closer to the real-life units, with a focus on both features and layout/UI.

This mod was created with cross-compatibility in mind. It modifies the minimum number of base files possible to achieve its goals, so it should be compatible with most other mods, including all other WorkingTitle mods. However, because of the nature of the mod, it will conflict with other mods that make changes to the G3000.

### Installation
Download `workingtitle-g3000-v0.3.3.zip` from the Github release page. Do not download the Source code files unless you are sure you want those.

To install, copy the `workingtitle-g3000` folder from the zip file into your `Community` directory.

### Release Highlights (v0.3.3)
- Brought up to date with game patch 1.12.13.0 (SIM UPDATE 2).

#### Highlights for v0.3.1
- Improved compatibility with the WorkingTitle CJ4 mod.
- Fixed an issue where on the navigational map, waypoints in a flight plan sometimes had missing labels.
- City labels no longer appear in the weather radar screens.

#### Highlights for v0.3.0

- Now fully compatible with the Cessna Citation Longitude.
- The touchscreen controller UI style has been completely revamped through integration of StuTozer/ElectrikKar's Touchscreen Restyled Mod as well as numerous additional changes.
- The MFD navigation data bar is now customizable.

**Fixes**
- \[Misc\] Display brightness is now saved between sessions for the TBM 930.
- \[PFD\] The Terrain softkey no longer displays a value of "undefined".
- \[PFD\] Terrain mode and DCLTR settings for the inset map now save correctly between sessions.
- \[TSC\] Fixed an issue where the pressing the down button in the active flight plan page would cause a CTD under certain circumstances. Also generally improved the scroll behavior in the active flight plan page.
- \[NavMap\] Fixed a bug where the track vector overlay would disappear under certain conditions.
- \[NavMap\] Performance optimizations for the city display.
- \[NAVCOM\] Fixed a bug where changing the ADF frequency in the touchscreen controller's Audio/Radio page would lead to unexpected changes in NAV frequencies.

### Known Issues
- \[Stability\] (Vanilla issue) Sometimes the PFD will freeze when transitioning to an approach loaded into the flight plan. The PFD may unfreeze when you reach the second waypoint in the approach.
- \[Stability\] (Vanilla issue) The game sometimes freezes or CTDs when editing the flight plan using the touchscreen controller flight plan menu.
- \[PFD\] (Vanilla issue) Co-pilot PFD softkeys are nonfunctional in the TBM 930.
- \[NavMap\] (Vanilla issue) The road overlay for the navigational map will sometimes fail to draw roads close to the aircraft, instead prioritizing roads farther away. This usually only happens when the map range is set to large values (>100 NM).
- \[NavMap\] (Vanilla issue) Sometimes airport symbols will not update on the navmap. Zooming in then back out will usually fix it.
- \[NavMap\] At large map ranges (>250 NM), map symbols may not line up correctly with the underlying terrain. This is because the terrain map is projected differently from the symbols. The effect is worse at the edges of the map and also worse at high latitudes.

### FAQ
- **Q**: I copied the mod folder to my Community folder but don't get any of the new features. What do I do?
  - **A**: Make sure you downloaded the *correct* mod folder. It should be named `workingtitle-g3000` and be contained in a .zip file named `workingtitle-g3000-v[version number]`.
- **Q**: Why do I no longer have synthetic vision on the PFD after installing the mod?
  - **A**: The mod introduces the option to toggle synthetic vision on/off and the setting defaults to off. To turn it back on, use the touchscreen controllers and navigate to PFD Home -> PFD Settings -> SVT Terrain Enable. Alternatively, *for the TBM 930 only*, use the PFD softkeys to navigate to PFD Settings -> Altitude Overlays -> Synthetic Terrain.
- **Q**: When I copy the mod folder to my Community folder, why do I get an error saying the file path name is too long?
  - **A**: This is a Windows issue. By default, Windows limits file paths to 260 characters. You can disable this limit by modifying the system registry (not as scary as it sounds). Tutorials for how to do so can easily be found with a Google (or Bing) search.
- **Q**: Why do I sometimes get low performance/FPS with the mod?
  - **A**: The biggest performance impact of the mod is the display of features and especially *text labels* on the navigational map. This is technically also true with vanilla, but the mod increases the number of features and therefore labels that can be displayed on the map at once, which exaggerates the issue. To limit the performance impact, toggle map features off or change their max range settings so that the map is not cluttered with too many features at once.

### Credits
- Custom city database is sourced from simplemaps (simplemaps.com/data/world-cities) under the CC Attribution 4.0 license.
- Thank you to StuTozer/ElectrikKar for allowing us to integrate his Touchscreen Restyled Mod.
- This mod uses the Roboto font (designed by Christian Robertson), licensed under Apache 2.0.