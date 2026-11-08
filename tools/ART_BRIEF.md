# Net Zero Desk – Art brief

Game: students (15 yo, low reading level) play a fictional Australian Prime Minister stamping APPROVE/REJECT on
policy papers about climate change. Each paper has ONE big picture. Pictures must explain the policy at a glance,
with no words. Think: friendly picture-book / Kurzgesagt-lite flat cartoon, bold and readable at 300px wide.

## Technical rules (checked by tools/render.js check)
- Single self-contained SVG file. `viewBox="0 0 400 260"`, include `xmlns="http://www.w3.org/2000/svg"`. No width/height attrs.
- NO `<text>`, NO `<image>`, no external refs, no scripts, no filters/blur. Simple linear/radial gradients allowed sparingly.
- Under ~12KB. Use `<g>` groups, reuse shapes with `<defs>/<use>` if helpful. Give unique-ish ids (prefix ids with the file id) so multiple SVGs on one page do not clash.
- Background must fill the whole 400x260 frame (sky/ground/room). No transparent canvas.
- Keep the important subject inside the central 340x220 area; 30px safe margin.

## Visual style (shared by every image – this is the most important bit)
- Flat shapes, NO outlines on large background areas, but **foreground subjects get a 4px dark-navy outline `#1f2a44`, round linecaps/joins**.
- Rounded, chunky, slightly wonky friendly shapes. Soft highlights = one lighter flat shape, shadows = one darker flat shape. No fancy shading.
- Palette (use these; small tints of them are OK):
  - navy outline #1f2a44
  - sky blue #8fd3f4, deep sky #4aa3df, cloud #ffffff
  - Aussie red earth #d9663b, sand #f2c879, dry grass #d8b24a
  - leaf green #4caf50, dark green #2e7d4f, mint #b8e8c0
  - sun yellow #ffd23f, orange #ff9f1c
  - industry grey #8a94a6, dark grey #4d5566, smoke #b9bfc9
  - danger red #e63946, water teal #2ec4b6, ocean #1d7fb5
  - warm skin tones #f5c9a0 #d9a066 #a86b3c #7a4a2b, hair #3a2a20 #c9a36a #1f1f1f
- Mood colour cue: GOOD/clean ideas lean bright blue-green-yellow with sunshine. BAD/dirty ideas lean grey-orange with smoke.
- **Greenwash / deceptive papers** (clean_coal, gas_future, hydrogen_hype, flight_offsets, cheap_offsets, tree_per_ticket, summit_pledge, carbon_capture-ish):
  draw them looking *cheerful and shiny on the surface* (green banner, smiling sun, ribbon) but with ONE small telling clue
  that something is off (smoke still pouring from behind the leafy sign, a tiny "oops" in the background, a dead patch, fingers crossed behind someone's back).
- Characters: simple round heads, dot eyes, small expressive mouths, no noses needed except a small bump. Diverse skin tones. Australian feel: akubra hats, hi-vis vests, school uniforms, thongs, sunhats.
- Australian setting cues where natural: gum trees, red dirt, ghost gums, galahs, kangaroos, beaches, Harbour-like skyline (generic, not a real logo), tin-roof houses, utes.
- Composition: ONE clear focal subject, big, centred, with a simple readable background. Avoid clutter and tiny details.
- Consistency: if two images show the same thing (a wind turbine, a solar panel, a house, a tree, a truck, a smokestack), draw it the same way. A tiny shared vocabulary:
  - Wind turbine: white tower tapering, 3 rounded blades, small hub circle, navy outline.
  - Solar panel: dark-blue rectangle in a light frame with 2x3 grid lines and a white glint.
  - Smokestack: grey-red banded chimney with puffy smoke clouds #b9bfc9.
  - House: chunky box, corrugated roof in red or grey with a few ridge lines, door + 2 windows.
  - Tree: wobbly round canopy (2 greens) on a brown trunk.
  - Sun: yellow circle with short rounded rays, sometimes a small smile.
  - Factory: grey blocks with sawtooth roof and 2 chimneys.
  - Dollar/coin: gold circle with navy outline and a simple "bar" mark (NOT a text glyph).

## File locations
- assets/papers/<id>.svg   – the policy papers
- assets/events/<id>.svg   – news events
- assets/people/<id>.svg   – advisors and the PM (bust portraits, centred, plain coloured backdrop)
- assets/endings/<id>.svg  – end-screen illustrations and title screen
- assets/ui/<id>.svg       – misc screen illustrations

## Tools
- `node tools/render.js one <file.svg> <out.png> [width]` -> render to PNG so you can LOOK at your work with the Read tool.
- `node tools/render.js sheet <dir> <out.png> [cols] [thumbW]` -> labelled contact sheet of a whole folder.
- `node tools/render.js check <dir>` -> lint.
Write PNG previews into your scratchpad folder, not into assets/.
ALWAYS render and look at each image at least once, and fix anything that looks wrong, ugly, confusing, or off-palette.
Do a second pass for "does a 15-year-old understand what this policy is within 2 seconds?"

---

# ART LIST (id : scene)

## papers (assets/papers)
### Energy
- solar_rooftop : Suburban tin-roof house with a big blue solar-panel array on the roof, bright sun with a smile, a happy family waving from a window. A small coin-with-up-arrow floating from the roof (savings).
- wind_farms : Rolling green/gold hills with 4 big wind turbines (different sizes for depth), a kangaroo and a galah in the foreground, blue sky.
- coal_close : A big coal power station with 2 smoking chimneys, a giant red-and-white "closing" padlock/chain across the gate, a worker with a hard hat and a worried face in the foreground holding a lunchbox.
- clean_coal : GREENWASH. A coal power station with big smoke clouds, but a huge shiny green leafy banner/ribbon tied round it and a smiling cartoon leaf sticker; smoke still pours out behind the banner.
- gas_future : GREENWASH. A cheerful gas flame icon with a green halo/ribbon on a pipeline, a cartoon smiling flame in a green hat; a grey puff cloud rises quietly behind it.
- big_battery : A giant friendly battery (like AA, with lightning bolt) beside a few solar panels and wind turbines, plugged in, small town lights glowing behind. Battery has a charge bar full of green cells.
- nuclear : A cooling-tower style power plant with white steam (not smoke) and a small reactor dome, a calendar with many crossed-off squares/pages falling (shows it takes forever to build), a clock. Calm but serious.
- hydrogen_hype : GREENWASH. A shiny silver hydrogen tank with a green "H2" shaped bubble (draw an abstract two-circle H shape, not text), glittering stars and a thumbs-up cartoon, behind it a tiny grey gas-plant chimney puffing.
- smart_grid : A town with power lines; a glowing blue network of dots and lines over rooftops, a tablet/phone with a happy sun/lightning icon, a meter dial pointing to green.
- no_new_mines : A coal mine entrance/pit with a big red "no" circle with diagonal bar over a mining truck; a miner looks sadly at it; a green hill rises behind.

### Transport
- ev_rebate : A friendly small electric car with a plug-cable heart, a big coin/discount tag with a down-arrow price tag stuck on the windshield, green sparkles, driver waving.
- ev_chargers : A row of 3 EV charging posts at a highway rest stop with a gum tree and a ute-style electric car plugged in, a green lightning bolt sign.
- trains : A modern silver-and-blue train zooming through a station with commuters happily waiting on platform, city skyline behind, blue sky.
- bike_lanes : A wide city street with a painted green bike lane, 3 cyclists (one kid, one adult in hi-vis, one with a sunhat), cars waiting politely beside.
- fuel_tax : A petrol bowser/pump with a big price sign shooting up (red up-arrow), an angry driver shaking fist beside a ute, coins flying into a government bag. Grumpy mood.
- petrol_ban : A petrol car with a big red cross/no sign over it at a showroom and a row of electric cars on display on the other side, a calendar page behind showing a large circled date mark (no digits needed, just a circle).
- flight_offsets : GREENWASH. A jet plane with a leafy green wing-stripe and a smiling tree sticker, but thick black exhaust trails behind it, passenger waving cheerfully.

### Farming
- seaweed_cows : A happy cow chewing red seaweed in a green paddock, a small cartoon cloud of "burps" (grey puff) shrinking to a tiny puff, a farmer with akubra hat giving thumbs up.
- regen_farming : A farm with healthy green strips of crops and trees between paddocks, sheep grazing, rich dark soil cut-away showing worms and roots underground, sun above.
- school_lunch : A school canteen counter with a tray full of colourful veggie meals (rice, beans, salad), two students in uniform smiling, a small plant-sprout sign. Make sure it is clearly vegetables not meat.
- farm_solar : A farm shed with solar panels on the roof and a ute/tractor charging at a post, wheat paddock and windmill pump behind, farmer waving.
- meat_tax : A sizzling steak/sausage on a plate with a big price tag and red up-arrow, a fussy-looking barbecue dad with tongs looking shocked, coin flying away.

### Industry
- green_steel : A glowing orange steel pour/ladle in a factory, but with a green leaf/hydrogen-droplet marker and clean white steam, workers in hi-vis hard hats cheering, not black smoke.
- carbon_price : A big chunky price-tag shaped like a smokestack cloud with a coin on it, a factory boss grumbling and counting coins from a bag, a green arrow of money returning to a family (rebate cheque).
- factory_efficiency : A factory with sleek new LED lights, insulation and a speedy energy meter dial dropping to green, a worker adjusting a big dial, smaller smoke wisps.
- cement_capture : A cement works with a giant glass tube/duct catching CO2 puffs from the chimney into a big storage tank, engineers with clipboards, hopeful tone. Expensive-looking, high-tech.
- cheap_offsets : GREENWASH. A shifty salesman in a nice suit holding a certificate with a green tick and a tiny sapling in a pot, while a huge smoking factory looms behind him; he hides crossed fingers behind his back.

### Homes
- insulation : A cut-away of a cosy house: fluffy pink insulation batts in the roof and walls, a thermometer showing comfortable temperature, a family in blankets smiling, snowflake/sun icons kept outside.
- heat_pumps : The side of a house with a neat heat-pump unit (box with fan circle), warm orange glow from windows, little hot/cold wave arrows, a happy cat in the window.
- building_code : A new house being built with a tradie holding blueprints and a green "star rating" row (5 stars), solar panel and insulation visible, thumbs up inspector with clipboard.
- gas_ban_homes : A gas stovetop with a big red no-circle over it, next to a shiny induction cooktop with a pot of boiling pasta and a happy cook. Kitchen setting.
- led_lights : A hand screwing a glowing LED bulb into a lamp; beside it an old dim incandescent bulb with a sad face on a pile; small electric meter dial dropping.

### Land
- plant_trees : A group of kids and volunteers planting saplings on a bare red-dirt hillside, a wheelbarrow of seedlings, a few already-grown gum trees, sun shining.
- protect_forests : A big old gum tree forest with a wooden "protected" fence/sign (draw a shield with a leaf), a koala on a trunk, a logger with a chainsaw looking sad on the other side of the fence.
- wetlands : A mangrove / wetland estuary at sunset-ish bright day with birds (egrets), fish visible in clear water, mangrove roots, a boardwalk with a ranger.
- tree_per_ticket : GREENWASH. A cheerful airline-ticket counter with a giant ticket that has a cartoon sapling sprouting from it and a green tick, but out the window the sapling field is brown and dead with a few dry sticks.

### Waste
- food_waste : A fridge/bin scene: a full bin of food scraps next to a compost bin with a green-bin lid, a kid happily putting vegetable scraps in; apple cores, banana peel, a small worm cartoon.
- recycling : Three colour bins (yellow, blue, green) in a row on a kerb with bottles, paper, and cans arrows looping in a circle (a recycling-arrow triangle drawn as shapes, no text), friendly neighbours waving.
- landfill_gas : A landfill hill with pipes poking in and a gas capture tank beside it, a small flare/green flame turning into a lightning bolt into a few houses; seagulls overhead.

### Adaptation
- sea_walls : A beach town with a tall curved concrete sea wall holding back a large wave, houses and a family behind, lifesaver tower. Wave is big but kept out.
- fire_service : A red fire truck with a crew in yellow gear, a water-bombing helicopter overhead, bushfire glow on the horizon far away, a gum tree.
- flood_defence : A river town with a green levee embankment holding water, sandbags, a bridge, rain clouds; water is high but contained, happy shopkeeper behind it.
- cool_roofs : A city street with white/light-reflective roofs and trees along the footpath, a heat shimmer rising from nearby dark roofs vs cool blue shade on light roofs, a kid with an ice cream in the shade.

### Society & other
- climate_ads : A TV screen showing a smiling sun and a simple graph arrow going down, a family on a couch watching, popcorn; a microphone-or-megaphone near, a poster. Message: public campaign.
- green_bank : A bank building with a green leaf on the roof and a big vault door opening to show coins, a smiling banker handing a solar-panel loan paper to a small business owner.
- science_fund : A lab bench with beakers, a microscope, and a big glowing lightbulb idea above a scientist in a white coat with a glowing solar cell; a coin bag nearby.
- summit_pledge : GREENWASH. A fancy summit podium with flags (invented generic colour stripes, no real flags), politicians clapping at a large scroll labelled by a tick; scroll has a very tiny sad note; a sleeping delegate; confetti.
- citizens_panel : A big round table of 8 diverse everyday people (young, old, farmer, nurse, tradie, student) with speech bubbles of coloured icons (a leaf, a coin, a house) discussing; a facilitator at a flip chart.

### New harder papers
- biofuel_blend : A car filling up at a fuel pump with a small leaf sticker on the pump; a field of golden crop plants behind the station; sunny, calm and ordinary.
- carbon_neutral_label : A shop shelf of packaged goods, each with a small round green leaf label; a smiling shopper picks one up; a factory chimney is visible through the shop window.
- free_solar : A smiling delivery worker handing a boxed solar kit to a happy family at their front door of a tin-roof house; a large ribbon bow on the box; sunny.
- smart_meters : A technician fitting a small digital meter on the wall of a house; a family looks on; a tablet shows a simple graph; neat and modern.
- wave_power : A row of floating wave-energy buoys out on a blue sea with a small control building on the shore; engineers with tablets; bright day.
- green_bonds : A bank counter where a smiling clerk hands a certificate with a leaf symbol to a customer; a small model wind turbine and solar panel on the counter.
- highway_boost : A newly widened highway with many lanes of cars flowing, road crew finishing the edge, green trees along the verge; clear sky; calm and positive.
- oil_field_capture : An oil field with pumpjacks and a large tank-and-pipe structure beside them; engineers in hi-vis with clipboards; pipes run underground; clear sky.
- electric_buses : A row of modern electric buses charging at a depot under a canopy with solar panels; a driver waves; commuters waiting; bright and tidy.
- home_batteries : The side of a tin-roof house with solar panels on the roof and a sleek wall-mounted home battery, a glowing evening window and a happy family inside.
- bushland_regrowth : A cleared hillside with a protective fence and young gum saplings growing back among grasses; a ranger checking the fence; a kangaroo in the distance.
- gas_export_ban : A large gas export terminal with big tanks and a ship at the dock; a red barrier across the gate; workers holding lunchboxes look worried; a manager points at the closed gate.

## events (assets/events)
- bushfire : Wide orange-red glowing bushfire on a ridge with smoke clouds, a fire truck and silhouetted gum trees in the foreground, kangaroo running.
- flood : A suburban street under brown floodwater up to the car doors, a family on a roof, a rescue boat.
- heatwave : A blazing huge sun over cracked red ground; a thermometer bursting at the top; people with hats and fans panting; a melting ice cream.
- cyclone : A swirling spiral storm over a tropical coast; palm trees bending, a roof flying off, dark clouds.
- drought : Cracked dry earth paddock, a skinny cow, an empty dam with a dead tree, dust, hot sky.
- reef_bleach : A coral reef where half is bright and half is white/bleached, a sad clownfish, a turtle, a diver with a camera.
- fuel_spike : A gas-station price sign skyrocketing (arrow up), a long queue of cars and angry drivers, orange sky.
- protest_green : A crowd of school kids with hand-made signs (colourful drawings of earth, sun, leaf – no text), a megaphone, banners, bright day.
- protest_workers : Miners and factory workers in hi-vis holding blank signs with a drawn coal-lump and worried faces, in front of a mine gate.
- summit : An international summit hall with a long table and many generic flags, delegates shaking hands, a big globe in the middle.
- fake_news : A shady newsroom TV showing a cartoon of a thermometer with a "fake" stamp (draw a red stamp mark, no text), a talking head with a long Pinocchio-style nose, a phone with a red warning.
- tech_breakthrough : A happy scientist holding a glowing super-battery or new solar cell, sparkles, confetti, a team cheering in a lab.

## people (assets/people) – bust portraits, 400x260, plain bright coloured backdrop with a subtle pattern
- dr_wren : The honest SCIENTIST adviser. Friendly woman, round glasses, white lab coat, messy bun, holds a clipboard with a simple thermometer graph. Calm blue backdrop. Warm expression.
- mr_slick : The LOBBYIST adviser. Man in a shiny suit, too-wide smile, slicked-back hair, gold tie pin, holding a briefcase peeking open with coins, eyebrows slightly sly. Orange-ish backdrop.
- pia_pollster : The SPIN DOCTOR adviser. Young woman with a headset and a phone in each hand, trendy hair, a "thumbs-up" heart badge, a bubbly smile, pink/purple backdrop.
- pm : The PLAYER, the new Prime Minister (gender-neutral, friendly): casual smart outfit with a green-and-gold lapel pin/sash that says nothing, hopeful determined smile, a stamp in hand. Warm yellow backdrop.

## endings (assets/endings)
- title_screen : Hero image for the title. A bright Australian landscape with a globe at the centre, half sunny-green and half hot-red, a giant red APPROVE-style stamp (drawn as a rounded rectangle stamp with a handle, no text) hovering over it. Dramatic but friendly.
- ending_hero : Triumphant PM on a hill with gum trees, wind turbines and solar panels behind, cool blue globe, confetti and a golden trophy-shaped sun.
- ending_saviour : A lone PM on a small podium in the rain/crowd of angry faces turned away holding blank signs, but behind them a bright healthy globe and blue sky. Lonely but proud (we saved the planet, lost the popularity).
- ending_crowdpleaser : A cheering crowd with balloons and a confetti party, the PM waving, but the sky is a hot orange and a thermometer is peeking at the red top, the globe in a corner looks sweaty.
- ending_panic : A PM sweating at a desk with a mountain of papers, a giant clock face (no digits) with hands racing, alarm bells; some windows already show flames; very late rush.
- ending_fooled : A PM wearing a shiny green wreath-badge, proudly looking at a green certificate, but several greenwash cartoons (the smoky banner, the dead saplings) in the background and a tiny magnifier unused on the desk.
- ending_nothing : A PM asleep at a desk in a smoky hot room with a dozen untouched papers; a thermometer burst, a globe on fire-ish orange, a calendar all flipped. Funny, not grim.
- ending_steady : PM giving a calm thumbs-up on a hill with a mix of sun and some clouds, a few turbines and a few chimneys, a balanced scale in the foreground, globe medium green-orange.

## ui (assets/ui)
- election_win : A cheering crowd with a big ballot box and a green tick, confetti, a happy PM waving from a stage. Bright.
- election_loss : A PM with a sad face walking away holding a cardboard box of desk things, a rain cloud, empty podium, ballot box with an angry red mark; a new smug opponent silhouetted at the podium. Gentle humour.
