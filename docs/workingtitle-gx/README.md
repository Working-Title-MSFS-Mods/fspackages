# Working Title GX

*This is current for version 0.1.0-pre3.*

This is an early release of what is intended to eventually be the reworking of several of the smaller Garmin units in the game.  At the moment the only thing that has been updated is the G3X Touch, but future modifications to the non-touch G3X, and to the touch-based Aera which uses much of the same code, are possible.

Note that this is a working release, not a final one.  Everything should be stable and functional but there may be a few rough edges encountered.  Part of the reason we want to get this into folks hands is to help discover those rough edges since there is less knowledge and documentation available on these systems than on the more popular G1000 and G3000.  Please make liberal use of our usual haunts of the [Avsim](https://www.avsim.com/forums/forum/863-microsoft-flight-simulator-2020/) and [MSFS](https://forums.flightsimulator.com/c/aircraft/propellers-twin-props/151) forums, our [Discord server](https://discord.gg/UFbpQsu) and our [issues tracker at github](https://github.com/Working-Title-MSFS-Mods/fspackages/issues) for feedback and suggestions.

## G3X Touch Main Enhancements

* Map menu page with numerous new features:
  * North up, track up, and DTK up options
  * NEXRAD and topo overlays
  * Multiple zoom options including auto-zoom on touchscreen
* Completely new autopilot control system via touchscreen
* Completely new menu system supporting independent per-page menus
* Redesigned PFD with wind data information and CAS system
* Graphical overhaul: more authentic, less ugly blue gradient
* Optional simulation of GAP-26 regulated pitot heater (see [pitot.md](pitot.md))

## G3X Touch Instructions

The G3X Touch system in the sim has some big differences in operation from the real one, and part of this mods's goal is to get it a bit closer to reality.  For best operation, please note the following items:

* The "select page" menu is now accessed by touching the page list at the bottom of the MFD
* The menu button on MFD pages now summons that page's menu, if it exists
* The AFCS menu is accessed by touching the autopilot info panel on the PFD
* The PFD menu is accessed by touching the HSI or pushing the menu button in full-screen PFD mode
* CAS notifications can be dismissed by either pushing the back button or touching the CAS panel

## Features to come

As noted above, this is a working release.  There are a number of features that will be delivered soon, but this was functional enough we wanted to allow people to start using it.  Things that will are planned for implementation soon include:

* A Main Menu with access to all key system functions
* A system set up menu with various settings, including screen brightness
* Range rings and compass arc on the MFD map
* An more comprehensive data bar at the top of the screen
* Full-featured radio control either via the data bar or a dedicated menu page
* Flight plan import from SimBrief
* Automated update checks and notifications

Plus hopefully more.  I'd love to have a fully configurable data bar with a better information density and a variety of data fields available at some point.   What else do you want?  Let us know!