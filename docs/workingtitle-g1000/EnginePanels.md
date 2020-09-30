# Working Title G1000 Custom Engine Panels

With this version of the G1000 comes enhanced functionality for the MFD's engine pages.  With some additional XML configuration you can now produce a wide range of pages for leaning, electricals, or whatever else you may find your plane needing.  We have also tweaked a few of the existing logic and gauge elements to provide a richer set of tools to work with.

To help see this in action, we have created a sample panel for the G36.  You can read it to follow along with the documentation below and use it as an example for your own enhancements.  It can be in this package at `SimObjects\Airplanes\Asobo_Bonanza_G36\panel\WTEnginDisplay.xml`.  

## Structure

To keep from requiring modding stock files, this version of the G1000 will look for a file called `WTEngineDisplay.xml` in the aircraft's `panel` directory.   This page provides a superset of the functionality of the stock `EngineDisplay` element, and if you are familiar with that it should not be hard to enhance your own engine panels.

The `WTEngineDisplay.xml` file must begin and end with opening and closing `WTEngineDisplay` tags.

Once those are in place, the guts of the new logic is driven by the new `EngineDisplayPage` element.  Each `EngineDisplayPage` that you specify adds one more page to the engine pages on the MFD.  The following tags are available within an `EngineDisplayPage`:

* `ID`:  The unique ID of the gauge.  Each ID will be the text of a soft key item.
* `Title`: The title of the current gauge.
* `Node`: The node name of the gauge.  This is what will be used next to define each gauge.
* `Button`: If present, a `Button` element will create a soft key button item with given text.  At this point this is purely visual, there is no logic tied to it.

Next, each page must be defined.  Each page is tied to the `Node` parameter used above, and must be an element with that name.  In the G36 file, for example, you well see that we have `EngineDisplayPage` entriee with node values of `EngineDisplay`, `EngineDisplayLean`, and `EngineDisplaySystem`.   Then, below, we have three more top-level XML elements, each of which matches one of those names.

## New Elements

Within a given page definition things are mostly the same as they are in the stock engine display logic except for a few additions.

* `Header`: a plain text banner to be used as a section header
* `ColumnsGauge`: this is a gauge that contains vertical "bars", _eg_ for use in a cylinder temperature display
* `Duration`: a logic element used to present a value as a tim intervae, _eg_ for endurance displays
* `YellowBlink`: like the existing `RedBlink`, to be used for cautions below warning level.  Gives flashing black and yellow text.

The first three are all present in the sample file for the G36.  `YellowBlink` is a late addition and isn't there but will be elaborated upon in future revisions of this documentation.

## Installation

Once you have a completed panel file you need to add it to a package in order for it to take effect.  If you are already building a mod for a plan including this file should be fairly straight forward.  If you're modding a stock or commercial plane that doesn't already have a mod in the Community folder for it the best thing to do would be to create one.  You can find instructions for this online;  one place to start would be [this document on package metadata](https://github.com/kaosfere/msfs-toolbar-nohandle/blob/master/package_metadata.md) from a sister repo.