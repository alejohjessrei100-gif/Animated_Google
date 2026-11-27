# Defect log: `so_proxy_v2.mp4` (Salad Oil, 270×480 proxy, 1481 frames)

Method: an automated pass (luma, frame-difference and single-frame-pop detection on every frame), a 4 fps contact-sheet scan of the full 49.4 s, and re-renders of each flagged frame after the fix.
Automated result: **0 blank or flash frames, 0 frozen frames, 0 single-frame pops, constant 30 fps.**

| # | Time | Defect | Root cause | Fix (story.js / world.js) |
|---|---|---|---|---|
| 1 | 0:09.3–0:11.2, 0:17.1–0:18.7, 0:31.5–0:33.6 | Pull-backs shrink the subject (Tino becomes tiny among the tanks) | The motion fix added a fixed +0.9 m pull-back plus a 1.6× drift to 16 shots, whatever the shot size | Pull-back is now distance-aware (≤ 12% of shot distance, capped at 0.6 m) and only on 8 shots that can take it; the other 8 get a sideways glide; base drift is ×1.3 instead of ×1.6 |
| 2 | 0:15.2 | The red hatch lid swings through the inspector's legs | The lid hinge was on the inspector's side | Hinge moved to the far side, so the lid opens away from him; inspector stands further back |
| 3 | 0:16.0–0:16.8 | The second inspector is sliced by the frame edge | Stood at the frame edge | Moved behind the hatch, into frame |
| 4 | 0:21.1–0:24.0 | Fish swim above the tank roof and through the oil chamber, in open air | Fish heights were 0.8 + i·0.65 m, reaching 6.65 m with 10 fish; the water tops out at 5.15 m | Fish heights 0.55 + (i mod 8)·0.5 m, at most 4.3 m, inside the water |
| 5 | 0:07.2 | The "SEAWATER" / "REAL OIL" labels shimmer | Coplanar with the see-through front panel, so the two fought over draw order | Labels moved 0.22 m in front and drawn after the panel. The frame at 7.2 s is also a motion-blurred whip frame, which is intended |
| 6 | 0:27.7–0:31.2 | Giant papers sweep across the lens | The paper fall area reached the camera's position | Papers fall only behind the desk, with a smaller spread and lower speed |
| 7 | 0:33.9–0:34.3 | The frosting floats above the empty box before it drops | Its starting point was only 0.5 m up, inside the frame | Hidden until 34.25 s, then drops from 1.4 m (above the frame) |
| 8 | 0:36.0–0:36.3 | A kid's face fills the frame for one beat | The kids appeared during the camera's move into the shot | The move into the shot is 0.2 s; kids appear at 36.32 s |
| 9 | 0:38.4–0:38.7 | A kid's face swings into the low box shot | The kids stood in the camera's path | Kids moved behind and to the left, out of that camera's path |
| 10 | 0:38.9–0:39.7 | The splash reads as a cluster of blue balloons | Large spheres of the same size in a tight burst | Flattened drops of varied size (0.25–0.7 scale), wider spray |
| 11 | 0:45.1–0:45.6 | A giant green bill crosses the lens | The bill fall area reached the camera | Bills fall only around the desk |

**Checked and not present:** z-fighting or flicker (decals offset, signs on boards), shadow acne or peter-panning, near/far plane clipping (cards closer than 0.75 m are hidden), and blown-out or washed-out colour (filmic tone mapping plus per-set exposure). Fine texture shimmer can't be judged at 270×480. Check a final 1080 render.
