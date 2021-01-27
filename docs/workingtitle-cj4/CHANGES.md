# Working Title CJ4 v0.10.0

Welcome to the Working Title CJ4 v0.10.0. This release brings even more navigation features and accuracy to the CJ4, and we're excited to deliver it! Version 0.10.0 continues our Open Beta series, and as such you may find issues while flying the aircraft. Please report issues encountered on our GitHub issues tracker.

## Key Features
- Missed approaches
- Mandatory hold legs from navdata
- Revamped VNAV with VNAV Path Smoothing and Vertical Direct-To
- FMS/PFD/MFD message system
- Custom ILS guidance
- Ability to arm LNV, APPR LOC, and APPR LNV modes
- Automatic NAV-to-NAV transfers
- Relative terrain map
- External lighting changes

## Installation
Installation is easy, simply copy the `workingtitle-aircraft-cj4` folder inside the zip file to your MSFS Community folder. 

**Important: We recommend that you fully delete the previous `workingtitle-aircraft-cj4` folder before copying this release.**

## Default Livery Conflicts
The alternate default liveries that now ship with MSFS are not compatible with the CJ4 yet at this time. They currently ship with panel.cfg files that do not include our FADEC module. Please use the standard livery or a known compatible 3rd party or community livery.

# Changes

## Autopilot
- Over-the-top custom AP now flies ILS approaches itself instead of relying on stock ILS AP behavior for much better lateral and vertical accuracy
- TO and GA no longer override the heading bug
- TO is now disabled upon activating AP
- GA mode will now sequence to the missed approach if the active waypoint is the runway fix
- Pressing NAV with FMS selected as the active nav source will now arm LNV if currently in ROLL, HDG, TO, or GA.
- Pressing APPR will now only arm APPR LOC or APPR LNV if outside of the capture area
- Will stay in VNAV until glideslope intercept when engaging approach mode.

## FMC
- Scratchpad error messages now clear after 1 second
- FMC messages now display at the bottom of the display
- Added MESSAGES page
- Added numerous FMC messages including LOC WILL BE TUNED, CHECK LOC TUNING, FPLN DISCONTINUITY, etc
- CRZ ALT inputs now allow "F" plus flight level.  Eg. F200 = FL200.
- Initialize Position message now shows if position not initialized
- Fixed inserting airways in the middle of a flight plan on the FPLN page

### LEGS
- Sequencing will automatically enter INHIBIT when reaching the destination runway
- Changing sequencing from INHIBIT to AUTO when the active leg is the runway will automatically sequence into the missed approach
- Missed approach segment is now displayed at the end of the plan
- POINT/BEARING/DISTANCE fixes should now have magnetic variance properly applied
- Entering positive/negative distance for along-track offset waypoints now has the desired effect

### DIR
- Added ability to perform vertical direct-to
- Added altitude restrictions to display
- Fixed issue where page prohibited direct-to an approach fix

### TUNE
- AUTO/MAN indication now shows next to selected nav radio frequency
- Pressing LSK next to nav radio frequency with nothing in scratchpad now goes to NAV CONTROL
- Adjusting a frequency with nav radios in AUTO automatically switches back to MAN
- Frequencies should now be remembered on shutdown and restart
- Added expanded nav radio input format support

### NAV CONTROL
- Added NAV CONTROL page
- Added ability to put nav radios in AUTO mode, which will automatically tune nearest VORs every 6 minutes for location backup
- Added nav radio presets

## PFD
- Added correct nav source swapping behavior
- Added ability to change preset (standby) nav source via DATA knob
- Added preselect nav source (ghost needle) info block
- Added preselect nav source deviation indicators (ghost deviation)
- Nav source should now automatically switch when APPR is active and preselect nav source is armed (NAV-to-NAV transfer)
- PPOS is now prohibited when FMS is not selected as the nav source
- PFD message lines now populate based on plane conditions and pending FMC messages
- FGS display layout has been completely reworked to support armed lateral modes (TheFlieger)
- FGS display arrow shape is now more accurate (TheFlieger)
- FGS display now flashes modes on mode changes
- FGS display now shows NOPATH as PATH with a yellow line through it.
- Wind indicator position refined to better match real unit (Slip)
- Flap speeds have been added to the airspeed tape
- Fixed the VSpeed display formatting to reflect real unit
- Fixed airspeed band disappearing at bottom end (TheFlieger)
- Fixed the speed trend indicator
- Styling of mach indicator corrected (Slip)

## PFD/MFD
- TERR and WX mode indicators should now better reflect the real world unit
- Range-to-altitude Select (altitude banana) now reflects preselector altitude even while VNAV is operating
- TERR map now operates properly as a relative terrain indicator
- Fixed issue where DME-only stations would not appear on the course or bearing needle information blocks
- Fixed issue where bottom display lines would shift when digits were dropped (TheFlieger)
- Moved ranges into inner circle for ARC, PPOS, and PLAN modes (TheFlieger)
- Removed radial markings for inner circle in PPOS mode (TheFlieger)
- Fixed issue where displayed DTK would sometimes be negative
- Adjusted styling of bottom information line for more accuracy
- Fixed bearing pointer data block formatting
- Fixed issue where bearing pointers would show in incorrect spot in PPOS mode
- Fixed issue where bearing pointer data block would show VOR when a LOC was tuned
- Bearing pointer needle should no longer show when untuned or when a LOC only is tuned
- Bearing pointer display block format updated & aligned correctly
- Map display range rings should now coincide with the ranges in FMS

## MFD
- Oil Temp and Pressure display format corrected
- Fixed issue where FMS Text hour display would roll over to 25 hours

## Flight Planning
- Legs with altitude terminations should now be placed in a more reasonable location
- Origin runway fix should now be at the start instead of the end of the runway
- Hold-to-manual-termination (HM) legs are now properly parsed and inserted into the plan
- Corrected issue where hold course would get incorrect magnetic variance applied (neoenstien)
- FPLN RECALL (Game) will now also import Custom waypoints from the world map
 
## Aircraft Light
- Strobe lights flash is now realistic (on for 1/2 second)
- Added white nav lights to back of light assembly on wingtips (Where it should be)
- Masked lights so bleed won't go over wings.  
- Added pulse lights
- Taxi, Landing, and Pulse lights buttons are exclusive meaning only one can be on at a time.  

## Misc
- Fixed fuel timing calculation and display to avoid bad hour wrap-around (neoenstien)
- Bleed air source is set to NORM on plane load
- "Aural warning ok" message removed
- Gear up/down won't play when you are on the ground and you load in.
- Spoiler drag has been brought back to a more realistic value.

# ⚠️ Known Issues
* PITCH mode will not level off at an altitude and it can have some quirky behaviors.  This is currently a sim AP issue.
* Some external applications that use the GPS/Flight plan SimVars may not function correctly or as expected when FP Sync is off.
* Loading and saving flights can have bad results.
* Custom liveries can render FADEC inoperative if they ship with a panel.cfg. You must uninstall them or remove their panel.cfg from the livery folder. This is a limitation of the Asobo livery system.
* Autopilot modes cannot be triggered via keybindings or controllers and must currently be triggered in the cockpit with the mouse.
* Sometimes a heading to altitude instruction on takeoff will display further than the first RNAV fix on an RNAV departure procedure; in these cases the workaround is to cross-check the DP chart and remove the erroneous waypoint either by deleting the heading to altitude fix or dropping the first RNAV fix onto the magenta line in the LEGS page.
* Due to sim autopilot bank rate limitations, the aircraft may overshoot on certain RNP approaches with tight turns. If you encounter this, we recommend handflying the approach with the given lateral and vertical guidance.
* If for whatever reason, you find that VNAV is not behaving as expected, try and turn it off and on again.

