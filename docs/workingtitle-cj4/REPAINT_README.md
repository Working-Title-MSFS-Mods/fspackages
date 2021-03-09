# Working Title CJ4 Mod - Repainting Guide

## CURRENT STATE
At the moment, the flags `atc_id_enable` or `atc_id_color` are existing in the `aircraft.cfg` but they do *not* have any effect on the display of aircraft registrations on the exterior model. Instead, like registrations on the interior model, placeholders for registrations are included in the exterior model files. The exact positioning, size and color are then controlled by the following line defined in the `panel.cfg`.
```
painting00=Registration/Registration.html?font_color=black, 0, 0, 1024, 256
```
The five variables in the end are `font-color`, `left`, `top`, `width`, `height`.


## IMPLICATIONS
For any manual changes to this line, you will need to create a custom panel. However, by doing so, you cannot include the custom panel and gauges provided by the Working Title CJ4 Mod. Therefore, the livery will break the mod and a red "LIVERY INCOMPATIBLE" warning will show on the MFD.


## WORKAROUND
We have provided three panel variations, that should cover most liveries out there. These panels can be aliased by your custom panels and are updated automatically, so that your integration won't break in the future.

### BLACK REGISTRATION
This is the default. No custom panel will be necessary in your livery.

### WHITE REGISTRATION
1. Create a custom panel folder in your package.
2. Reference this custom panel in the `panel=` line of the `aircraft.cfg` in your package.
3. In the custom panel folder, create a file called `panel.cfg`.
4. Copy the following 2 lines into that file and save.
```
[fltsim]
alias=Asobo_CJ4\panel.whitereg
```

### NO REGISTRATION
Use this if you want to explicitly paint a registration onto the textures and don't want the default registration displayed.
1. Create a custom panel folder in your package.
2. Reference this custom panel in the `panel=` line of the `aircraft.cfg` in your package.
3. In the custom panel folder, create a file called `panel.cfg`.
4. Copy the following 2 lines into that file and save.
```
[fltsim]
alias=Asobo_CJ4\panel.noreg
```

# ⚠️ NOTE
Be aware, that if you decide to use a `panel.whitereg` or `panel.noreg` fallback, your liveries will *not* work with the default CJ4 anymore.