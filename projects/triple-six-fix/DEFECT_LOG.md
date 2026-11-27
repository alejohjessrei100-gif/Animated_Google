# Defect log: render `triple_six_fix_1080x1920_1.mp4` (render v5)

Method: the full 67.3 s was checked at 4 fps, every frame was stepped through around each flagged moment, and an automated pass looked for blank frames, flashes, frozen frames and single-frame pops (luma and frame-difference per frame).
Result of the automated pass: **0 black/white blank frames, 0 frozen or duplicate frames, 0 dropped frames** (2020 frames at a constant 30 fps), and 1 single-frame pop (9.03 s, see #3).

## File-level finding
| Item | Seen | Expected from the exporter | Cause |
|---|---|---|---|
| Container | 1280×720 coded, display-matrix rotation −90° | 1080×1920, no rotation | The uploaded file was **re-encoded after export** (by the phone or the upload path). The page never writes a rotation matrix and encodes at 16 Mbps. |
| Bitrate | 2.4 Mbps video, 96 kbps AAC | 16 Mbps video, 192 kbps audio | Same re-encode. Upload the original file from the Downloads folder. |

## Picture defects
| # | Time | What you see | Root cause (three.js and our code) | Fix |
|---|---|---|---|---|
| 1 | 0:06.4–0:08.0, 0:46.6–0:48.2 | The winning ball **clips through the cup rim**, and the "6" faces away from the lens | The ball was scaled ×1.9 while its centre stayed at the cup's height, so it intersected the cup cylinder. The sphere's UV seam put the digit sideways. | The ball sits on the cup rim (`y = cupTop + r·scale`), scale is ×1.6, and it turns so the digit faces the camera |
| 2 | 0:09.03–0:09.10 | 3 frames of empty curtain and stars, and Marv's head cut by the bottom edge | A same-set transition **lerped the camera position and target** between two compositions facing 90° apart, so it swept across a blank wall | A new `isWhip()` test: a large angle (cos < 0.72) or a jump over 2.6 m becomes a 0.14 s yaw whip with motion blur instead of a pan |
| 3 | 0:09.03 | A single-frame luma pop (Δ = 123) | Same as #2: the pan reached the bright calendar in one frame | Fixed by #2 |
| 4 | 0:10.17–0:10.20 | Empty blue curtain frames | Same as #2 | Fixed by #2 |
| 5 | 0:13.3–0:13.9 | The TV screen is **soft and blurry** | The screen canvas was 512×384, magnified about 4× | The canvas is now 1024×768, drawn at 2× scale |
| 6 | 0:14.00–0:14.03 | An empty floor frame, then the **popcorn bowl swings into the lens** (near-plane graze) | The lerped path ran low over the coffee table | Fixed by #2 (whip instead of a pan through the table) |
| 7 | 0:20.5–0:21.3, 0:33.9–0:34.7 | A tower of **opaque white "balloons"** behind the bench | The coffee-mug steam particles were scaled up to 2× radius, so they read as solid spheres | The steam is 45 % of the size and rises only 0.28 m |
| 8 | 0:38.97–0:39.07 | 3 frames of **bare brick** with the clerk's face sliced at the edge on the whip into the street | The whip offset the target by a fixed +1.6 m along x. On a 0.5 m macro shot that is a 70° swing off the subject. | Whips now yaw by a fixed angle about the camera (0.45 rad), so the offset scales with shot distance |
| 9 | 0:46.4, 0:46.9, 0:47.7 | Single frames showing only the sign, with no cup | Cup-to-cup moves of 0.25 s were interpolated and missed both subjects | Fixed by #2 (whip-cut on composition jumps) |
| 10 | **0:48.00–0:48.17** | A **washed-out white flash** for 5 frames, losing all contrast | A deliberate `flash = 0.35` mix to white, which reads as a blown-out exposure glitch | Removed. The bulbs flare instead (rulebook: 0–1 white flashes, only for literal light) |
| 11 | 0:49.1–0:50.9 | The yellow 3D "?" is cut by the frame edge, its dot floating beside Nick's face | The "?" was too close to the lens | Moved behind and above Nick's head |
| 12 | 0:52.8–0:54.1 | The teacher's head is cut off at the top edge | The teacher stood right under the top of the frame | Moved her out of the shot until she walks in |
| 13 | 0:54.7–0:55.7 | Only the kid's **mouth** shows at the top edge (a cropped face) | Camera too low and too close on the book macro | Raised and pulled back; book and face are both in frame |
| 14 | 0:41.1–0:42.9 | The pals' hats are cut off at the top edge | The camera looked too low | Look point raised 0.2 m, FOV widened |
| 15 | 1:01.6–1:02.4 | "PAYOUTS CLOSED" reads as "CODED" | Cigar-smoke spheres passed in front of the sign. After the fix, the old "OPEN" texture still ghosted through because only `map` was swapped and the lit material's `emissiveMap` kept the old texture. | Sign moved clear of the smoke; smoke made smaller; `map` and `emissiveMap` are swapped together with `needsUpdate` |
| 16 | 1:02.7 | Nick's head is sliced by the bottom edge in the courtroom wide shot | The look point was off-centre | The wide shot is re-aimed to hold the judge and Nick |
| 17 | 1:05.6–1:07.3 | The "7 YEARS" sign is cut ("EARS"), and the **ticket rain never enters frame** (the ending spectacle is missing) | The sign was centred over the judge, outside the final camera's view. Tickets spawned at 3.3 m and fell outside the frustum. | The sign is shifted to the right and narrower; the rain spawns in the camera's view cone and falls through the shot |

## Checked and not present
- **Z-fighting / shimmer:** none visible. Coplanar decals (rugs, tape marks, paint drips) are offset 3–13 mm, and signs sit on 6 mm boards.
- **Shadow acne / peter-panning:** none visible. Bias −0.0004 and normalBias 0.025 on a 4096² map, with the shadow camera fitted per shot.
- **Inverted or faceted normals:** none. Toon banding was replaced by smooth `MeshStandardMaterial` shading in v5.
- **sRGB / tone mapping:** correct. Textures are tagged `SRGBColorSpace`, the pipeline is linear in half-float targets, and a manual gamma plus S-curve is applied in the final pass. No washed-out or crushed footage apart from #10.
- **Near/far clipping:** the near plane is 0.05 m and far is 800 m. Only #6 grazed the near plane, and #2 fixes it.
- **Async loading / first frame:** frame 0 was complete. As a safeguard, export now warms up (renders frames 0, 0, 1 and calls `renderer.compile`) before capturing, so shader compiles and texture uploads cannot leave a half-built first frame.
- **Encoder:** `latencyMode: 'quality'`, `bitrateMode: 'variable'`, a keyframe every 2 s, and exact microsecond timestamps per frame. No stutter is possible from frame pacing, because each frame is rendered offline and stamped.

## Set rebuild (detail pass, `web/detail.js`)
- **Studio:** painted night-skyline flats with gold frames, LIVE monitors on carts, an APPLAUSE sign, a ladder, a cable reel, sandbags, floor tape marks, a coffee cart, cables, and a 3-row audience bleacher with seated extras who bob.
- **Workshop:** a tool shelf with books and cans, a vise, a toolbox, a ladder, a broom, paint drips, buckets, a crate, a lottery-ball drying rack, flyers, swinging bulbs, an extension cord, a sawhorse, and a cat on the shelf.
- **Classroom:** two bookshelves, an ABC frieze, a world map, coat hooks with backpacks, a bin with paper balls, pencil cups and papers on desks, a STAR PUPILS poster, plants, and a waving flag.
- **Street:** fire escapes, a bench, a mailbox, a phone booth, newspaper bundles, a fruit stand, a barrel, crates, manholes, puddles, a second car, a bicycle, a LOTTO TONIGHT sign, bunting, flying birds, and a cat.
- **Living room:** a bookshelf, an armchair, a phone table, framed pictures, plants, slippers, a magazine rack, and a second rug.
- **Bookie office:** filing cabinets, a safe, a coat rack with a bowler hat, horse-racing prints, a cork board of slips, a water cooler, a ticker-tape machine, an ashtray, papers, and a barrel.
- **Courtroom:** the bar rail with balusters, a witness stand, a stenographer's desk, portraits, scales of justice that sway, pendant lights, plants, and papers.
