# Swarm steering and perception research

Reviewed 16 September 2026 for GRIDRUNNER's existing browser flight model.

| Source | Useful capability | Decision |
|---|---|---|
| [Yuka game AI](https://github.com/Mugen87/yuka), [flocking examples](https://mugen87.github.io/yuka/examples/) | JavaScript steering with separation, alignment and cohesion | Use these established behaviors in a small original controller integrated with existing class physics. No additional runtime or copied Yuka source. |
| [Craig Reynolds: Boids](https://www.red3d.com/cwr/boids/) | Local neighbor rules, goal seeking and predictive avoidance | Primary conceptual reference. Formation slots supply the goal; local steering smooths travel and separates approaching peers. |
| [gym-pybullet-drones](https://github.com/learnsyslab/gym-pybullet-drones) | Python/PyBullet single- and multi-agent control and learning environment | Useful future offline experiment, not a browser dependency or a trained controller shipped in this update. |
| [Microsoft AirSim](https://github.com/microsoft/AirSim), [object-detection API](https://microsoft.github.io/AirSim/object_detection/) | Simulator camera images and mesh-derived reference boxes | Build a native Three.js lab with projected reference boxes. AirSim's mesh labels are simulator truth, not neural inference. |
| [YOLOX](https://github.com/Megvii-BaseDetection/YOLOX) | General-object pixel detection and ONNX deployment | Keep the existing bundled YOLOX-Nano model, WASM runtime, license notices and worker. No new model download, server or camera permission. |

## Implemented swarm behavior

Four existing class-owned aircraft use one immutable peer snapshot per simulation tick. Nearby autonomous formation aircraft apply bounded separation, alignment and cohesion. Closest-approach prediction adds reciprocal lateral steering and braking before a crossing. A stable side choice handles coincident positions. Existing acceleration, load, climb, hull sweeps, battery, radio and return logic still determine motion.

This is heuristic game steering, not ORCA, reinforcement learning, a collision-free proof, or a controller for real drones. MANUAL, HOLD, conductor release/perching, outpost landing, precision task targets and RETURN HOME retain their existing authority. Cooperative avoidance is enabled for FOLLOW / ORBIT / free SCOUT AHEAD. Manual pilots must still avoid other aircraft. Existing static obstacle routing remains active.

Launch All queues only available docked aircraft with at least 12% charge, 20% hull and no active task. It checks the launch corridor against class-sized peer envelopes before each takeoff. Menus pause the queue. Return All cancels it; changing expedition/practice state invalidates it. The queue is transient, so loading a save never unexpectedly dispatches aircraft. Existing jobs and airborne drones are not retasked by Launch All.

## Sensor / YOLO Lab

Flight Yard now starts with a compact aircraft picker and a Sensor / YOLO Lab mission. It reuses the game's person and bicycle models, with a fluorescent stripe, warm calibration housing and local transmitter. Record UV with Scout or Utility, thermal with Utility, and RF with Relay. All three readings complete the exercise. Free flight and YOLO experiments can continue afterward. Practice discoveries, inventory and campaign progress do not carry back.

Y enables actual rendered-pixel inference in visible mode. Reference person/bicycle boxes are computed separately from scene geometry at frame capture time. They never enter the inference worker. Results are compared by matching class and intersection-over-union above 0.30, one prediction per reference. The readout reports matches, misses and extra detections. Center-ray occlusion and projected world bounds are approximate references, not a pixel-perfect labeled dataset or a benchmark accuracy score. Other scene objects can produce valid extra detections. Stylized models can be missed or mislabeled; zero matches are displayed honestly. Sensor-colored frames pause YOLO.

UV scans now require an explicitly authored fluorescent source and close range, instead of classifying every objective as fluorescent. The two Maintenance Cut paint marks provide optional route/inspection hints and survive in the existing scan journal. Visible/RGB scans cannot discover them. Thermal and RF remain class payloads and use their existing energy, range and obstruction rules. Sensor readings are labeled `world-simulation`; neural detections stay separate.

## Next sensor-driven gameplay slices — proposed, not shipped

1. **UV maintenance trail:** extend the implemented paint marks into a short multi-step service route. Clues identify inspected housings and cable routes; players still interpret the physical route and repair the latch. Decoy paint can be old or incomplete. No invisible answer-code reveal.
2. **Thermal fault diagnosis:** author a loaded junction, a harmless warm motor and an overheating bearing. Compare changes before/after switching loads. Repair the right component, wait for cooling, then verify improvement. A hot reading alone should not identify the solution.
3. **RF triangulation:** collect bearings from three separated hover points, distinguish an intermittent ghost carrier from a working relay, and position Relay to improve the link. Strength and occlusion provide evidence; multiple sources and weather prevent a single scan from acting as an exact waypoint.
4. **Combined rescue/service contract:** UV identifies the service route, RF locates the failing beacon, and thermal confirms a live system before Utility approaches. Scout surveys while Relay maintains coverage. Rewards remain finite and task ownership persists through saves.

Custom drone/electrical neural recognition would require an explicitly labeled synthetic dataset, train/validation separation, model licensing and device performance checks. General COCO YOLOX output is not evidence of RF, UV or thermal measurement.
