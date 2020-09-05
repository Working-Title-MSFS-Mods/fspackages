# Adding support for the G1000 mod

As noted in the README, some planes -- those which have hardware avionics brightness knobs that do not use the default potentiometer index of 30 -- will need a one line tweak to their `panel.xml` to support this.  To add this, you need to determine the index number used by your avionics knob.  This can most readily be determined by looking at your interior model configuration.  Examine `model.cfg` in tme `model` directory of your plan and see what it lists as the inside model file -- it will probably be something like `Plane_Interior.xml`.

Open that, and search for the string `ASOBO_AS1000_PFD_Template`.   It should look something like this:

    <Component ID="AS1000_PFD">
        <UseTemplate Name="ASOBO_AS1000_PFD_Template">
                <POTENTIOMETER>14</POTENTIOMETER>
                <AMBIENT_POTENTIOMETER>11</AMBIENT_POTENTIOMETER>
                <CIRCUIT_ID>25</CIRCUIT_ID>
                <ID>1</ID>
        </UseTemplate>
        <CameraTitle>PFD</CameraTitle>
    </Component>

The line to look for there is the one that says `POTENTIOMETER`.  If that is there, and it is not `30`, you will need to modify your `panel.xml` in the `panel` directory.  In this, search for the string the component ID in the block above -- probably `AS1000_PFD`.  It should look something like thes:

    <Instrument>
        <Name>AS1000_PFD</Name>
        <SyntheticVision>True</SyntheticVision>
    </Instrument>

Just add another line in there that says `<AvionicsKnobIndex>30</AvionicsKnobIndex>`, replacing the `30` there with whatever number you determined in the previous step.

Then you should be good!

As noted in the main doc, this has already been done for you for the C172 and G36.  Unfortunately, the Baron is an encrypted plan and I am not able to adjust that one.