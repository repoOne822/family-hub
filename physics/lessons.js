// Physics 6 lessons for Eric, following Dr. Covert's Physics 6 syllabus (BASIS Independent Dublin, 2026–27).
// Unit numbers match the syllabus: 2 Inquiry · 3 Measurement · 4 Kinematics · 5 Forces · (PreComp) · 8 Energy · 9 Waves.
// Shape per lesson (same as the AMC app): six = big idea, words = [term, 中文, meaning, example],
// moves = {m, why}, ex = worked examples {q, steps}, pr = starter practice, ch = challenge, tq = extra unit-test questions.
// A question: {q, c: [choices], a: index of the right choice, hint, why}. Calculator is OK (his class uses one).
window.PHY_LESSONS = [
 {
  id: "inquiry", unit: 2, emoji: "🔬", title: "Scientific Inquiry", zh: "科学探究",
  six: [
   "Science is a way to answer questions by testing them, not by arguing or guessing. A scientific claim is one you could check with an experiment or a measurement.",
   "A hypothesis is a testable prediction, often written as 'If I change ___, then ___ will happen, because ___.'",
   "In a fair test you change ONE thing (the independent variable), measure what happens (the dependent variable), and keep everything else the same (the controlled variables). Then you graph the data to see the pattern."
  ],
  words: [
   ["Scientific claim", "科学主张", "A statement that can be tested with evidence.", "\"Heavier balls roll down a ramp faster\" can be tested."],
   ["Non-scientific claim", "非科学主张", "A statement that can't be tested: opinions, beliefs, or things you can't measure.", "\"Blue is the best color.\""],
   ["Hypothesis", "假设", "A testable prediction that explains what you expect and why.", "If the ramp is steeper, then the car will go faster, because gravity pulls it more along the ramp."],
   ["Independent variable", "自变量", "The one thing YOU change on purpose.", "The ramp height."],
   ["Dependent variable", "因变量", "The thing you measure. It depends on what you changed.", "The time the car takes to reach the bottom."],
   ["Controlled variable", "控制变量", "Things you keep the same so the test is fair.", "Same car, same ramp surface, same starting spot."],
   ["Objective", "客观", "Based on facts or measurements. Everyone would get the same answer.", "\"The rock has a mass of 250 g.\""],
   ["Subjective", "主观", "Based on feelings or opinion. People can disagree.", "\"The rock is pretty.\""]
  ],
  moves: [
   { m: "Test a claim: ask 'Could I measure or observe this?' If yes, it's scientific.", why: "Science only works with evidence. If there's no way to collect evidence, there's no way to test it, so it isn't a scientific claim (even if it might be true)." },
   { m: "Scientific method in order: Question → Research → Hypothesis → Experiment → Analyze data → Conclusion → Share.", why: "Each step feeds the next. You can't analyze data you haven't collected, and you can't test a hypothesis you haven't written." },
   { m: "Find the variables: changed = independent, measured = dependent, kept the same = controlled.", why: "If you change two things at once, you can't tell which one caused the result. That's why only ONE thing changes." },
   { m: "Graph it: independent variable on the x-axis (across), dependent on the y-axis (up). Title + labels + units.", why: "We read graphs as 'when x changes, what happens to y?' Putting the thing you changed on the x-axis makes the pattern easy to see." }
  ],
  ex: [
   { q: "Mia tests whether the amount of water changes how tall a bean plant grows. She gives plants 10, 20 and 30 mL a day for two weeks. Name the variables.", steps: [
     "What did she change on purpose? The amount of water.",
     "So independent = water per day (mL). What did she measure? Plant height.",
     "Dependent = plant height (cm). Controlled = same pot size, soil, sunlight, plant type, number of days.",
     "Graph: water (mL) on the x-axis, height (cm) on the y-axis. ✅"] },
   { q: "Sort: (a) \"This song is the best one this year.\" (b) \"Ice melts faster in salt water than in fresh water.\"", steps: [
     "Ask of each: could I test or measure it?",
     "(a) 'Best' is an opinion. You can't measure 'best'. Subjective, non-scientific.",
     "(b) You could time two ice cubes in two cups. Testable, so it's scientific.",
     "Answer: (a) non-scientific, (b) scientific. ✅"] }
  ],
  pr: [
   { q: "Which is a scientific claim?", c: ["Dogs are better pets than cats.", "Plants grow taller with more sunlight.", "Math is the most fun subject.", "Red cars look the coolest."], a: 1, hint: "Which one could you measure with a ruler or a timer?", why: "You can grow plants with different amounts of light and measure their height. The others are opinions." },
   { q: "Leo changes the height of a ramp and measures how far a marble rolls. What is the independent variable?", c: ["How far the marble rolls", "The ramp height", "The marble", "The floor"], a: 1, hint: "Independent = the thing he changes on purpose.", why: "He chooses the ramp height. The distance rolled is what he measures (dependent)." },
   { q: "In the same ramp test, what is the dependent variable?", c: ["The ramp height", "The marble's size", "How far the marble rolls", "The type of floor"], a: 2, hint: "Dependent = the thing you measure.", why: "The rolling distance depends on the ramp height, so it's the dependent variable." },
   { q: "Which statement is objective?", c: ["The water is 40 °C.", "The water feels nice.", "The water is too hot for me.", "The water smells weird."], a: 0, hint: "Objective = a measurement everyone would agree on.", why: "A thermometer reading is the same for everyone. The others depend on the person." },
   { q: "Which is the best hypothesis?", c: ["Plants are cool.", "If I give a plant more water, then it will grow taller, because water helps it make food.", "I like plants.", "Do plants need water?"], a: 1, hint: "A hypothesis is a testable prediction, often 'If… then… because…'.", why: "It predicts a result you can test and gives a reason. 'Do plants need water?' is a question, not a hypothesis." },
   { q: "On a graph of an experiment, which variable goes on the x-axis?", c: ["Dependent", "Independent", "Controlled", "Whichever is bigger"], a: 1, hint: "The x-axis shows what you changed.", why: "Independent variable on x, dependent variable on y." }
  ],
  ch: [
   { q: "Sam tests if a ball bounces higher on carpet or wood. He drops a tennis ball on carpet and a basketball on wood. What's wrong?", c: ["Nothing, it's a fair test", "He changed two things: the floor AND the ball", "He should use only carpet", "He needs a hypothesis first, then it's fine"], a: 1, hint: "Count how many things are different between the two drops.", why: "Both the surface and the ball changed, so he can't tell which one caused the difference. Same ball, only the floor should change." },
   { q: "A student's data: 0 g of salt → water boils at 100 °C, 20 g → 101 °C, 40 g → 102 °C. What is the best conclusion?", c: ["Salt makes water boil faster", "Adding more salt raised the boiling point of the water", "Salt has no effect", "Water always boils at 100 °C"], a: 1, hint: "Look at what happens to the boiling temperature as salt goes up.", why: "Each 20 g of salt raised the boiling temperature by 1 °C. The data is about the boiling temperature, not how fast it boils." },
   { q: "Which step comes right after writing a hypothesis?", c: ["Share your results", "Design and run an experiment", "Write the conclusion", "Ask a question"], a: 1, hint: "You need evidence before you can conclude anything.", why: "Question → research → hypothesis → experiment → analyze → conclude → share." }
  ],
  tq: [
   { q: "Why should only one variable change in an experiment?", c: ["To make it faster", "So you know what caused the result", "Because scientists like one variable", "So the graph is smaller"], a: 1, hint: "Think about two changes at once.", why: "If two things change, you can't tell which one caused the result." },
   { q: "Which is a controlled variable when testing how ramp height affects a toy car's speed?", c: ["Ramp height", "Car speed", "Using the same car every time", "The result"], a: 2, hint: "Controlled = kept the same.", why: "Using the same car keeps the test fair. Ramp height is independent and speed is dependent." },
   { q: "\"The sunset was beautiful\" is…", c: ["objective", "subjective", "a hypothesis", "a measurement"], a: 1, hint: "Could people disagree?", why: "Beauty is an opinion, so it's subjective." },
   { q: "After the experiment, the data does NOT support the hypothesis. What should a scientist do?", c: ["Change the data", "Hide the results", "Report it honestly and maybe form a new hypothesis", "Say the experiment didn't happen"], a: 2, hint: "Science is honest about evidence.", why: "A wrong hypothesis is still useful information. Report it and test a new idea." },
   { q: "A graph is missing which important part if its axes have no units?", c: ["Nothing", "The labels and units that tell what was measured", "Color", "A legend"], a: 1, hint: "What does '5' mean without units?", why: "Without units, '5' could be seconds, meters or grams. Graphs need labels and units." }
  ]
 },
 {
  id: "measure", unit: 3, emoji: "📏", title: "Measurement & Units", zh: "测量与单位",
  six: [
   "A measurement has two parts: a number AND a unit. '5' means nothing; '5 meters' means something.",
   "Scientists all over the world use the same metric system (SI). Base units: meter (m) for length, kilogram (kg) for mass, second (s) for time.",
   "Prefixes make units bigger or smaller by powers of 10. Each step on the ladder kilo → hecto → deca → base → deci → centi → milli is ×10 or ÷10."
  ],
  words: [
   ["Qualitative", "定性", "Describes with words, no numbers.", "\"The liquid is blue and bubbly.\""],
   ["Quantitative", "定量", "Describes with numbers and units.", "\"The liquid is 25 °C and 50 mL.\""],
   ["SI unit", "国际单位", "The standard science unit for a quantity.", "Length: meter. Mass: kilogram. Time: second."],
   ["kilo- (k)", "千", "1 000 of the base unit.", "1 km = 1 000 m"],
   ["hecto- (h)", "百", "100 of the base unit.", "1 hm = 100 m"],
   ["deca- (da)", "十", "10 of the base unit.", "1 dam = 10 m"],
   ["deci- (d)", "分", "One tenth (0.1) of the base unit.", "1 m = 10 dm"],
   ["centi- (c)", "厘", "One hundredth (0.01) of the base unit.", "1 m = 100 cm"],
   ["milli- (m)", "毫", "One thousandth (0.001) of the base unit.", "1 m = 1 000 mm"]
  ],
  moves: [
   { m: "The ladder: k – h – da – BASE – d – c – m (King Henry Died By Drinking Chocolate Milk).", why: "Each rung is exactly 10 times the next one down, because the metric system is built on 10s." },
   { m: "Going DOWN the ladder (to a smaller unit): multiply by 10 for each step. Going UP (to a bigger unit): divide by 10 for each step.", why: "Smaller units mean you need MORE of them. 1 m is 100 small centimeters, so the number gets bigger when the unit gets smaller." },
   { m: "Count the steps, then move the decimal point that many places: right for down, left for up.", why: "Multiplying by 10 moves the decimal one place right; dividing by 10 moves it one place left. 3.5 km → m is 3 steps down → 3 500 m." },
   { m: "Sanity check: smaller unit → bigger number. Bigger unit → smaller number.", why: "If 2 m turned into 0.02 cm, something went wrong. Centimeters are small, so you need lots of them." }
  ],
  ex: [
   { q: "Convert 2.5 km to meters.", steps: [
     "km is above the base (meter). We're going DOWN to meters.",
     "Steps: k → h → da → m = 3 steps down, so × 1 000.",
     "2.5 × 1 000 = 2 500. Move the decimal 3 places right: 2.500 → 2 500.",
     "Check: meters are smaller, so the number got bigger. 2 500 m ✅"] },
   { q: "Convert 450 mg to grams.", steps: [
     "mg is below the base (gram). We're going UP to grams.",
     "Steps: m → c → d → g = 3 steps up, so ÷ 1 000.",
     "450 ÷ 1 000 = 0.45. Move the decimal 3 places left.",
     "Check: grams are bigger, so the number got smaller. 0.45 g ✅"] }
  ],
  pr: [
   { q: "Which is quantitative?", c: ["The rock is shiny.", "The rock is grey.", "The rock has a mass of 120 g.", "The rock feels rough."], a: 2, hint: "Look for a number with a unit.", why: "120 g is a number with a unit. The others describe with words (qualitative)." },
   { q: "What is the SI base unit of mass?", c: ["gram", "kilogram", "pound", "newton"], a: 1, hint: "It's the one with a prefix already in its name!", why: "The SI base unit of mass is the kilogram (kg). (The newton measures force.)" },
   { q: "1 meter = how many centimeters?", c: ["10", "100", "1 000", "0.01"], a: 1, hint: "centi- means one hundredth.", why: "A centimeter is 1/100 of a meter, so 100 of them make a meter." },
   { q: "Convert 3 km to meters.", c: ["30 m", "300 m", "3 000 m", "0.003 m"], a: 2, hint: "km → m is 3 steps down the ladder.", why: "3 × 1 000 = 3 000 m." },
   { q: "Convert 250 cm to meters.", c: ["25 m", "2.5 m", "0.25 m", "25 000 m"], a: 1, hint: "cm → m is 2 steps UP, so ÷ 100.", why: "250 ÷ 100 = 2.5 m." },
   { q: "Convert 4.2 L to mL.", c: ["42 mL", "420 mL", "4 200 mL", "0.0042 mL"], a: 2, hint: "L → mL is 3 steps down.", why: "4.2 × 1 000 = 4 200 mL." }
  ],
  ch: [
   { q: "Convert 0.75 hm to dm.", c: ["7.5 dm", "75 dm", "750 dm", "7 500 dm"], a: 2, hint: "Count rungs: h → da → base → d.", why: "That's 3 steps down, × 1 000: 0.75 × 1 000 = 750 dm." },
   { q: "Which is longest?", c: ["3 500 mm", "0.3 km", "34 dm", "320 cm"], a: 1, hint: "Change them all to meters.", why: "3 500 mm = 3.5 m, 0.3 km = 300 m, 34 dm = 3.4 m, 320 cm = 3.2 m. 0.3 km wins easily." },
   { q: "A pencil is 18.5 cm long. How many millimeters is that?", c: ["1.85 mm", "185 mm", "1 850 mm", "18.5 mm"], a: 1, hint: "cm → mm is 1 step down.", why: "18.5 × 10 = 185 mm." }
  ],
  tq: [
   { q: "What is the SI base unit of time?", c: ["minute", "hour", "second", "day"], a: 2, hint: "It's the shortest of these.", why: "The second (s) is the SI unit of time." },
   { q: "Convert 6 500 g to kg.", c: ["65 kg", "6.5 kg", "0.65 kg", "650 kg"], a: 1, hint: "g → kg is 3 steps up.", why: "6 500 ÷ 1 000 = 6.5 kg." },
   { q: "How many dag are in 1 g?", c: ["10", "0.1", "100", "0.01"], a: 1, hint: "deca is bigger than the base.", why: "1 dag = 10 g, so 1 g = 0.1 dag." },
   { q: "Which prefix means 1/1 000?", c: ["kilo-", "centi-", "milli-", "deci-"], a: 2, hint: "A millimeter is tiny.", why: "milli- = one thousandth." },
   { q: "\"The solution turned cloudy\" is…", c: ["quantitative", "qualitative", "an SI unit", "a prefix"], a: 1, hint: "Is there a number?", why: "No number, just a description, so it's qualitative." },
   { q: "Convert 0.08 km to cm.", c: ["80 cm", "800 cm", "8 000 cm", "80 000 cm"], a: 2, hint: "km → cm is 5 steps down: × 100 000.", why: "0.08 × 100 000 = 8 000 cm (0.08 km = 80 m = 8 000 cm)." }
  ]
 },
 {
  id: "kinematics", unit: 4, emoji: "🏃", title: "Kinematics: Motion", zh: "运动学",
  six: [
   "Motion is change in position compared to a reference point. Distance is how much ground you covered. Displacement is how far you are from where you started, and in which direction.",
   "Speed = distance ÷ time. Velocity is speed WITH a direction. A quantity with a direction is a vector; one without a direction is a scalar.",
   "Acceleration is how fast velocity changes: a = (final velocity − starting velocity) ÷ time. Speeding up, slowing down, or turning all count as accelerating."
  ],
  words: [
   ["Reference point", "参考点", "The place you measure motion from.", "\"The car is 50 m east of the school.\""],
   ["Distance", "路程", "Total length of the path traveled. A scalar.", "Walk 3 m east then 3 m west: distance = 6 m."],
   ["Displacement", "位移", "Straight-line change in position, with direction. A vector.", "Same walk: displacement = 0 m (back where you started)."],
   ["Speed", "速率", "Distance ÷ time. A scalar.", "100 m in 20 s → 5 m/s."],
   ["Velocity", "速度", "Displacement ÷ time, with direction. A vector.", "5 m/s north."],
   ["Acceleration", "加速度", "Change in velocity ÷ time. Units: m/s².", "0 → 20 m/s in 4 s → 5 m/s²."],
   ["Vector", "矢量", "Has size AND direction.", "displacement, velocity, acceleration, force"],
   ["Scalar", "标量", "Has size only.", "distance, speed, time, mass"],
   ["Constant velocity", "匀速", "Same speed, same direction, so zero acceleration.", "A car on cruise control on a straight road."]
  ],
  moves: [
   { m: "Speed triangle: v = d ÷ t, d = v × t, t = d ÷ v.", why: "They're the same relationship rearranged. If 5 m every second for 4 seconds, you go 5 × 4 = 20 m." },
   { m: "Average speed = TOTAL distance ÷ TOTAL time (not the average of the speeds).", why: "If you go fast for a short time and slow for a long time, you spend more time slow, so the average leans toward the slow speed." },
   { m: "Acceleration: a = (v_final − v_start) ÷ t. Negative answer = slowing down (when moving in the positive direction).", why: "Acceleration measures how much velocity changes each second. If velocity went down, the change is negative." },
   { m: "Plug-and-chug: write the formula, list knowns with units, plug in, solve, write units on the answer.", why: "Writing knowns first stops mix-ups between d, v, t and a, and the units tell you if your answer makes sense (m/s for speed, m/s² for acceleration)." },
   { m: "Distance–time graph: steeper line = faster. Flat line = stopped. Straight line = constant speed.", why: "The slope is distance ÷ time, which IS speed. No change in distance (flat) means speed is 0." }
  ],
  ex: [
   { q: "A runner goes 400 m in 80 s. What is her average speed?", steps: [
     "Want speed. Formula: v = d ÷ t.",
     "Knowns: d = 400 m, t = 80 s.",
     "v = 400 ÷ 80 = 5.",
     "Units: m ÷ s = m/s. Answer: 5 m/s ✅"] },
   { q: "A bike speeds up from 2 m/s to 10 m/s in 4 s. What is its acceleration?", steps: [
     "Want acceleration. a = (v_final − v_start) ÷ t.",
     "Knowns: v_start = 2 m/s, v_final = 10 m/s, t = 4 s.",
     "a = (10 − 2) ÷ 4 = 8 ÷ 4 = 2.",
     "Units: m/s ÷ s = m/s². Answer: 2 m/s² ✅"] },
   { q: "You walk 4 m east, then 1 m west. Find distance and displacement.", steps: [
     "Distance counts every step: 4 + 1.",
     "Distance = 5 m (no direction).",
     "Displacement = where you ended compared to the start: 4 − 1 = 3 m.",
     "Displacement = 3 m east ✅"] }
  ],
  pr: [
   { q: "Which is a vector?", c: ["speed", "distance", "velocity", "time"], a: 2, hint: "Which one includes a direction?", why: "Velocity has size and direction (like 5 m/s north). The others are scalars." },
   { q: "A car travels 150 km in 3 h. What is its average speed?", c: ["450 km/h", "50 km/h", "153 km/h", "0.02 km/h"], a: 1, hint: "v = d ÷ t", why: "150 ÷ 3 = 50 km/h." },
   { q: "You walk 10 m north, then 10 m south. What is your displacement?", c: ["20 m north", "10 m south", "0 m", "20 m"], a: 2, hint: "Where did you end up compared to your start?", why: "You ended exactly where you started, so displacement is 0 m. (Distance is 20 m.)" },
   { q: "A train moves at 20 m/s for 30 s. How far does it go?", c: ["600 m", "50 m", "1.5 m", "10 m"], a: 0, hint: "d = v × t", why: "20 × 30 = 600 m." },
   { q: "A skateboard goes from 0 to 6 m/s in 3 s. What is its acceleration?", c: ["18 m/s²", "2 m/s²", "3 m/s²", "0.5 m/s²"], a: 1, hint: "a = (6 − 0) ÷ 3", why: "6 ÷ 3 = 2 m/s²." },
   { q: "On a distance–time graph, a flat (horizontal) line means the object is…", c: ["speeding up", "moving at constant speed", "not moving", "slowing down"], a: 2, hint: "Is the distance changing?", why: "Flat means distance stays the same as time passes, so it's stopped." }
  ],
  ch: [
   { q: "A car drives 60 km in 1 h, then 60 km in 2 h. What is its average speed for the whole trip?", c: ["45 km/h", "40 km/h", "60 km/h", "30 km/h"], a: 1, hint: "Total distance ÷ total time, not the average of 60 and 30.", why: "Total distance 120 km, total time 3 h: 120 ÷ 3 = 40 km/h." },
   { q: "A car moving at 25 m/s brakes to 5 m/s in 4 s. What is its acceleration?", c: ["5 m/s²", "−5 m/s²", "7.5 m/s²", "−20 m/s²"], a: 1, hint: "(final − start) ÷ time. The car is slowing down.", why: "(5 − 25) ÷ 4 = −20 ÷ 4 = −5 m/s². Negative = slowing down." },
   { q: "A car goes around a curve at a steady 30 km/h. Is it accelerating?", c: ["No, the speed didn't change", "Yes, its direction is changing", "Only if it speeds up", "Only if it stops"], a: 1, hint: "Velocity includes direction.", why: "Turning changes the direction of the velocity, and any change in velocity is acceleration." }
  ],
  tq: [
   { q: "How long does it take to walk 300 m at 1.5 m/s?", c: ["450 s", "200 s", "301.5 s", "20 s"], a: 1, hint: "t = d ÷ v", why: "300 ÷ 1.5 = 200 s." },
   { q: "Which pair are both scalars?", c: ["speed and distance", "velocity and displacement", "force and speed", "acceleration and time"], a: 0, hint: "Scalars have no direction.", why: "Speed and distance have size only." },
   { q: "An object at constant velocity has an acceleration of…", c: ["0", "1 m/s²", "it depends on its speed", "9.8 m/s²"], a: 0, hint: "Is velocity changing?", why: "Velocity isn't changing, so acceleration is 0." },
   { q: "What are the units of acceleration?", c: ["m/s", "m", "m/s²", "s/m"], a: 2, hint: "Velocity (m/s) divided by time (s).", why: "(m/s) ÷ s = m/s²." },
   { q: "On a distance–time graph, line A is steeper than line B. Which object is faster?", c: ["A", "B", "Same speed", "Can't tell"], a: 0, hint: "Slope = speed.", why: "Steeper means more distance each second, so A is faster." },
   { q: "A ball rolls 2 m east, 5 m west. What is its displacement?", c: ["7 m west", "3 m west", "3 m east", "7 m east"], a: 1, hint: "East is +, west is −: 2 − 5.", why: "2 − 5 = −3, so 3 m west. (Distance = 7 m.)" }
  ]
 },
 {
  id: "forces", unit: 5, emoji: "🧲", title: "Forces & Newton's Laws", zh: "力与牛顿定律",
  six: [
   "A force is a push or a pull, measured in newtons (N). Mass is how much matter something has (kg); weight is the force of gravity pulling on that mass: W = m × g, with g ≈ 9.8 m/s² on Earth.",
   "Add up all the forces on an object to get the net force. Balanced forces (net force = 0) mean no change in motion: the object stays still or keeps moving at constant velocity. That's equilibrium.",
   "Newton's laws: 1) Objects keep doing what they're doing unless a net force acts (inertia). 2) F = m × a: more force → more acceleration, more mass → less. 3) Every action has an equal and opposite reaction."
  ],
  words: [
   ["Force", "力", "A push or pull. Units: newtons (N). A vector.", "Kicking a ball."],
   ["Newton (N)", "牛顿", "Unit of force: 1 N = 1 kg·m/s².", "An apple weighs about 1 N."],
   ["Mass", "质量", "Amount of matter, in kg. Same everywhere.", "Your mass is the same on the Moon."],
   ["Weight", "重量", "Force of gravity on a mass: W = m × g (N).", "A 10 kg bag weighs 98 N on Earth."],
   ["Inertia", "惯性", "An object's resistance to changing its motion. More mass = more inertia.", "A full shopping cart is harder to start and stop."],
   ["Normal force", "支持力", "A surface pushing back, straight out from the surface.", "The table pushes up on your book."],
   ["Tension", "拉力", "The pull through a rope, string or cable.", "The rope holding a swing."],
   ["Friction", "摩擦力", "A force that resists sliding, opposite to the motion.", "Brakes on a bike."],
   ["Net force", "合力", "The total of all forces on an object.", "10 N right + 4 N left = 6 N right."],
   ["Equilibrium", "平衡", "Net force = 0: at rest or constant velocity.", "A book sitting still on a table."]
  ],
  moves: [
   { m: "Net force: same direction → ADD. Opposite directions → SUBTRACT; the net points the way of the bigger force.", why: "Forces are vectors. Two pushes the same way team up; opposite pushes cancel each other out partly." },
   { m: "Weight: W = m × g. Mass in kg, g = 9.8 m/s² (use whatever value your teacher uses), weight in N.", why: "Gravity gives every kilogram the same pull. Double the mass, double the weight." },
   { m: "Newton's 2nd law triangle: F = m × a, a = F ÷ m, m = F ÷ a. Use the NET force.", why: "Only the unbalanced part of the force speeds things up. If forces balance, a = 0." },
   { m: "Balanced or unbalanced? Net = 0 → balanced → no change in motion. Net ≠ 0 → unbalanced → it accelerates.", why: "That's Newton's 1st law. A moving object with balanced forces keeps going at constant velocity, it doesn't stop." },
   { m: "3rd-law pairs: 'A pushes B' ↔ 'B pushes A', same size, opposite direction, on DIFFERENT objects.", why: "Because the two forces act on different objects, they don't cancel. You push the wall, the wall pushes you." }
  ],
  ex: [
   { q: "What does a 50 kg student weigh on Earth? (g = 9.8 m/s²)", steps: [
     "Want weight. W = m × g.",
     "Knowns: m = 50 kg, g = 9.8 m/s².",
     "W = 50 × 9.8 = 490.",
     "Units: kg × m/s² = N. Answer: 490 N ✅"] },
   { q: "A 20 N push to the right and an 8 N friction force to the left act on a 4 kg box. Find the net force and the acceleration.", steps: [
     "Opposite directions → subtract: 20 − 8.",
     "Net force = 12 N to the right (the bigger force's direction).",
     "a = F_net ÷ m = 12 ÷ 4 = 3.",
     "a = 3 m/s² to the right ✅"] },
   { q: "A book sits still on a table. Name the forces and say if they're balanced.", steps: [
     "Gravity pulls the book down (its weight).",
     "The table pushes the book up (normal force).",
     "The book isn't moving and isn't speeding up, so the net force must be 0.",
     "Weight = normal force, balanced, equilibrium ✅"] }
  ],
  pr: [
   { q: "What is the unit of force?", c: ["kilogram", "newton", "meter per second", "joule"], a: 1, hint: "Named after the scientist of the three laws.", why: "Force is measured in newtons (N)." },
   { q: "A 10 kg bag on Earth weighs about… (g = 9.8 m/s²)", c: ["10 N", "98 N", "0.98 N", "980 N"], a: 1, hint: "W = m × g", why: "10 × 9.8 = 98 N." },
   { q: "Forces of 15 N right and 15 N left act on a box. The box…", c: ["speeds up to the right", "speeds up to the left", "has balanced forces (no change in motion)", "must be moving"], a: 2, hint: "15 − 15 = ?", why: "Net force = 0, so the forces are balanced and the motion doesn't change." },
   { q: "What force pulls on a rope from both ends, like a tug-of-war rope?", c: ["Friction", "Normal force", "Tension", "Weight"], a: 2, hint: "Rope, string, cable…", why: "The pull through a rope is tension." },
   { q: "A 5 kg cart has a net force of 20 N. What is its acceleration?", c: ["100 m/s²", "4 m/s²", "25 m/s²", "0.25 m/s²"], a: 1, hint: "a = F ÷ m", why: "20 ÷ 5 = 4 m/s²." },
   { q: "Which object has the most inertia?", c: ["a tennis ball", "a bicycle", "a car", "a feather"], a: 2, hint: "Inertia depends on mass.", why: "The car has the most mass, so it's hardest to start or stop." }
  ],
  ch: [
   { q: "An astronaut has a mass of 60 kg on Earth. On the Moon (g ≈ 1.6 m/s²), what are her mass and weight?", c: ["60 kg and 96 N", "10 kg and 96 N", "60 kg and 588 N", "96 kg and 60 N"], a: 0, hint: "Mass never changes. Weight = m × g with the Moon's g.", why: "Mass stays 60 kg. Weight = 60 × 1.6 = 96 N." },
   { q: "You push a 30 kg sled with 90 N. Friction is 30 N. What is its acceleration?", c: ["3 m/s²", "2 m/s²", "4 m/s²", "1 m/s²"], a: 1, hint: "Find the net force first.", why: "Net = 90 − 30 = 60 N. a = 60 ÷ 30 = 2 m/s²." },
   { q: "A hockey puck slides across ice at constant velocity. What is the net force on it?", c: ["Forward, to keep it moving", "Zero", "Backward", "Equal to its weight"], a: 1, hint: "Constant velocity → no acceleration.", why: "No acceleration means net force = 0 (Newton's 1st law). It needs no force to keep moving." }
  ],
  tq: [
   { q: "When a swimmer pushes the wall backward, the wall pushes the swimmer forward. This is Newton's…", c: ["1st law", "2nd law", "3rd law", "law of gravity"], a: 2, hint: "Action and reaction.", why: "Equal and opposite forces between two objects: Newton's 3rd law." },
   { q: "Passengers lurch forward when a bus stops suddenly because of…", c: ["friction", "inertia", "tension", "the normal force"], a: 1, hint: "Their bodies keep doing what they were doing.", why: "Their bodies keep moving forward (inertia) even though the bus stopped. Newton's 1st law." },
   { q: "Forces: 12 N right, 5 N right, 7 N left. Net force?", c: ["24 N right", "10 N right", "14 N left", "0 N"], a: 1, hint: "Add the rights, subtract the left.", why: "12 + 5 − 7 = 10 N right." },
   { q: "What force acts opposite to an object sliding on a floor?", c: ["tension", "normal force", "friction", "weight"], a: 2, hint: "It resists sliding.", why: "Friction acts opposite to the motion." },
   { q: "The same force is applied to a 2 kg ball and a 4 kg ball. Which accelerates more?", c: ["2 kg ball", "4 kg ball", "Both the same", "Neither"], a: 0, hint: "a = F ÷ m", why: "Less mass → more acceleration. The 2 kg ball accelerates twice as much." },
   { q: "An object is in equilibrium. Which must be true?", c: ["It is not moving", "The net force on it is zero", "There are no forces on it", "It is falling"], a: 1, hint: "Equilibrium = balanced.", why: "Net force = 0. It could be at rest OR moving at constant velocity, and forces can still act on it." }
  ]
 },
 {
  id: "energy", unit: 8, emoji: "⚡", title: "Energy & Work", zh: "能量与功",
  six: [
   "Work is done when a force moves something in the direction of the force: W = F × d. It's measured in joules (J). No movement, or a force sideways to the motion, means zero work.",
   "Kinetic energy is energy of motion: KE = ½ × m × v². Potential energy (gravitational) is stored energy from height: PE = m × g × h.",
   "Mechanical energy = KE + PE. Energy is never created or destroyed, only changed from one form to another. A falling ball trades PE for KE."
  ],
  words: [
   ["Work", "功", "Force × distance moved in the direction of the force.", "Lifting a 10 N box 2 m: W = 20 J."],
   ["Joule (J)", "焦耳", "Unit of work and energy: 1 J = 1 N × 1 m.", "Lifting an apple about 1 m takes about 1 J."],
   ["Energy", "能量", "The ability to do work.", "A moving car has energy."],
   ["Kinetic energy", "动能", "Energy of motion: ½mv².", "A rolling bowling ball."],
   ["Potential energy", "势能", "Stored energy due to height: mgh.", "A book on a high shelf."],
   ["Mechanical energy", "机械能", "KE + PE.", "A swinging pendulum's total energy."],
   ["Conservation of energy", "能量守恒", "Energy can't be created or destroyed, only transformed.", "PE at the top of a slide becomes KE at the bottom."],
   ["Energy transformation", "能量转化", "Energy changing from one form to another.", "Battery (chemical) → flashlight (light + heat)."]
  ],
  moves: [
   { m: "Work = F × d, but only if the object moves IN the direction of the force. Otherwise W = 0.", why: "Pushing a wall that doesn't move: d = 0, so W = 0. Carrying a bag while walking level: your force is up, motion is sideways, so no work on the bag." },
   { m: "KE = ½ × m × v². Square the speed FIRST, then multiply.", why: "Speed counts twice. Double the speed → 4 times the kinetic energy. That's why fast cars are so dangerous." },
   { m: "PE = m × g × h. Height in meters, mass in kg, g = 9.8 m/s² → PE in joules.", why: "Lifting something higher, or lifting more mass, takes more work, and that work gets stored as PE." },
   { m: "Conservation: PE at the top = KE at the bottom (if no friction). ME stays the same everywhere.", why: "Energy only changes form. As the ball falls, PE goes down by exactly the amount KE goes up." }
  ],
  ex: [
   { q: "You push a box with 50 N for 4 m across the floor. How much work did you do?", steps: [
     "Force and motion are the same direction, so W = F × d.",
     "Knowns: F = 50 N, d = 4 m.",
     "W = 50 × 4 = 200.",
     "Units: N × m = J. Answer: 200 J ✅"] },
   { q: "A 2 kg ball moves at 3 m/s. What is its kinetic energy?", steps: [
     "KE = ½ × m × v².",
     "Square the speed first: 3² = 9.",
     "KE = ½ × 2 × 9 = 9.",
     "Answer: 9 J ✅"] },
   { q: "A 1 kg rock sits on a 5 m cliff. What is its PE? If it falls (no air resistance), what is its KE just before landing? (g = 9.8)", steps: [
     "PE = m × g × h = 1 × 9.8 × 5 = 49 J.",
     "As it falls, PE turns into KE.",
     "At the bottom, h = 0 so PE = 0. All 49 J became KE.",
     "KE just before landing = 49 J ✅"] }
  ],
  pr: [
   { q: "What is the unit of work and energy?", c: ["newton", "watt", "joule", "meter"], a: 2, hint: "1 N × 1 m = 1 ___", why: "Work and energy are measured in joules (J)." },
   { q: "You lift a 20 N bag 1.5 m. Work done?", c: ["30 J", "13.3 J", "21.5 J", "0 J"], a: 0, hint: "W = F × d", why: "20 × 1.5 = 30 J." },
   { q: "You push hard on a wall for 1 minute but it doesn't move. Work done on the wall?", c: ["Lots", "0 J", "60 J", "It depends on how hard you push"], a: 1, hint: "Did the wall move?", why: "d = 0, so W = F × 0 = 0 J. You get tired, but no work is done ON the wall." },
   { q: "A 4 kg ball rolls at 2 m/s. KE?", c: ["8 J", "16 J", "4 J", "32 J"], a: 0, hint: "½ × 4 × 2²", why: "½ × 4 × 4 = 8 J." },
   { q: "A 3 kg box on a 2 m shelf. PE? (g = 9.8)", c: ["6 J", "58.8 J", "29.4 J", "14.7 J"], a: 1, hint: "m × g × h", why: "3 × 9.8 × 2 = 58.8 J." },
   { q: "At the very top of its swing, a pendulum has mostly…", c: ["kinetic energy", "potential energy", "no energy", "sound energy"], a: 1, hint: "At the top it stops for an instant.", why: "At the top it's highest and stopped for an instant, so it's mostly PE." }
  ],
  ch: [
   { q: "If a car's speed doubles, its kinetic energy becomes…", c: ["2 times as big", "4 times as big", "half as big", "the same"], a: 1, hint: "v is squared.", why: "KE ∝ v². (2v)² = 4v², so 4 times." },
   { q: "A 2 kg ball is dropped from 10 m. Ignoring air, what is its KE when it is 4 m above the ground? (g = 9.8)", c: ["78.4 J", "117.6 J", "196 J", "39.2 J"], a: 1, hint: "Total ME = PE at the top. Subtract the PE it still has.", why: "Top: PE = 2 × 9.8 × 10 = 196 J. At 4 m: PE = 2 × 9.8 × 4 = 78.4 J. KE = 196 − 78.4 = 117.6 J." },
   { q: "A waiter carries a tray at a steady height across the room. How much work does his upward force do on the tray?", c: ["Force × distance across the room", "0 J", "The tray's weight × height", "It depends on his speed"], a: 1, hint: "Is the motion in the direction of his force?", why: "His force is up; the tray moves sideways. No motion in the direction of the force, so W = 0." }
  ],
  tq: [
   { q: "Which has more kinetic energy?", c: ["a 1 kg ball at 4 m/s", "a 2 kg ball at 2 m/s", "the same", "can't tell"], a: 0, hint: "Work out ½mv² for each.", why: "½ × 1 × 16 = 8 J vs ½ × 2 × 4 = 4 J. The faster ball wins." },
   { q: "Mechanical energy is…", c: ["KE − PE", "KE + PE", "KE × PE", "only KE"], a: 1, hint: "Add the two kinds.", why: "ME = KE + PE." },
   { q: "As a skateboarder rolls down a ramp, energy changes from…", c: ["KE to PE", "PE to KE", "PE to sound only", "nothing changes"], a: 1, hint: "Going down = losing height, gaining speed.", why: "Height (PE) turns into speed (KE)." },
   { q: "A 60 N force pushes a cart 0.5 m. Work?", c: ["120 J", "30 J", "60.5 J", "0.008 J"], a: 1, hint: "F × d", why: "60 × 0.5 = 30 J." },
   { q: "The law of conservation of energy says energy…", c: ["is used up", "can be created", "is never created or destroyed, only transformed", "always becomes heat"], a: 2, hint: "Think of a falling ball.", why: "Energy only changes form; the total stays the same." }
  ]
 },
 {
  id: "waves", unit: 9, emoji: "🌊", title: "Waves & Oscillations", zh: "波与振动",
  six: [
   "A wave carries ENERGY from place to place. The material it travels through (water, air, a rope) is the medium. The medium wiggles in place; it doesn't travel along with the wave.",
   "Transverse waves wiggle up and down (perpendicular to the direction the wave travels), like a rope. Longitudinal waves squeeze and stretch along the direction of travel, like sound or a Slinky.",
   "Wave speed = frequency × wavelength: v = f × λ. Frequency is waves per second (Hz); period is seconds per wave: T = 1 ÷ f. Something that swings back and forth regularly, like a pendulum or a spring, is in simple harmonic motion (SHM)."
  ],
  words: [
   ["Wave", "波", "A disturbance that carries energy, not matter.", "Ripples on a pond."],
   ["Medium", "介质", "The material a mechanical wave travels through.", "Air for sound, water for ocean waves."],
   ["Transverse wave", "横波", "The medium moves perpendicular to the wave's travel.", "Shaking a rope up and down."],
   ["Longitudinal wave", "纵波", "The medium moves parallel to the wave's travel (compressions and rarefactions).", "Sound waves."],
   ["Wavelength (λ)", "波长", "Distance from one crest to the next, in meters.", "2 m between wave tops."],
   ["Amplitude", "振幅", "Height of the wave from the middle (rest) line. Bigger amplitude = more energy.", "A louder sound has a bigger amplitude."],
   ["Frequency (f)", "频率", "Number of waves per second, in hertz (Hz).", "5 waves pass each second → 5 Hz."],
   ["Period (T)", "周期", "Time for one full wave or swing, in seconds. T = 1/f.", "f = 4 Hz → T = 0.25 s."],
   ["Simple harmonic motion", "简谐运动", "Regular back-and-forth motion around a middle position.", "A pendulum, a mass bouncing on a spring."]
  ],
  moves: [
   { m: "Wave equation: v = f × λ. Also f = v ÷ λ and λ = v ÷ f.", why: "If 3 waves pass each second and each is 2 m long, 3 × 2 = 6 m of wave passes each second. That's 6 m/s." },
   { m: "Frequency and period are flips: T = 1 ÷ f and f = 1 ÷ T.", why: "If 4 waves happen in one second, each one takes a quarter of a second." },
   { m: "Transverse vs longitudinal: ask 'which way does the medium move compared to the wave?' Across → transverse. Along → longitudinal.", why: "That's the only difference between them. Light and rope waves are transverse; sound is longitudinal." },
   { m: "Waves move energy, not stuff. A duck on a pond bobs up and down; it doesn't ride the ripple to shore.", why: "Each bit of water only moves in a small circle. The energy is what travels across the pond." },
   { m: "Mechanical waves (sound, water) need a medium. Electromagnetic waves (light, radio) don't, and they travel at about 3 × 10⁸ m/s.", why: "Sound is molecules bumping into each other, so no molecules (space) = no sound. Light can cross empty space from the Sun." }
  ],
  ex: [
   { q: "A wave has a frequency of 5 Hz and a wavelength of 2 m. What is its speed?", steps: [
     "Want speed. v = f × λ.",
     "Knowns: f = 5 Hz, λ = 2 m.",
     "v = 5 × 2 = 10.",
     "Answer: 10 m/s ✅"] },
   { q: "Sound travels at 340 m/s. A note has a frequency of 170 Hz. What is its wavelength?", steps: [
     "Want wavelength. λ = v ÷ f.",
     "Knowns: v = 340 m/s, f = 170 Hz.",
     "λ = 340 ÷ 170 = 2.",
     "Answer: 2 m ✅"] },
   { q: "A pendulum swings back and forth 2 times every second. What are its frequency and period?", steps: [
     "Frequency = swings per second = 2 Hz.",
     "Period = 1 ÷ f.",
     "T = 1 ÷ 2 = 0.5.",
     "f = 2 Hz, T = 0.5 s ✅"] }
  ],
  pr: [
   { q: "What does a wave carry from place to place?", c: ["water", "air", "energy", "the medium"], a: 2, hint: "Think of the duck bobbing in place.", why: "Waves carry energy. The medium only moves back and forth in place." },
   { q: "Sound is what kind of wave?", c: ["transverse", "longitudinal", "electromagnetic", "it's not a wave"], a: 1, hint: "Air molecules squeeze together along the direction of travel.", why: "Sound is longitudinal: compressions and rarefactions along the wave's direction." },
   { q: "Waves with a frequency of 4 Hz and wavelength 3 m travel at…", c: ["12 m/s", "7 m/s", "1.33 m/s", "0.75 m/s"], a: 0, hint: "v = f × λ", why: "4 × 3 = 12 m/s." },
   { q: "The distance from one crest to the next crest is the…", c: ["amplitude", "frequency", "wavelength", "period"], a: 2, hint: "λ (lambda)", why: "Crest to crest is one wavelength." },
   { q: "A wave has a frequency of 10 Hz. What is its period?", c: ["10 s", "0.1 s", "1 s", "100 s"], a: 1, hint: "T = 1 ÷ f", why: "1 ÷ 10 = 0.1 s." },
   { q: "Which wave carries the MOST energy?", c: ["small amplitude", "large amplitude", "amplitude doesn't matter", "zero amplitude"], a: 1, hint: "Bigger waves at the beach knock you over.", why: "Bigger amplitude means more energy." }
  ],
  ch: [
   { q: "A wave travels 30 m/s with a wavelength of 6 m. What are its frequency and period?", c: ["5 Hz and 0.2 s", "180 Hz and 0.005 s", "0.2 Hz and 5 s", "36 Hz and 1 s"], a: 0, hint: "f = v ÷ λ, then T = 1 ÷ f.", why: "f = 30 ÷ 6 = 5 Hz. T = 1 ÷ 5 = 0.2 s." },
   { q: "If you double the frequency of a wave but its speed stays the same, the wavelength…", c: ["doubles", "halves", "stays the same", "becomes 4 times bigger"], a: 1, hint: "λ = v ÷ f with the same v.", why: "Dividing the same speed by twice the frequency gives half the wavelength." },
   { q: "Why can't you hear an explosion in outer space?", c: ["It's too far away", "Sound needs a medium, and space is (nearly) empty", "Sound is too slow", "Space is too cold"], a: 1, hint: "What does sound travel through?", why: "Sound is a mechanical wave and needs a medium. Space has almost no particles to carry it." }
  ],
  tq: [
   { q: "A rope is shaken up and down and the wave moves to the right. This is…", c: ["a longitudinal wave", "a transverse wave", "not a wave", "a sound wave"], a: 1, hint: "Up-down motion, rightward wave.", why: "The rope moves perpendicular to the wave's travel: transverse." },
   { q: "The unit of frequency is…", c: ["meters", "seconds", "hertz", "joules"], a: 2, hint: "Waves per second.", why: "Frequency is measured in hertz (Hz)." },
   { q: "A radio wave and a sound wave differ because…", c: ["the radio wave needs air", "the radio wave doesn't need a medium", "they are the same", "sound is faster"], a: 1, hint: "One is electromagnetic.", why: "Radio waves are electromagnetic and can travel through empty space; sound needs a medium." },
   { q: "Sound at 340 m/s has a wavelength of 0.5 m. Frequency?", c: ["170 Hz", "680 Hz", "340.5 Hz", "0.0015 Hz"], a: 1, hint: "f = v ÷ λ", why: "340 ÷ 0.5 = 680 Hz." },
   { q: "A pendulum takes 2 s for one full swing. Its frequency is…", c: ["2 Hz", "0.5 Hz", "4 Hz", "1 Hz"], a: 1, hint: "f = 1 ÷ T", why: "1 ÷ 2 = 0.5 Hz." }
  ]
 }
];
