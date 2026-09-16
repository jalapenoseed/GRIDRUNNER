# Fleet, sensors and perception practice

Open **Fleet** for the four quick aircraft buttons and **Launch All Drones**. Resume to take off in sequence. **Shift+Q** is the default launch-all shortcut; **Shift+1–4** selects Scout, Cargo, Utility or Relay. Launch All respects campaign unlocks, battery, hull, active jobs and a clear launch pad. **Return All** cancels pending takeoffs and recalls the fleet.

Open **Flight Yard → Sensor / YOLO Lab** for unrestricted practice. Start with Scout, press **B** until UV, then **R** to read the painted stripe. In Fleet select Utility, choose **FPV CONTROL**, then B to thermal and R. Repeat with Relay and RF. The exercise completes after all three readings. The sensor button and Scan button provide touch equivalents.

Return to **visible** mode and press **Y** to test the bundled YOLOX detector against the lab's person and bicycle. The small detector readout compares predictions with approximate scene reference boxes. Move closer, change the camera angle, or change lighting in Environment. Misses and misclassifications are expected on stylized game objects; sensor clues are not fabricated as YOLO detections.

In the expedition, UV on Scout or Utility reveals fluorescent marks beside the Maintenance Cut. R records their hints in the Journal. Thermal belongs to Utility; RF belongs to Relay. Aircraft sensor payloads remain distinct.

Automated gameplay, save and inference checks pass. This does not certify browser/GPU appearance, real detector accuracy on these 3D models, or physical controller/mobile behavior. The swarm uses bounded local steering rather than a trained model or guaranteed collision-free planner. Multi-instance fleets and new thermal/RF campaign contracts remain future work.
