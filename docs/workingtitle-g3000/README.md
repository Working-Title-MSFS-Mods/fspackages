# Working Title G3000

### Latest version: v0.7.2

### Description
This is a mod for MSFS2020 that aims to improve the in-game G3000 and G5000. The goal is to bring functionality closer to the real-life units, with a focus on both features and layout/UI.

This mod was created with cross-compatibility in mind. It modifies the minimum number of base files possible to achieve its goals, so it should be compatible with most other mods, including all other WorkingTitle mods. However, because of the nature of the mod, it will conflict with other mods that make changes to the G3000.

### Installation
Download `workingtitle-g3000-v0.7.2.zip` from the Github release page. Do not download the Source code files unless you are sure you want those.

To install, copy the `workingtitle-g3000` folder from the zip file into your `Community` directory.

If you want to enable the road display for the navigation map, you must also download `workingtitle-g3000-roaddata-v0.2.0.zip` from the Github release page. To install the road data package, copy the `workingtitle-g3000-roaddata` folder from the zip file into your `Community` directory. Requires 1.4 GB of hard drive space.

### Configuration File
Certain mod settings can be customized via a configuration file which is located at `workingtitle-g3000\html_ui\WTg3000.cfg`. Documentation for the various settings can be found in the file itself. If you make changes to the file while the game is running, you must restart the game for the changes to take effect.

If you make changes to the configuration file, remember to back it up before updating the mod.

### Navigraph Account Linking
This mod enables the G3000/5000 to natively display Navigraph charts. Use of this feature requires an active Navigraph Ultimate subscription (and internet connection). You will also need to link your Navigraph account within the sim. To do so, follow the instructions below:
1. Use the GTC (touchscreen controller) to navigate to MFD Home -> Utilities -> Database Status.
2. Click on the Navigraph Charts row. A pop-up will appear.
3. A browser window should open automatically. If this does not happen, you will need to manually open a browser and navigate to the provided URL.
4. You will be prompted to log in to your Navigraph account and allow access. *The mod does not store your Navigraph username or password anywhere, nor does it even have access to this information at any point during the authentication process*.
5. After completing step 4, press the "Link Account" button on the GTC pop-up. A message will appear on the GTC indicating either success or failure.

During a flight, you can check your Navigraph account link status in the GTC Database Status page. If both the Standby and Active fields display "Available", this means an account has been linked and chart database access is available. If the Standby field displays "Available" and the Active field displays "None", this means an account was linked but access has expired and you need to re-authenticate using the above process to restore chart database access. If both fields display "None", this means no Navigraph account has been linked.

### Release Highlights for v0.7.2
*Please refer to the changelog for a more detailed description of changes in this release.*
- Added support for advisory VNAV guidance. The FMS can now calculate VNAV descent profiles and provide information on top of descent, bottom of descent, required vertical speed, and vertical path deviation. The autopilot still does not support V PATH mode.

**Fixes**
- \[FPLN\] Fixed a bug that prevented editing of the active flight plan under certain circumstances.
- \[PFD\] Autopilot display now correctly shows ALTS armed indication while in PITCH mode.
- \[NavMap\] Flight Plan Text Inset now displays cumulative ETE instead of leg ETE when CUM mode is selected.

### Known Issues
- \[FPLN\] There is currently a bug with the sim's built-in flight plan management system which prevents waypoints from being properly added to the flight plan while an approach is loaded. As a result, inserting waypoints or airways into the Enroute segment of the active flight plan with an approach loaded will desynchronize the FMS flight plan from the sim's flight plan and lead to unexpected behavior. As a workaround, enter waypoints _before_ loading an approach. If you need to enter waypoints after an approach has been loaded, remove the approach, make the necessary edits, then reload the approach. Lastly, if the FMS active flight plan becomes desynchronized, you can fix it by deleting the active flight plan via the Flight Plan Options menu.
- \[FPLN\] There is another issue with the sim's built-in flight plan management system related to having consecutive legs with the same waypoint fix in the active flight plan (non-consecutive legs with the same waypoint fix are OK). This can cause numerous types of unexpected behavior. As such, avoid creating an active flight plan with consecutive legs with the same waypoint fix (the one exception is that the first approach leg may have the same fix as the leg immediately before it). Deleting the active flight plan via the Flight Plan Options menu will resolve any problems related to this bug.
- \[PFD\] Citation Longitude: the PFD altimeter baro setting may be a bit slow to update when turning the PFD baro knobs. As a side effect of syncing the PFD altimeter baro settings to that of the standby altimeter, the sync is paused as long as the baro knobs are being turned in order to prevent inputs from being eaten.
- \[PFD\] TBM 930: Co-pilot PFD softkeys are nonfunctional.
- \[NavMap\] Airspaces are currently not available to display. The way the game loads data for these features is unreliable at best, and more time is needed to come up with a satisfactory solution to rendering them. Expect them to be added back at a later date.
- \[NavMap\] The flight plan renderer currently does not draw turn anticipation arcs or turn to intercept legs. These will be added later.
- \[NavMap\] All airport waypoints are shown as if they are serviced, regardless of whether they actually are. This is because waypoint data from the game is currently missing this information.
- \[NavMap\] Airport waypoint symbols will only show around a certain geographic distance from the center of the map (this does not apply to airports that are part of the active flight plan). This is due to the way the game searches for airports (the number of results is limited for performance reasons and there is no option to filter the search e.g. by size to reduce the performance penalty).
- \[Weather Radar\] When NEXRAD is enabled for the navigation map in the right MFD pane, the weather radar display in the left MFD pane will have artifacts. This does not occur with the opposite arrangement (i.e. NEXRAD enabled in left MFD pane, weather radar in right MFD pane). The bug also occurs when enabling NEXRAD for the PFD inset map. A workaround for now is to simply disable NEXRAD or to enable it in the left pane instead of the right (and disable it for the PFD inset map) if you wish to use it in conjunction with the weather radar.
- \[Misc\] MSFS will take an increased amount of time to fully shut down (up to several minutes) when closing the game after starting a flight that uses the road data package. The game window will still close promptly, but the game process will run in the background and game audio can be heard. The process is not frozen and will eventually shut down on its own, however if you wish to speed up the process, you can manually end-task or end-process MSFS through Task Manager. Disabling world regions for the road data package in the mod configuration file will also speed up the shut down process.
- \[Misc\] TBM 930: the standby airspeed indicator still redlines at lower speeds than it should. If this bothers you, change the `crossover_speed` setting in `asobo-aircraft-tbm930\SimObjects\Airplanes\Asobo_TBM930\flight_model.cfg` to 0. If you use the TBM improvement mod, you should change the value in the `flight_model.cfg` file found in that mod's folder.

### FAQ
- **Q**: I copied the mod folder to my Community folder but don't get any of the new features. What do I do?
  - **A**: Make sure you downloaded the *correct* mod folder. It should be named `workingtitle-g3000` and be contained in a .zip file named `workingtitle-g3000-v[version number]`.
- **Q**: Why do I no longer have synthetic vision on the PFD after installing the mod?
  - **A**: The mod introduces the option to toggle synthetic vision on/off and the setting defaults to off. To turn it back on, use the touchscreen controllers and navigate to PFD Home -> PFD Settings -> SVT Terrain Enable. Alternatively, *for the TBM 930 only*, use the PFD softkeys to navigate to PFD Settings -> Altitude Overlays -> Synthetic Terrain.
- **Q**: When I copy the mod folder to my Community folder, why do I get an error saying the file path name is too long?
  - **A**: This is a Windows issue. By default, Windows limits file paths to 260 characters. You can disable this limit by modifying the system registry (not as scary as it sounds). Tutorials for how to do so can easily be found with a Google (or Bing) search.
- **Q**: Why do I sometimes get low performance/FPS with the mod?
  - **A**: The single largest performance sink (when it comes to avionics) is the navigational map. The mod actually uses a completely new code base for the navmap that is _more_ performant than the default. However, the mod also allows many more features to be drawn on the map than is possible with the unmodded map (as well as allowing for two independent navmaps to be displayed on the MFD), which is where performance can start to suffer. Generally, the more _waypoints_ and _text labels_ drawn on the map, the greater the impact on performance. In addition, if you have the road data package installed, you may see improved performance by using the mod configuration file to disable as many unnecessary world regions as possible (this applies even if you have enough RAM to load all regions) and to disable the roads feature for the VFR map.
- **Q**: Does the mod support VNAV?
  - **A**: The mod supports advisory VNAV guidance. This means it allows you to define VNAV altitude restrictions and profiles, and the system will passively display VNAV information. However, the autopilot will not capture vertical paths (V PATH mode).

### Credits
- Custom city database is sourced from simplemaps (simplemaps.com/data/world-cities) under the CC Attribution 4.0 license.
- Border data is sourced from Natural Earth (www.naturalearthdata.com).
- Thank you to StuTozer/ElectrikKar for allowing us to integrate his Touchscreen Restyled Mod.
- This mod uses the Roboto family of fonts (designed by Christian Robertson), licensed under Apache 2.0.
- This mod uses the d3-array, d3-geo, and topojson libraries.
- This mod uses the spacetime and tz-lookup libraries.
