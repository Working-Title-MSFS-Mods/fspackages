# Working Title CJ4 Mod - Repainting Guide
Because of certain techniques, not all published CJ4 repaints are compatible with the Working Title CJ4 Mod. This guide gives a short outline of why that is the case and how liveries can be made compatible starting with **v0.11**.

## CURRENT STATE
At the moment, the flags `atc_id_enable` or `atc_id_color` are existing in the `aircraft.cfg` but they do **not** have any effect on the display of aircraft registrations on the exterior model. Instead, like registrations on the interior model, placeholders for registrations are included in the exterior model files. The exact positioning, size and color are then controlled by the following line defined in the `panel.cfg`.
```
painting00=Registration/Registration.html?font_color=black, 0, 0, 1024, 256
```
The five variables in the end are `font-color`, `left`, `top`, `width` and `height`.


## IMPLICATIONS
For any manual changes to this line, you will need to create a custom panel. However, by doing so, you cannot include the custom panel and gauges provided by the Working Title CJ4 Mod. Therefore, the livery will break the mod and a red "LIVERY INCOMPATIBLE" warning will show on the MFD.


## WORKAROUND
We have provided three panel variations, that should cover most liveries out there. These panels can be aliased by your custom panels and are updated automatically, so that your integration won't break in the future.

### BLACK REGISTRATION
This is the default. Make sure no custom panel is present in your package and the `panel=` line of the `aircraft.cfg` looks like this: `panel=""`.

### WHITE REGISTRATION
Users can still change the registration on your paint, but it now appears in white. Use this option if your paint features are dark tailfin.
1. Create a custom panel folder in your package.
2. Reference this custom panel in the `panel=` line of the `aircraft.cfg` in your package.
3. In the custom panel folder, create a file called `panel.cfg`.
4. Copy the following 2 lines into that file and save.
```
[fltsim]
alias=Asobo_CJ4\panel.whitereg
```

### NO REGISTRATION
Removes the dynamically set registration altogether. Use this option if you want to explicitly paint a registration onto the textures and don't want the default registration displayed.
1. Create a custom panel folder in your package.
2. Reference this custom panel in the `panel=` line of the `aircraft.cfg` in your package.
3. In the custom panel folder, create a file called `panel.cfg`.
4. Copy the following 2 lines into that file and save.
```
[fltsim]
alias=Asobo_CJ4\panel.noreg
```

# SUBMIT
If you have followed those steps and wish to have your livery featured in our [List of Compatible Liveries](https://docs.google.com/spreadsheets/d/1-FZh5ZNXsSoHZFRcvkQwa-PHuBSk1QRTt7eYvx7Q4xU/edit?usp=sharing), you can fill out the following form.

[Submit your livery for review](https://forms.gle/kz9mNdQWWxCk1TvDA)


# ⚠️ NOTE
Be aware, that if you decide to use a `panel.whitereg` or `panel.noreg` fallback, your liveries will **not** work with the default CJ4 anymore.