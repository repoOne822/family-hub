// Class Practice: big question sets, aligned to each BASIS Dublin syllabus / textbook:
//  Chemistry: Bishop "Atoms First" units 1–3 (+4A preview): elements 1–20 table, sig figs, SI, density
//  Biology: class units 1–8 term decks (organelles, tissues, bones, joints, muscles, skin, heart & blood, lungs)
//  Pre-Algebra: Martin-Gay Units 1–7 (generators + polygon angle generators)
//  English: Grammar for the Well-Trained Mind (Red) style parts of speech + agreement, literary terms, Animal Farm, clauses preview
//  Latin: Suburani ch. 1–6 (+ ch. 8 preview): verb forms, noun cases, sum/possum/volo/nolo, Roman gods (ch. 4 Dei), vocabulary
//  World History: early civilizations + Greece vocabulary decks
// Everything here is generated from fact tables, so answers are computed, not typed by hand.
(() => {
const S = window.STUDY; if (!S) return;
const sh = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const uniq = a => [...new Set(a.map(String))];
// MC item with 3 distractors drawn from a list (never equal to the answer)
function mc(subj, id, u, q, ans, pool, why) {
  const d = sh(uniq(pool).filter(x => x !== String(ans))).slice(0, 3);
  if (d.length < 3) return;
  const c = sh([String(ans), ...d]);
  S[subj].bank.push({ id: `${subj}:${id}`, u, q, c, a: c.indexOf(String(ans)), why });
}
// term ↔ definition deck: forward (term → meaning) and reverse (meaning → term)
function deck(subj, did, u, pairs, fq, rq, whyf) {
  pairs.forEach(([t, d], i) => {
    mc(subj, `${did}:${i}:f`, u, fq(t), d, pairs.map(p => p[1]), whyf ? whyf(t, d) : `${t}: ${d}.`);
    mc(subj, `${did}:${i}:r`, u, rq(d), t, pairs.map(p => p[0]), whyf ? whyf(t, d) : `${t}: ${d}.`);
  });
}
const addUnit = (subj, unit, before) => { const us = S[subj].units; if (us.some(x => x.id === unit.id)) return; const i = before ? us.findIndex(x => x.id === before) : -1; i < 0 ? us.push(unit) : us.splice(i, 0, unit); };
const setSt = (subj, id, st) => { const x = S[subj].units.find(u => u.id === id); if (x) x.st = st; };

/* ============ CHEMISTRY ============ */
const EL = [ // Z, symbol, name, mass number (most common isotope), group
  [1, "H", "Hydrogen", 1, 1], [2, "He", "Helium", 4, 18], [3, "Li", "Lithium", 7, 1], [4, "Be", "Beryllium", 9, 2], [5, "B", "Boron", 11, 13],
  [6, "C", "Carbon", 12, 14], [7, "N", "Nitrogen", 14, 15], [8, "O", "Oxygen", 16, 16], [9, "F", "Fluorine", 19, 17], [10, "Ne", "Neon", 20, 18],
  [11, "Na", "Sodium", 23, 1], [12, "Mg", "Magnesium", 24, 2], [13, "Al", "Aluminum", 27, 13], [14, "Si", "Silicon", 28, 14], [15, "P", "Phosphorus", 31, 15],
  [16, "S", "Sulfur", 32, 16], [17, "Cl", "Chlorine", 35, 17], [18, "Ar", "Argon", 40, 18], [19, "K", "Potassium", 39, 1], [20, "Ca", "Calcium", 40, 2]];
const shells = z => { const s = []; let left = z; for (const cap of [2, 8, 8, 2]) { if (left <= 0) break; const n = Math.min(cap, left); s.push(n); left -= n; } return s; };
const conf = z => shells(z).join(", ");
const period = z => shells(z).length;
const valence = (z, g) => g === 18 ? (z === 2 ? 2 : 8) : g <= 2 ? g : g - 10;
const ION = { 1: 1, 2: 2, 13: 3, 15: -3, 16: -2, 17: -1 };
const chg = n => n > 0 ? (n === 1 ? "+" : n + "+") : (n === -1 ? "−" : -n + "−");
EL.forEach(([z, sym, name, A, g]) => {
  const near = [z - 2, z - 1, z + 1, z + 2, z + 3].filter(x => x > 0);
  mc("chem", `el:${sym}:p`, "c3", `How many protons does a ${name} (${sym}) atom have?`, z, [...near, A, A - z], `Atomic number of ${name} = ${z} = number of protons.`);
  mc("chem", `el:${sym}:e`, "c3", `How many electrons does a NEUTRAL ${name} atom have?`, z, [...near, A, A - z], `Neutral atom: electrons = protons = ${z}.`);
  if (A - z !== z || z > 1) mc("chem", `el:${sym}:n`, "c3", `${name}-${A} (atomic number ${z}). How many neutrons?`, A - z, [z, A, A + z, A - z + 1, A - z - 1, A - z + 2].filter(x => x >= 0), `Neutrons = mass number − atomic number = ${A} − ${z} = ${A - z}.`);
  mc("chem", `el:${sym}:cfg`, "c3", `What is the electron arrangement of ${name} (atomic number ${z})?`, conf(z), [conf(z + 1), conf(Math.max(1, z - 1)), shells(z).slice().reverse().join(", "), z > 2 ? `2, ${z - 2}` : `1, ${z}`, z > 10 ? `2, 9, ${z - 11}` : `${z}`], `Fill shells in order: 2, then 8, then 8 → ${conf(z)}.`);
  mc("chem", `el:${sym}:sym`, "c3", `What is the chemical symbol for ${name}?`, sym, [...EL.map(e => e[1]), name.slice(0, 2), name[0] + name[2].toUpperCase()].filter(x => x !== sym), `${name} = ${sym}.`);
  mc("chem", `el:${sym}:name`, "c3", `Which element has the symbol ${sym}?`, name, EL.map(e => e[2]), `${sym} = ${name}.`);
  mc("chem", `el:${sym}:per`, "c3", `${name} (atomic number ${z}) is in which period (row)?`, period(z), [1, 2, 3, 4], `Its electrons fill ${period(z)} shell(s): ${conf(z)} → period ${period(z)}.`);
  mc("chem", `el:${sym}:val`, "c3", `How many valence (outer-shell) electrons does ${name} have?`, valence(z, g), [1, 2, 3, 4, 5, 6, 7, 8], `Arrangement ${conf(z)} → ${shells(z).slice(-1)[0]} in the outer shell.`);
  if (ION[g] && z > 1 && sym !== "B") {
    const q = ION[g], e = z - q;
    const sg = q > 0 ? 1 : -1;
    mc("chem", `el:${sym}:ion`, "c3", `What ion does ${name} usually form?`, sym + chg(q), [sym + chg(-q), sym + chg(q + sg), Math.abs(q) > 1 ? sym + chg(q - sg) : sym + chg(-q - sg), sym + " (no charge)"], `${q > 0 ? `It loses ${q} electron(s)` : `It gains ${-q} electron(s)`} to get a full outer shell → ${sym}${chg(q)}.`);
    mc("chem", `el:${sym}:ione`, "c3", `How many electrons does the ion ${sym}${chg(q)} have?`, e, [z, z + q, e + 1, e - 1, e + 2].filter(x => x >= 0), `${sym} has ${z} protons. Charge ${chg(q)} means ${q > 0 ? `${q} fewer` : `${-q} more`} electrons: ${e}.`);
  }
});
// isotopes
[["Carbon", 6, 13], ["Carbon", 6, 14], ["Hydrogen", 1, 2], ["Hydrogen", 1, 3], ["Oxygen", 8, 18], ["Oxygen", 8, 17], ["Chlorine", 17, 37], ["Potassium", 19, 40], ["Magnesium", 12, 26], ["Neon", 10, 22], ["Lithium", 3, 6], ["Boron", 5, 10], ["Nitrogen", 7, 15], ["Silicon", 14, 30], ["Sulfur", 16, 34], ["Calcium", 20, 44]].forEach(([n, z, A], i) => {
  mc("chem", `iso:${i}`, "c3", `${n}-${A} has atomic number ${z}. How many neutrons does it have?`, A - z, [z, A, A - z + 1, A - z - 1, A + z], `Neutrons = ${A} − ${z} = ${A - z}. Same element, different neutrons = an isotope.`);
  mc("chem", `isop:${i}`, "c3", `How many protons does ${n}-${A} have?`, z, [A, A - z, z + 1, z - 1 || z + 2], `Every ${n} atom has ${z} protons. The ${A} is protons + neutrons.`);
});
// protons/neutrons/electrons concept deck
deck("chem", "sub", "c3", [["proton", "positive particle in the nucleus"], ["neutron", "neutral particle in the nucleus"], ["electron", "negative particle outside the nucleus"], ["nucleus", "tiny dense center of the atom"],
  ["atomic number", "number of protons"], ["mass number", "protons + neutrons"], ["isotope", "same element, different number of neutrons"], ["ion", "atom with a charge from gaining or losing electrons"],
  ["cation", "positive ion (lost electrons)"], ["anion", "negative ion (gained electrons)"], ["valence electrons", "electrons in the outer shell"], ["group", "a column of the periodic table"], ["period", "a row of the periodic table"],
  ["noble gases", "group 18, full outer shells, very unreactive"], ["alkali metals", "group 1, very reactive metals"], ["halogens", "group 17, reactive nonmetals"], ["alkaline earth metals", "group 2 metals"]],
  t => `What does "${t}" mean?`, d => `Which term means: ${d}?`);
// sig figs
const sf = s => { const t = s.replace(/^-/, ""); if (t.includes(".")) { const digits = t.replace(".", "").replace(/^0+/, ""); return digits.length; } return t.replace(/^0+/, "").replace(/0+$/, "").length; };
["4.52", "0.0031", "250", "250.", "1,000", "1.000", "0.400", "3,050", "12.0", "0.00702", "6,000.", "45.60", "100", "100.0", "0.05", "7.008", "92,000", "3.14159", "0.0010", "508", "70.0", "8,040", "0.909", "2.30", "6"].forEach((x, i) => {
  const n = sf(x.replace(/,/g, "")); mc("chem", `sf:${i}`, "c1", `How many significant figures are in ${x}?`, n, [1, 2, 3, 4, 5, 6].filter(v => v !== n), x.includes(".") ? "With a decimal point: start at the first nonzero digit and count every digit after it, trailing zeros too." : "No decimal point: leading and trailing zeros don't count; zeros between nonzero digits do.");
});
// lab safety + measurement deck
deck("chem", "lab", "c1", [["goggles", "protect your eyes during every lab"], ["eyewash station", "rinse a chemical out of your eyes"], ["safety shower", "rinse chemicals off your body"], ["fume hood", "pull harmful vapors away while you work"],
  ["fire blanket", "smother a fire on clothing"], ["graduated cylinder", "measure liquid volume precisely"], ["balance", "measure mass"], ["beaker", "hold and mix liquids (rough volume only)"], ["meniscus", "curve of a liquid's surface: read the bottom"],
  ["thermometer", "measure temperature"], ["Bunsen burner", "heat things with a gas flame"]], t => `What is the ${t} used for?`, d => `Which lab item do you use to ${d}?`);
deck("chem", "si", "c1", [["meter (m)", "length"], ["kilogram (kg)", "mass"], ["second (s)", "time"], ["kelvin (K)", "temperature"], ["liter (L)", "volume (common lab unit)"], ["mole (mol)", "amount of substance"]],
  t => `The ${t} is the unit for…`, d => `Which unit measures ${d}?`);
deck("chem", "pre", "c1", [["kilo- (k)", "1,000×"], ["hecto- (h)", "100×"], ["deka- (da)", "10×"], ["deci- (d)", "1/10"], ["centi- (c)", "1/100"], ["milli- (m)", "1/1,000"]],
  t => `What does the prefix ${t} mean?`, d => `Which metric prefix means ${d}?`);
deck("chem", "var", "c1", [["independent variable", "the one thing you change on purpose"], ["dependent variable", "what you measure"], ["controlled variable (constant)", "what you keep the same"], ["control group", "the group with no treatment, for comparison"],
  ["hypothesis", "a testable prediction"], ["accuracy", "how close a measurement is to the true value"], ["precision", "how close repeated measurements are to each other"], ["qualitative data", "descriptions (color, smell)"], ["quantitative data", "numbers with units"]],
  t => `What is "${t}"?`, d => `Which term means: ${d}?`);
// matter
deck("chem", "mat", "c2", [["element", "pure substance with only one kind of atom"], ["compound", "two or more elements chemically bonded in a fixed ratio"], ["homogeneous mixture", "mixture that looks the same throughout (a solution)"], ["heterogeneous mixture", "mixture whose parts you can see"],
  ["physical change", "changes form or state, but no new substance"], ["chemical change", "makes a new substance"], ["density", "mass ÷ volume"], ["melting", "solid → liquid"], ["freezing", "liquid → solid"], ["evaporation", "liquid → gas"],
  ["condensation", "gas → liquid"], ["sublimation", "solid → gas"], ["deposition", "gas → solid"], ["solute", "the substance that dissolves"], ["solvent", "the substance that does the dissolving"]],
  t => `What is ${t}?`, d => `Which term means: ${d}?`);
[["Water", "compound"], ["Oxygen gas (O₂)", "element"], ["Salt water", "homogeneous mixture"], ["Trail mix", "heterogeneous mixture"], ["Gold", "element"], ["Carbon dioxide (CO₂)", "compound"], ["Air", "homogeneous mixture"], ["Sand and iron filings", "heterogeneous mixture"],
 ["Table salt (NaCl)", "compound"], ["Iron", "element"], ["Lemonade (fully dissolved)", "homogeneous mixture"], ["Cereal in milk", "heterogeneous mixture"], ["Sugar (C₁₂H₂₂O₁₁)", "compound"], ["Helium", "element"]].forEach(([x, k], i) =>
  mc("chem", `cls:${i}`, "c2", `Classify: ${x}`, k, ["element", "compound", "homogeneous mixture", "heterogeneous mixture"], `${x} is a${/^[aeiou]/.test(k) ? "n" : ""} ${k}.`));
[["Burning wood", "chemical"], ["Melting ice", "physical"], ["Rusting iron", "chemical"], ["Tearing paper", "physical"], ["Baking a cake", "chemical"], ["Dissolving sugar in water", "physical"], ["Boiling water", "physical"], ["Digesting food", "chemical"],
 ["A match lighting", "chemical"], ["Cutting hair", "physical"], ["Milk going sour", "chemical"], ["Crushing a can", "physical"], ["Fireworks exploding", "chemical"], ["Freezing juice", "physical"]].forEach(([x, k], i) =>
  mc("chem", `chg:${i}`, "c2", `${x}: physical or chemical change?`, k + " change", ["physical change", "chemical change", "no change", "nuclear change"], k === "chemical" ? "A new substance forms." : "Same substance, only shape or state changed."));
// ionic preview (Zero Charge Rule, no criss-cross)
[["Na⁺", "Cl⁻", "NaCl"], ["Mg²⁺", "O²⁻", "MgO"], ["Ca²⁺", "Cl⁻", "CaCl₂"], ["Al³⁺", "Cl⁻", "AlCl₃"], ["K⁺", "O²⁻", "K₂O"], ["Li⁺", "F⁻", "LiF"], ["Mg²⁺", "F⁻", "MgF₂"], ["Na⁺", "S²⁻", "Na₂S"], ["Al³⁺", "O²⁻", "Al₂O₃"], ["Ca²⁺", "S²⁻", "CaS"]].forEach(([a, b, f], i) => {
  const base = a.replace(/[⁺²³]/g, ""), an = b.replace(/[⁻²³]/g, "");
  mc("chem", `ionf:${i}`, "c4", `${a} and ${b} form an ionic compound. What is its formula?`, f, [base + an, base + an + "₂", base + "₂" + an, base + "₃" + an + "₂", base + an + "₃"].filter(x => x !== f), `Add ions until the total charge is zero (Zero Charge Rule) → ${f}.`);
});

/* ============ BIOLOGY ============ */
S.bio.units.find(u => u.id === "b2").name = "Homeostasis, cells & organelles"; S.bio.units.find(u => u.id === "b2").zh = "稳态、细胞和细胞器";
deck("bio", "org", "b2", [["nucleus", "control center that holds the DNA"], ["ribosome", "builds proteins"], ["rough ER", "ER with ribosomes; helps make and move proteins"], ["smooth ER", "ER without ribosomes; makes lipids"],
  ["Golgi apparatus", "packages and ships proteins"], ["lysosome", "breaks down waste and old cell parts"], ["mitochondria", "cellular respiration: makes ATP"], ["chloroplast", "photosynthesis (plants only)"], ["vacuole", "stores water and materials (one large one in plants)"],
  ["cell membrane", "controls what enters and leaves the cell"], ["cell wall", "rigid outer layer in plant cells"], ["cytoplasm", "jelly-like fluid that fills the cell"], ["vesicle", "small sac that carries materials"], ["centriole", "helps animal cells divide"], ["nucleolus", "makes ribosomes inside the nucleus"]],
  t => `What does the ${t} do?`, d => `Which part of the cell matches: ${d}?`, (t, d) => `${t}: ${d}.`);
deck("bio", "hom", "b2", [["homeostasis", "keeping the inside of the body stable"], ["ATP", "the energy molecule cells use"], ["prokaryote", "cell with no nucleus (bacteria)"], ["eukaryote", "cell with a nucleus"], ["cellular respiration", "uses glucose and oxygen to make ATP"],
  ["photosynthesis", "uses sunlight to make glucose"], ["diffusion", "movement from high to low concentration"], ["osmosis", "diffusion of water across a membrane"], ["negative feedback", "a response that reverses a change (like sweating when hot)"], ["cell theory", "all living things are made of cells that come from other cells"]],
  t => `What is ${t}?`, d => `Which term means: ${d}?`);
[["Sweating when you are hot", "homeostasis"], ["Shivering when you are cold", "homeostasis"], ["Feeling thirsty when low on water", "homeostasis"]].forEach(([x, k], i) =>
  mc("bio", `homx:${i}`, "b2", `${x} is an example of…`, "homeostasis", ["homeostasis", "photosynthesis", "ossification", "mitosis"], "The body reacts to bring its internal conditions back to normal."));
deck("bio", "tis", "b3", [["epithelial tissue", "covers and lines surfaces (skin, organ linings)"], ["connective tissue", "supports and connects (bone, blood, fat, cartilage)"], ["muscle tissue", "contracts to move the body"], ["nervous tissue", "sends electrical signals (brain, nerves)"],
  ["cell", "the smallest unit of life"], ["tissue", "a group of similar cells doing one job"], ["organ", "different tissues working together (heart, stomach)"], ["organ system", "organs working together (digestive system)"], ["organism", "a whole living thing"]],
  t => `What is ${t}?`, d => `Which one is: ${d}?`);
[["Blood", "connective tissue"], ["Bone", "connective tissue"], ["Fat", "connective tissue"], ["Outer layer of skin", "epithelial tissue"], ["Lining of the stomach", "epithelial tissue"], ["Brain", "nervous tissue"], ["Spinal cord", "nervous tissue"], ["Heart wall", "muscle tissue"], ["Biceps", "muscle tissue"], ["Cartilage", "connective tissue"]].forEach(([x, k], i) =>
  mc("bio", `tisx:${i}`, "b3", `${x} is mostly which tissue type?`, k, ["epithelial tissue", "connective tissue", "muscle tissue", "nervous tissue"], `${x}: ${k}.`));
deck("bio", "bone", "b4", [["cranium", "skull bone that protects the brain"], ["mandible", "lower jaw"], ["clavicle", "collarbone"], ["scapula", "shoulder blade"], ["sternum", "breastbone in the center of the chest"], ["ribs", "protect the heart and lungs"],
  ["vertebrae", "bones of the spine"], ["humerus", "upper arm bone"], ["radius", "forearm bone on the thumb side"], ["ulna", "forearm bone on the pinky side"], ["carpals", "wrist bones"], ["metacarpals", "bones of the palm"], ["phalanges", "finger and toe bones"],
  ["pelvis", "hip bones"], ["femur", "thigh bone, the longest bone in the body"], ["patella", "kneecap"], ["tibia", "shinbone, the larger lower-leg bone"], ["fibula", "thinner lower-leg bone"], ["tarsals", "ankle bones"], ["metatarsals", "bones of the foot"]],
  t => `Where or what is the ${t}?`, d => `Which bone is the ${d}?`);
deck("bio", "skel", "b4", [["ball-and-socket joint", "moves in all directions (shoulder, hip)"], ["hinge joint", "bends back and forth one way (knee, elbow)"], ["pivot joint", "rotates (top of the neck)"], ["gliding joint", "flat bones slide past each other (wrist, ankle)"],
  ["ligament", "connects bone to bone"], ["tendon", "connects muscle to bone"], ["cartilage", "smooth, flexible tissue cushioning joints"], ["red bone marrow", "makes blood cells"], ["yellow bone marrow", "stores fat"], ["compact bone", "hard, dense outer layer of bone"],
  ["spongy bone", "lighter bone with tiny spaces"], ["ossification", "cartilage turning into bone"], ["osteoporosis", "bones become weak and brittle"], ["arthritis", "painful swelling of the joints"], ["fracture", "a broken bone"]],
  t => `What is a ${t}?`, d => `Which term means: ${d}?`);
deck("bio", "musc", "b5", [["biceps", "front of the upper arm; bends (flexes) the elbow"], ["triceps", "back of the upper arm; straightens the elbow"], ["deltoid", "rounded shoulder muscle; lifts the arm"], ["pectoralis major", "chest muscle"],
  ["abdominals", "stomach muscles"], ["quadriceps", "front of the thigh; straightens the knee"], ["hamstrings", "back of the thigh; bends the knee"], ["gastrocnemius", "calf muscle"], ["gluteus maximus", "buttock muscle, the largest muscle"],
  ["trapezius", "upper back and neck ('traps')"], ["latissimus dorsi", "large muscle on the side of the back ('lats')"], ["diaphragm", "muscle under the lungs used for breathing"]],
  t => `Where is the ${t} and what does it do?`, d => `Which muscle is this: ${d}?`);
deck("bio", "mus2", "b5", [["skeletal muscle", "voluntary muscle attached to bones"], ["smooth muscle", "involuntary muscle in organs (stomach, blood vessels)"], ["cardiac muscle", "involuntary muscle found only in the heart"], ["voluntary", "you control it on purpose"],
  ["involuntary", "works without you thinking about it"], ["myocyte", "a single muscle cell (fiber)"], ["fascicle", "a bundle of muscle fibers"], ["myofibril", "thread inside a muscle fiber that contracts"], ["actin", "thin protein filament in muscle"],
  ["myosin", "thick protein filament that pulls actin"], ["antagonistic pair", "two muscles that pull in opposite directions"], ["strain", "overstretched muscle or tendon"], ["sprain", "overstretched or torn ligament"], ["tendinitis", "a swollen, irritated tendon"]],
  t => `What is ${t}?`, d => `Which term means: ${d}?`);
deck("bio", "skin", "b6", [["epidermis", "outer layer of skin"], ["dermis", "middle layer with nerves, blood vessels and glands"], ["subcutaneous layer", "deepest layer, stores fat"], ["melanin", "pigment that colors skin and blocks UV"],
  ["keratin", "tough protein in hair, nails and outer skin"], ["collagen", "protein that makes skin strong and stretchy"], ["sweat gland", "releases sweat to cool you"], ["oil (sebaceous) gland", "releases oil to keep skin and hair moist"],
  ["hair follicle", "pocket in the dermis where hair grows"], ["integumentary system", "skin, hair and nails"], ["pores", "openings where sweat leaves the skin"]],
  t => `What is the ${t}?`, d => `Which term is: ${d}?`);
deck("bio", "card", "b7", [["artery", "carries blood away from the heart"], ["vein", "carries blood back to the heart"], ["capillary", "tiny vessel where gases and nutrients are exchanged"], ["atrium", "upper heart chamber that receives blood"],
  ["ventricle", "lower heart chamber that pumps blood out"], ["valve", "flap that keeps blood flowing one way"], ["aorta", "largest artery, leaving the left ventricle"], ["vena cava", "large vein bringing blood back to the right atrium"],
  ["pulmonary artery", "carries oxygen-poor blood to the lungs"], ["pulmonary vein", "carries oxygen-rich blood from the lungs to the heart"], ["red blood cell", "carries oxygen using hemoglobin"], ["white blood cell", "fights infection"],
  ["platelet", "helps blood clot"], ["plasma", "liquid part of blood"], ["hemoglobin", "iron protein that holds oxygen"], ["septum", "wall dividing the left and right sides of the heart"], ["pulse", "the beat of blood pushed through arteries"], ["blood pressure", "the force of blood on artery walls"]],
  t => `What is a ${t}?`, d => `Which part is this: ${d}?`);
const PATH = ["right atrium", "right ventricle", "pulmonary artery", "lungs", "pulmonary vein", "left atrium", "left ventricle", "aorta"];
PATH.slice(0, -1).forEach((p, i) => mc("bio", `path:${i}`, "b7", `Blood path: after the ${p}, where does blood go next?`, PATH[i + 1], PATH.filter((_, j) => j !== i + 1 && j !== i), `Body → right atrium → right ventricle → pulmonary artery → lungs → pulmonary vein → left atrium → left ventricle → aorta → body.`));
deck("bio", "resp", "b8", [["nasal cavity", "warms, filters and moistens air"], ["pharynx", "throat, shared by air and food"], ["larynx", "voice box"], ["epiglottis", "flap that covers the windpipe when you swallow"], ["trachea", "windpipe with rings of cartilage"],
  ["bronchi", "two tubes leading into the lungs"], ["bronchioles", "smaller branching tubes in the lungs"], ["alveoli", "tiny air sacs where gases are exchanged"], ["diaphragm", "dome muscle that contracts to pull air in"], ["inhale", "breathe in (diaphragm moves down)"], ["exhale", "breathe out (diaphragm relaxes up)"], ["cilia", "tiny hairs that sweep mucus and dust out"]],
  t => `What is the ${t}?`, d => `Which part is this: ${d}?`);
const AIR = ["nasal cavity", "pharynx", "larynx", "trachea", "bronchi", "bronchioles", "alveoli"];
AIR.slice(0, -1).forEach((p, i) => mc("bio", `air:${i}`, "b8", `Air path: after the ${p}, air goes to the…`, AIR[i + 1], AIR.filter((_, j) => j !== i + 1 && j !== i), "Nose → pharynx → larynx → trachea → bronchi → bronchioles → alveoli."));
deck("bio", "exp", "b1", [["observation", "something you notice with your senses"], ["inference", "a conclusion based on what you observed"], ["hypothesis", "a testable 'If…, then…' prediction"], ["independent variable", "what the scientist changes"],
  ["dependent variable", "what is measured"], ["controlled variable", "kept the same in every trial"], ["control group", "gets no treatment, for comparison"], ["trial", "one run of the experiment"], ["data", "the information collected"], ["conclusion", "says whether the data supports the hypothesis"]],
  t => `What is ${t === "data" ? "data" : "a " + t}?`, d => `Which term means: ${d}?`);
[["How does the amount of sunlight affect plant growth?", "amount of sunlight", "plant growth"], ["Does the temperature of water change how fast sugar dissolves?", "water temperature", "how fast sugar dissolves"],
 ["How does exercise time affect heart rate?", "exercise time", "heart rate"], ["Does the type of music change how long a person studies?", "type of music", "study time"], ["How does fertilizer amount affect the number of tomatoes?", "fertilizer amount", "number of tomatoes"]].forEach(([q, iv, dv], i) => {
  mc("bio", `ivq:${i}`, "b1", `"${q}" What is the independent variable?`, iv, [dv, "the control group", "the hypothesis"], `The independent variable is what you change: ${iv}.`);
  mc("bio", `dvq:${i}`, "b1", `"${q}" What is the dependent variable?`, dv, [iv, "the control group", "the number of trials"], `The dependent variable is what you measure: ${dv}.`);
});

/* ============ PRE-ALGEBRA ============ */
addUnit("prealg", { id: "p7", name: "Quadrilaterals & polygons (preview)", zh: "四边形和多边形（预习）", st: "next", gens: ["polysum", "quadmiss", "regangle"] });
const G = (window.QGEN || {}).GEN; const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const PN = { 3: "triangle", 4: "quadrilateral", 5: "pentagon", 6: "hexagon", 7: "heptagon", 8: "octagon", 9: "nonagon", 10: "decagon", 12: "dodecagon" };
if (G) {
  G.polysum = { name: "Polygon angle sum", subject: "math", gen() { const ns = [4, 5, 6, 7, 8, 9, 10, 12], n = ns[ri(0, ns.length - 1)]; return { q: `What is the sum of the interior angles of a ${PN[n]} (${n} sides)?`, ans: (n - 2) * 180, unit: "°", units: ["°"], steps: ["Sum = (n − 2) × 180°", `(${n} − 2) × 180 = ${(n - 2) * 180}°`] }; } };
  G.quadmiss = { name: "Missing angle in a quadrilateral", subject: "math", gen() { const a = ri(60, 120), b = ri(60, 120), c = ri(50, 110), d = 360 - a - b - c; if (d <= 10 || d >= 180) return G.quadmiss.gen(); return { q: `A quadrilateral has angles ${a}°, ${b}° and ${c}°. What is the fourth angle?`, ans: d, unit: "°", units: ["°"], steps: ["Angles in a quadrilateral add to 360°.", `360 − ${a} − ${b} − ${c} = ${d}°`] }; } };
  G.regangle = { name: "Each angle of a regular polygon", subject: "math", gen() { const ns = [3, 4, 5, 6, 8, 9, 10, 12], n = ns[ri(0, ns.length - 1)]; return { q: `What is each interior angle of a regular ${PN[n]}?`, ans: (n - 2) * 180 / n, unit: "°", units: ["°"], steps: ["Sum = (n − 2) × 180°, then divide by n.", `(${n} − 2) × 180 ÷ ${n} = ${(n - 2) * 180 / n}°`] }; } };
}
deck("prealg", "vocab1", "p1", [["integer", "a whole number or its opposite (… −2, −1, 0, 1, 2 …)"], ["absolute value", "distance from zero"], ["opposite", "same distance from zero on the other side"], ["prime number", "has exactly two factors, 1 and itself"],
  ["composite number", "has more than two factors"], ["reciprocal", "flip of a fraction; multiplies to 1"], ["commutative property", "order doesn't matter: a + b = b + a"], ["associative property", "grouping doesn't matter: (a + b) + c = a + (b + c)"], ["distributive property", "a(b + c) = ab + ac"]],
  t => `What is ${/^[aeiou]/.test(t) ? "an" : "a"} ${t}?`, d => `Which term means: ${d}?`);
deck("prealg", "vocab2", "p2", [["variable", "a letter that stands for a number"], ["coefficient", "the number multiplying a variable"], ["constant", "a term with no variable"], ["like terms", "same variables to the same powers"], ["expression", "numbers, variables and operations with no equals sign"],
  ["equation", "two expressions set equal"], ["inverse operation", "undoes another operation (+ and −, × and ÷)"], ["solution", "the value that makes an equation true"]], t => `What is ${/^[aeiou]/.test(t) ? "an" : "a"} ${t}?`, d => `Which term means: ${d}?`);
deck("prealg", "vocab6", "p6", [["acute angle", "less than 90°"], ["right angle", "exactly 90°"], ["obtuse angle", "between 90° and 180°"], ["straight angle", "exactly 180°"], ["complementary angles", "add to 90°"], ["supplementary angles", "add to 180°"],
  ["vertical angles", "opposite angles when two lines cross; equal"], ["adjacent angles", "share a side and a vertex"], ["equilateral triangle", "3 equal sides, each angle 60°"], ["isosceles triangle", "at least 2 equal sides"], ["scalene triangle", "no equal sides"],
  ["right triangle", "has one 90° angle"], ["exterior angle", "equals the sum of the two far interior angles"]], t => `What is ${/^[aeiou]/.test(t) ? "an" : "a"} ${t}?`, d => `Which term means: ${d}?`);
deck("prealg", "vocab7", "p7", [["parallelogram", "2 pairs of parallel sides"], ["rectangle", "parallelogram with 4 right angles"], ["rhombus", "parallelogram with 4 equal sides"], ["square", "4 equal sides and 4 right angles"], ["trapezoid", "exactly 1 pair of parallel sides"],
  ["regular polygon", "all sides and all angles equal"], ["similar figures", "same shape, sides in proportion"], ["congruent figures", "same shape and same size"]], t => `What is a ${t}?`, d => `Which shape or term is: ${d}?`);

/* ============ ENGLISH ============ */
addUnit("english", { id: "e5", name: "Clauses & punctuation (preview)", zh: "从句和标点（预习）", st: "next" });
const SENT = [ // sentence, [[word, part of speech]]
  ["The curious cat quietly watched the birds.", [["curious", "adjective"], ["quietly", "adverb"], ["watched", "verb"], ["birds", "noun"]]],
  ["She and I walked to the library after school.", [["She", "pronoun"], ["and", "conjunction"], ["walked", "verb"], ["to", "preposition"], ["after", "preposition"], ["library", "noun"]]],
  ["Wow, that was an amazing goal!", [["Wow", "interjection"], ["amazing", "adjective"], ["goal", "noun"], ["was", "verb"]]],
  ["The tired runners slowly crossed the finish line.", [["tired", "adjective"], ["slowly", "adverb"], ["crossed", "verb"], ["runners", "noun"]]],
  ["My brother often plays chess with his friends.", [["often", "adverb"], ["plays", "verb"], ["with", "preposition"], ["chess", "noun"]]],
  ["We were hungry, but the kitchen was closed.", [["We", "pronoun"], ["hungry", "adjective"], ["but", "conjunction"], ["kitchen", "noun"]]],
  ["The old house on the hill looked very spooky.", [["old", "adjective"], ["on", "preposition"], ["very", "adverb"], ["spooky", "adjective"], ["looked", "verb"]]],
  ["Oh no, the puppy chewed my new shoes!", [["Oh no", "interjection"], ["chewed", "verb"], ["new", "adjective"], ["puppy", "noun"]]],
  ["They carefully carried the heavy boxes up the stairs.", [["They", "pronoun"], ["carefully", "adverb"], ["heavy", "adjective"], ["up", "preposition"], ["carried", "verb"]]],
  ["Napoleon and Snowball argued about the windmill.", [["Napoleon", "noun"], ["and", "conjunction"], ["argued", "verb"], ["about", "preposition"]]],
  ["Boxer worked harder every single day.", [["Boxer", "noun"], ["worked", "verb"], ["harder", "adverb"], ["single", "adjective"]]],
  ["The bright sun rose slowly over the quiet farm.", [["bright", "adjective"], ["rose", "verb"], ["slowly", "adverb"], ["over", "preposition"], ["quiet", "adjective"]]],
  ["You should finish your homework before dinner.", [["You", "pronoun"], ["finish", "verb"], ["before", "preposition"], ["homework", "noun"]]],
  ["Either the dog or the cat broke the vase.", [["Either", "conjunction"], ["or", "conjunction"], ["broke", "verb"], ["vase", "noun"]]],
  ["Hooray, our team finally won!", [["Hooray", "interjection"], ["finally", "adverb"], ["won", "verb"]]]];
const POS = ["noun", "pronoun", "verb", "adjective", "adverb", "preposition", "conjunction", "interjection"];
const POSWHY = { noun: "names a person, place, thing or idea", pronoun: "takes the place of a noun", verb: "shows action or being", adjective: "describes a noun", adverb: "describes a verb, adjective or another adverb (how, when, where, how much)", preposition: "shows how a noun relates to another word (in, on, under, after…)", conjunction: "joins words or groups of words", interjection: "shows strong feeling", article: "a, an, the (a kind of adjective)" };
SENT.forEach(([s, ws], i) => ws.forEach(([w, p], j) => mc("english", `pos:${i}:${j}`, "e2", `"${s}"\nWhat part of speech is "${w}"?`, p, POS, `"${w}" ${POSWHY[p]}, so it's ${/^[aeiou]/.test(p) ? "an" : "a"} ${p}.`)));
deck("english", "posd", "e2", Object.entries(POSWHY), t => `What does ${/^[aeiou]/.test(t) ? "an" : "a"} ${t} do?`, d => `Which part of speech ${d}?`);
// subject–verb agreement generator
const SUBJ1 = [["The dog", 1], ["The dogs", 0], ["My friends", 0], ["Everyone", 1], ["Each of the students", 1], ["Both of the girls", 0], ["Nobody", 1], ["The box of pencils", 1], ["The pencils in the box", 0], ["Several players", 0],
  ["Tom and Jerry", 0], ["Neither the coach nor the players", 0], ["Neither the players nor the coach", 1], ["The team", 1], ["One of my cousins", 1], ["Somebody", 1], ["The pigs on the farm", 0], ["Squealer", 1], ["The animals", 0], ["Many of the books", 0]];
const VERB = [["is", "are"], ["has", "have"], ["was", "were"], ["runs", "run"], ["wants", "want"], ["does", "do"]];
SUBJ1.forEach(([sub, sg], i) => { const [v1, v2] = VERB[i % VERB.length], ans = sg ? v1 : v2;
  const rest = { is: "ready.", has: "a plan.", was: "late.", runs: "fast.", wants: "a turn.", does: "the dishes." }[v1];
  S.english.bank.push({ id: `english:sva:${i}`, u: "e3", q: `Choose the correct verb: "${sub} ___ ${rest}"`, c: [v1, v2], a: sg ? 0 : 1, why: sg ? `The subject "${sub}" is singular → ${ans}. ${/ (of|in|on) /.test(sub) ? "Ignore the prepositional phrase." : /Neither|Each|Everyone|Nobody|Somebody|One/.test(sub) ? (/Neither/.test(sub) ? "With neither/nor, match the closer subject." : "This pronoun is singular.") : ""}` : `The subject "${sub}" is plural → ${ans}. ${/Neither/.test(sub) ? "With neither/nor, match the closer subject." : /and/.test(sub) ? "Two subjects joined by 'and' are plural." : ""}` });
});
deck("english", "conj", "e3", [["coordinating conjunction", "joins equal parts: for, and, nor, but, or, yet, so (FANBOYS)"], ["subordinating conjunction", "starts a dependent clause: because, although, when, if, since"], ["correlative conjunctions", "work in pairs: either/or, neither/nor, both/and"]],
  t => `What is a ${t}?`, d => `Which kind of conjunction ${d}?`);
["for", "and", "nor", "but", "or", "yet", "so"].forEach((w, i) => mc("english", `fan:${i}`, "e3", `"${w}" is what kind of conjunction?`, "coordinating", ["coordinating", "subordinating", "correlative", "it's a preposition"], "FANBOYS: for, and, nor, but, or, yet, so."));
["because", "although", "when", "since", "unless", "while", "if", "after"].forEach((w, i) => mc("english", `sub:${i}`, "e3", `In "We stayed inside ${w} it was raining," the word "${w}" is a…`, "subordinating conjunction", ["coordinating conjunction", "subordinating conjunction", "correlative conjunction", "interjection"], `"${w}" starts a dependent clause, so it's subordinating.`));
deck("english", "lit", "e1", [["setting", "where and when a story happens"], ["protagonist", "the main character"], ["antagonist", "the character or force against the main character"], ["conflict", "the problem or struggle"], ["exposition", "the beginning that introduces characters and setting"],
  ["rising action", "events that build tension"], ["climax", "the turning point, highest tension"], ["falling action", "events after the climax"], ["resolution", "how the story ends"], ["theme", "the message or lesson"], ["foreshadowing", "hints about what will happen later"],
  ["flashback", "a scene from the past"], ["situational irony", "the opposite of what you expect happens"], ["dramatic irony", "the reader knows something a character doesn't"], ["first-person point of view", "the narrator says 'I'"], ["third-person point of view", "the narrator uses he, she, they"],
  ["simile", "comparison using like or as"], ["metaphor", "comparison without like or as"], ["personification", "giving human traits to non-human things"], ["hyperbole", "huge exaggeration"], ["onomatopoeia", "a word that sounds like what it means (buzz)"], ["imagery", "words that appeal to the five senses"], ["annotation", "notes you write in the margins while reading"], ["citation", "tells where a quote or fact came from"]],
  t => `What is ${t}?`, d => `Which literary term means: ${d}?`);
[["The wind howled angrily all night.", "personification"], ["He was as fast as lightning.", "simile"], ["The classroom was a zoo.", "metaphor"], ["I've told you a million times!", "hyperbole"], ["The bees buzzed by the hive.", "onomatopoeia"], ["Her smile was like sunshine.", "simile"],
 ["The stars danced in the sky.", "personification"], ["My backpack weighs a ton.", "hyperbole"], ["Time is a thief.", "metaphor"], ["The fire crackled and popped.", "onomatopoeia"]].forEach(([x, k], i) =>
  mc("english", `dev:${i}`, "e1", `"${x}" is an example of…`, k, ["simile", "metaphor", "personification", "hyperbole", "onomatopoeia"], `${k}.`));
deck("english", "af", "e4", [["Old Major", "old boar whose dream inspires the rebellion"], ["Napoleon", "pig who takes total control of the farm"], ["Snowball", "clever pig who plans the windmill and is chased away"], ["Squealer", "pig who persuades the animals and twists the truth"],
  ["Boxer", "strong, loyal horse whose motto is 'I will work harder'"], ["Clover", "kind mare who cares for the other animals"], ["Benjamin", "old donkey who doubts everything"], ["Mollie", "vain horse who loves ribbons and sugar"], ["Moses", "raven who tells of Sugarcandy Mountain"],
  ["Mr. Jones", "drunken farmer the animals drive out"], ["the dogs", "Napoleon's guards who enforce his rule"], ["the sheep", "animals who bleat slogans to drown out debate"]],
  t => `Who is ${t} in Animal Farm?`, d => `In Animal Farm, who is the ${d}?`);
deck("english", "af2", "e4", [["Animalism", "the animals' ideas about equality and freedom from humans"], ["the Seven Commandments", "the rules painted on the barn wall"], ["'Four legs good, two legs bad'", "the simple slogan the sheep repeat"], ["the windmill", "the big building project the animals labor over"],
  ["the Battle of the Cowshed", "the animals defeat the humans who try to retake the farm"], ["Manor Farm", "the farm's name under Mr. Jones"], ["allegory", "story whose characters and events stand for real people and events"], ["propaganda", "one-sided messages that twist the truth"], ["satire", "uses humor or exaggeration to criticize"]],
  t => `What is ${t} in Animal Farm?`, d => `In Animal Farm, what is ${d}?`);
deck("english", "af3", "e4", [["Napoleon", "Joseph Stalin"], ["Snowball", "Leon Trotsky"], ["Old Major", "Karl Marx / Vladimir Lenin"], ["Mr. Jones", "Tsar Nicholas II"], ["the dogs", "the secret police"], ["Boxer", "the hardworking working class"]],
  t => `In the allegory, ${t} stands for…`, d => `Which Animal Farm character stands for ${d}?`);
mc("english", "afth", "e4", "A good thesis statement for an Animal Farm paragraph…", "makes a clear claim you can support with evidence from the book", ["makes a clear claim you can support with evidence from the book", "summarizes the whole plot", "asks the reader a question", "says 'In this essay I will talk about pigs'"], "A thesis is an arguable claim; your paragraph backs it with quotes and explanation.");
deck("english", "cls", "e5", [["independent clause", "has a subject and verb and can stand alone"], ["dependent clause", "has a subject and verb but can't stand alone"], ["compound sentence", "two independent clauses joined"], ["complex sentence", "an independent clause plus a dependent clause"],
  ["run-on sentence", "two sentences jammed together without correct punctuation"], ["sentence fragment", "an incomplete sentence"], ["semicolon", "joins two closely related independent clauses"], ["colon", "introduces a list or explanation"]],
  t => `What is a ${t}?`, d => `Which term means: ${d}?`);
[["Because it was raining.", "fragment"], ["I like pizza, she likes pasta.", "run-on (comma splice)"], ["I like pizza; she likes pasta.", "correct"], ["When the bell rang, we left.", "correct"], ["Running down the hall.", "fragment"], ["The pigs made rules the animals followed them.", "run-on (comma splice)"]].forEach(([x, k], i) =>
  mc("english", `frag:${i}`, "e5", `"${x}" is…`, k, ["correct", "fragment", "run-on (comma splice)", "a question"], k === "correct" ? "It's a complete, correctly punctuated sentence." : k === "fragment" ? "It's missing an independent clause, so it can't stand alone." : "Two independent clauses need a period, a semicolon, or a comma + FANBOYS."));

/* ============ LATIN ============ */
addUnit("latin", { id: "l7", name: "Roman gods (ch. 4 Dei)", zh: "罗马诸神（4章）", st: "done" }, "l3");
setSt("latin", "l4", "now"); setSt("latin", "l6", "next"); S.latin.units.find(u => u.id === "l6").name = "Imperfect tense (ch. 8, preview)"; S.latin.units.find(u => u.id === "l6").zh = "未完成过去时（8章，预习）";
const PERS = [["o", "I"], ["s", "you"], ["t", "he/she"], ["mus", "we"], ["tis", "you all"], ["nt", "they"]];
const V1 = [["ambul", "walk", "walking"], ["labor", "work", "working"], ["clam", "shout", "shouting"], ["festin", "hurry", "hurrying"], ["habit", "live", "living"], ["port", "carry", "carrying"], ["spect", "watch", "watching"], ["intr", "enter", "entering"], ["voc", "call", "calling"], ["am", "love", "loving"], ["par", "prepare", "preparing"], ["navig", "sail", "sailing"]];
const V2 = [["vid", "see", "seeing", "e"], ["hab", "have", "having", "e"], ["tim", "fear", "fearing", "e"], ["respond", "reply", "replying", "e"], ["sed", "sit", "sitting", "e"], ["iub", "order", "ordering", "e"]];
const he = (p, v) => p === "he/she" ? (v === "have" ? "has" : v.replace(/y$/, "ie") + (/(sh|ch|s|x)$/.test(v) ? "es" : "s")).replace("hurrys", "hurries").replace("carrys", "carries") : v;
const pres = (stem, th, k) => k === 0 ? (th === "a" ? stem + "o" : stem + "eo") : stem + th + PERS[k][0].replace(/^o$/, "o");
const presMean = (v, k) => { const p = PERS[k][1]; return `${p} ${p === "he/she" ? he(p, v) : v}`; };
const allPresMeans = v => PERS.map((_, k) => presMean(v, k));
[...V1.map(v => [...v, "a"]), ...V2].forEach(([stem, v, ing, th], vi) => {
  PERS.forEach(([, p], k) => {
    const form = pres(stem, th, k), mean = presMean(v, k);
    mc("latin", `vp:${vi}:${k}`, k < 3 ? "l1" : "l2", `What does "${form}" mean?`, mean, [...allPresMeans(v), `${p} ${p === "he/she" ? "was" : p === "I" ? "was" : "were"} ${ing}`], `Ending -${PERS[k][0] === "o" ? "o" : PERS[k][0]} = ${p}. ${form} = ${mean}.`);
    const wasW = p === "I" || p === "he/she" ? "was" : "were", imp = stem + (th === "a" ? "a" : "e") + "ba" + (k === 0 ? "m" : PERS[k][0]), impMean = `${p} ${wasW} ${ing}`;
    mc("latin", `vi:${vi}:${k}`, "l6", `What does "${imp}" mean?`, impMean, [mean, ...PERS.map(([, q]) => `${q} ${q === "I" || q === "he/she" ? "was" : "were"} ${ing}`)], `-ba- marks the imperfect (was ___ing); -${k === 0 ? "m" : PERS[k][0]} = ${p}.`);
  });
  const inf = stem + (th === "a" ? "are" : "ere");
  mc("latin", `vinf:${vi}`, "l3", `What does "${inf}" mean?`, `to ${v}`, [`to ${V1[(vi + 1) % V1.length][1]}`, `${ing}`, `he/she ${he("he/she", v)}`, `they ${v}`], `-re ending = infinitive: "to ${v}".`);
  mc("latin", `vform:${vi}`, "l2", `How do you say "they ${v}" in Latin?`, pres(stem, th, 5), PERS.map((_, k) => pres(stem, th, k)), `-nt = they → ${pres(stem, th, 5)}.`);
});
const SUM = ["sum", "es", "est", "sumus", "estis", "sunt"], SUMI = ["eram", "eras", "erat", "eramus", "eratis", "erant"], POS2 = ["possum", "potes", "potest", "possumus", "potestis", "possunt"], VOL = ["volo", "vis", "vult", "volumus", "vultis", "volunt"], NOL = ["nolo", "non vis", "non vult", "nolumus", "non vultis", "nolunt"];
const IRR = [[SUM, "am/are/is", m => ["I am", "you are", "he/she is", "we are", "you all are", "they are"][m], "l1"], [POS2, "can", m => ["I can", "you can", "he/she can", "we can", "you all can", "they can"][m], "l3"],
  [VOL, "want", m => ["I want", "you want", "he/she wants", "we want", "you all want", "they want"][m], "l3"], [NOL, "don't want", m => ["I don't want", "you don't want", "he/she doesn't want", "we don't want", "you all don't want", "they don't want"][m], "l3"],
  [SUMI, "was/were", m => ["I was", "you were", "he/she was", "we were", "you all were", "they were"][m], "l6"]];
IRR.forEach(([forms, , mean, u], ti) => forms.forEach((f, m) => {
  mc("latin", `irr:${ti}:${m}`, u, `What does "${f}" mean?`, mean(m), forms.map((_, j) => mean(j)), `${forms.join(", ")} = ${forms.map((_, j) => mean(j)).join(", ")}.`);
  mc("latin", `irrb:${ti}:${m}`, u, `How do you say "${mean(m)}" in Latin?`, f, forms, `${mean(m)} = ${f}.`);
}));
// nouns: nominative, accusative, ablative (singular/plural) for 1st and 2nd declension
const N1 = [["puell", "girl"], ["vi", "road"], ["aqu", "water"], ["vill", "house (villa)"], ["tabern", "shop"], ["amic", "friend (female)"], ["femin", "woman"], ["turb", "crowd"], ["insul", "apartment block / island"], ["famili", "family"]];
const N2 = [["serv", "slave"], ["amic", "friend"], ["domin", "master"], ["cib", "food"], ["equ", "horse"], ["fili", "son"], ["popul", "people"], ["ludus", "game / school"]].map(([s, m]) => [s.replace(/us$/, ""), m]);
const C1 = { "nominative plural": "ae", "accusative singular": "am", "accusative plural": "as", "ablative plural": "is" }, C2 = { "nominative singular": "us", "accusative singular": "um", "nominative plural": "i", "accusative plural": "os", "ablative plural": "is" };
const CASES = ["nominative singular", "nominative plural", "accusative singular", "accusative plural", "ablative singular", "ablative plural"];
[[N1, C1, "1st"], [N2, C2, "2nd"]].forEach(([NS, CE, decl]) => NS.forEach(([st, mean], ni) => Object.entries(CE).forEach(([cs, end]) => {
  const form = st + end; if (/is$/.test(form) && cs === "ablative plural" && false) return;
  mc("latin", `n:${decl}:${ni}:${end}`, cs.startsWith("ablative") ? "l4" : "l2", `"${form}" (${mean}) is which case and number?`, cs, CASES, `${decl}-declension ending -${end} = ${cs}${cs === "ablative plural" ? " (used after cum, in, sine, e/ex, a/ab)" : cs.startsWith("accusative") ? " (the direct object)" : cs.startsWith("nominative") ? " (the subject)" : ""}.`);
  mc("latin", `nb:${decl}:${ni}:${end}`, cs.startsWith("ablative") ? "l4" : "l2", `What is the ${cs} of "${st + (decl === "1st" ? "a" : "us")}" (${mean})?`, form, Object.values(CE).map(e => st + e).concat([st + (decl === "1st" ? "a" : "us")]), `${decl} declension: ${Object.entries(CE).map(([c, e]) => `${c} -${e}`).join(", ")}.`);
})));
deck("latin", "prep", "l4", [["cum", "with"], ["sine", "without"], ["in (+ ablative)", "in / on"], ["in (+ accusative)", "into / onto"], ["e / ex", "out of / from"], ["a / ab", "away from"], ["ad", "to / toward (+ accusative)"], ["per", "through (+ accusative)"], ["prope", "near (+ accusative)"]],
  t => `What does the preposition "${t}" mean?`, d => `Which Latin preposition means "${d}"?`);
[["cum servis", "with the slaves"], ["in via", "in / on the road"], ["in viam", "into / onto the road"], ["e taberna", "out of the shop"], ["sine amicis", "without friends"], ["ad forum", "to the forum"], ["cum domino", "with the master"], ["in villa", "in the house"], ["ex aqua", "out of the water"], ["per vias", "through the streets"]].forEach(([l, e], i) =>
  mc("latin", `pp:${i}`, "l4", `"${l}" means…`, e, ["with the slaves", "in / on the road", "into / onto the road", "out of the shop", "without friends", "to the forum", "with the master", "in the house", "out of the water", "through the streets"], `${l} = ${e}.`));
deck("latin", "gods", "l7", [["Jupiter", "king of the gods, sky and thunder"], ["Juno", "queen of the gods, marriage"], ["Neptune", "god of the sea"], ["Mars", "god of war"], ["Venus", "goddess of love and beauty"], ["Minerva", "goddess of wisdom and crafts"],
  ["Mercury", "messenger god, travel and trade"], ["Apollo", "god of the sun, music and medicine"], ["Diana", "goddess of hunting and the moon"], ["Vulcan", "god of fire and the forge"], ["Vesta", "goddess of the hearth"], ["Ceres", "goddess of grain and harvest"], ["Pluto", "god of the underworld"], ["Bacchus", "god of wine"]],
  t => `Who is ${t}?`, d => `Which Roman god or goddess is the ${d}?`);
deck("latin", "greek", "l7", [["Jupiter", "Zeus"], ["Juno", "Hera"], ["Neptune", "Poseidon"], ["Mars", "Ares"], ["Venus", "Aphrodite"], ["Minerva", "Athena"], ["Mercury", "Hermes"], ["Diana", "Artemis"], ["Vulcan", "Hephaestus"], ["Pluto", "Hades"], ["Ceres", "Demeter"], ["Bacchus", "Dionysus"]],
  t => `${t}'s Greek name is…`, d => `${d} is called what by the Romans?`);
deck("latin", "voc", "l5", [["aqua", "water"], ["via", "road, street"], ["villa", "house, villa"], ["taberna", "shop, inn"], ["puella", "girl"], ["femina", "woman"], ["turba", "crowd"], ["servus", "slave"], ["dominus", "master"], ["amicus", "friend"], ["filius", "son"], ["filia", "daughter"],
  ["cibus", "food"], ["equus", "horse"], ["deus", "god"], ["dea", "goddess"], ["templum", "temple"], ["forum", "forum, marketplace"], ["vir", "man"], ["pecunia", "money"], ["et", "and"], ["sed", "but"], ["non", "not"], ["ubi", "where?"], ["cur", "why?"], ["quis", "who?"],
  ["hodie", "today"], ["semper", "always"], ["subito", "suddenly"], ["iterum", "again"], ["laetus", "happy"], ["iratus", "angry"], ["magnus", "big, great"], ["parvus", "small"], ["multus", "much, many"], ["bonus", "good"], ["malus", "bad"], ["clamat", "shouts"], ["videt", "sees"], ["habitat", "lives"], ["laborat", "works"], ["festinat", "hurries"]],
  t => `What does "${t}" mean?`, d => `Which Latin word means "${d}"?`);
deck("latin", "der", "l5", [["aqua", "aquarium"], ["via", "viaduct"], ["servus", "servant"], ["dominus", "dominate"], ["amicus", "amicable"], ["femina", "feminine"], ["laborat", "laboratory"], ["videt", "video"], ["magnus", "magnify"], ["parvus", "parvovirus (small virus)"], ["clamat", "exclaim"], ["habitat", "habitat"], ["deus", "deity"], ["portat", "portable"], ["spectat", "spectator"]],
  t => `Which English word comes from Latin "${t}"?`, d => `"${d}" comes from which Latin word?`);

/* ============ WORLD HISTORY ============ */
deck("history", "v1", "h1", [["Paleolithic", "Old Stone Age, hunter-gatherers"], ["Neolithic", "New Stone Age, farming begins"], ["nomad", "person who moves from place to place"], ["hunter-gatherer", "gets food by hunting animals and gathering plants"], ["domestication", "taming plants and animals for human use"],
  ["agriculture", "farming"], ["surplus", "extra food beyond what is needed"], ["specialization", "people doing different jobs"], ["artifact", "object made by people long ago"], ["archaeologist", "scientist who studies the past through artifacts"], ["Neolithic Revolution", "shift from hunting and gathering to farming"], ["Lascaux", "French cave famous for Stone Age paintings"]],
  t => `What is ${/^[aeiou]/i.test(t) ? "an" : "a"} ${t}?`, d => `Which term means: ${d}?`);
deck("history", "v2", "h2", [["civilization", "complex society with cities, government and writing"], ["Fertile Crescent", "curved strip of rich farmland in the Middle East"], ["Mesopotamia", "land between the Tigris and Euphrates rivers"], ["city-state", "a city and the land around it with its own government"],
  ["cuneiform", "Sumerian wedge-shaped writing"], ["ziggurat", "Sumerian stepped temple tower"], ["scribe", "a person trained to write"], ["irrigation", "bringing water to crops with canals"], ["silt", "rich soil left by floods"], ["Hammurabi's Code", "Babylon's written laws"],
  ["pharaoh", "Egyptian king"], ["hieroglyphics", "Egyptian picture writing"], ["papyrus", "paper made from Nile reeds"], ["mummification", "preserving bodies for the afterlife"], ["delta", "triangle of land at a river's mouth"], ["Harappa", "major Indus Valley city"],
  ["Mohenjo-daro", "Indus city with grid streets and drains"], ["Huang He", "the Yellow River in China"], ["loess", "fine yellow soil carried by the Yellow River"], ["Shang dynasty", "early Chinese dynasty known for oracle bones and bronze"], ["oracle bones", "bones used to ask ancestors questions"], ["dynasty", "a line of rulers from one family"],
  ["Mandate of Heaven", "Chinese belief that heaven chooses a just ruler"], ["theocracy", "government ruled by religious leaders"], ["polytheism", "belief in many gods"], ["monarchy", "rule by a king or queen"]],
  t => `What is ${/^[aeiou]/i.test(t) ? "an" : "a"} ${t}?`, d => `Which term means: ${d}?`);
[["ziggurats", "Mesopotamia (Sumer)"], ["cuneiform", "Mesopotamia (Sumer)"], ["Hammurabi's Code", "Mesopotamia (Sumer)"], ["pyramids", "Egypt"], ["hieroglyphics", "Egypt"], ["pharaohs", "Egypt"], ["mummies", "Egypt"], ["grid-planned cities with drains", "Indus Valley"], ["Harappa", "Indus Valley"],
 ["oracle bones", "China (Yellow River)"], ["the Mandate of Heaven", "China (Yellow River)"], ["the Shang dynasty", "China (Yellow River)"], ["the Tigris and Euphrates", "Mesopotamia (Sumer)"], ["the Nile", "Egypt"]].forEach(([x, k], i) =>
  mc("history", `civ:${i}`, "h2", `Which civilization is known for ${x}?`, k, ["Mesopotamia (Sumer)", "Egypt", "Indus Valley", "China (Yellow River)"], `${x}: ${k}.`));
deck("history", "v3", "h3", [["Geography", "land, rivers, climate (the G in GRAPES)"], ["Religion", "beliefs, gods, temples (the R)"], ["Achievements", "inventions, art, buildings (the A)"], ["Politics", "government, rulers, laws (the P)"], ["Economics", "farming, trade, money (the E)"], ["Social structure", "classes and roles in society (the S)"]],
  t => `In GRAPES, what does "${t}" cover?`, d => `Which GRAPES category covers ${d}?`);
[["The Nile flooded every year", "Geography"], ["Egyptians believed in many gods", "Religion"], ["Sumerians invented the wheel", "Achievements"], ["Hammurabi ruled Babylon", "Politics"], ["Phoenicians traded purple dye", "Economics"], ["Pharaohs and priests were at the top, enslaved people at the bottom", "Social structure"],
 ["Mesopotamia sat between two rivers", "Geography"], ["Athens let citizens vote", "Politics"], ["Farmers traded grain for tools", "Economics"], ["Judaism taught belief in one God", "Religion"], ["The Egyptians built pyramids", "Achievements"], ["Spartan society had citizens, free non-citizens and helots", "Social structure"]].forEach(([x, k], i) =>
  mc("history", `gr:${i}`, "h3", `"${x}" belongs under which GRAPES letter?`, k, ["Geography", "Religion", "Achievements", "Politics", "Economics", "Social structure"], `${k}.`));
deck("history", "v4", "h4", [["monotheism", "belief in one God"], ["Abraham", "considered the father of the Jewish people"], ["Moses", "led the Israelites out of Egypt"], ["Exodus", "the Israelites' escape from slavery in Egypt"], ["Ten Commandments", "laws Moses received on Mount Sinai"], ["Torah", "first five books of the Hebrew Bible"],
  ["covenant", "a promise or agreement (with God)"], ["Diaspora", "the scattering of Jews outside their homeland"], ["synagogue", "Jewish house of worship"], ["Phoenicians", "sea traders of the eastern Mediterranean"], ["Phoenician alphabet", "letters for sounds, ancestor of the Greek alphabet"],
  ["Tyrian purple", "costly dye made from sea snails"], ["Carthage", "famous Phoenician colony in North Africa"], ["Hesiod", "Greek poet who wrote the Theogony"], ["Theogony", "poem about the birth of the Greek gods"], ["Titans", "older gods overthrown by Zeus"], ["Kronos", "Titan king overthrown by his son Zeus"], ["Chaos", "the empty void at the start of the Greek creation story"]],
  t => `What or who is ${t}?`, d => `Which term means: ${d}?`);
deck("history", "v5", "h5", [["polis", "Greek city-state"], ["acropolis", "high hill with temples above a Greek city"], ["agora", "marketplace and meeting place"], ["democracy", "rule by the people"], ["oligarchy", "rule by a few people"], ["tyranny", "rule by one person who seized power"],
  ["aristocracy", "rule by wealthy noble families"], ["citizen", "member of a city with rights and duties"], ["phalanx", "tight formation of Greek soldiers"], ["hoplite", "heavily armed Greek foot soldier"], ["helots", "enslaved workers in Sparta"], ["Athens", "city-state known for democracy and learning"],
  ["Sparta", "city-state known for its military"], ["Parthenon", "temple to Athena on the Acropolis"], ["Olympic Games", "athletic contests honoring Zeus"], ["Homer", "poet of the Iliad and the Odyssey"], ["Minoans", "early civilization on the island of Crete"], ["Mycenaeans", "early mainland Greeks of the Trojan War stories"]],
  t => `What or who is ${t}?`, d => `Which term means: ${d}?`);
[["boys trained as soldiers from age 7", "Sparta"], ["citizens voted in an assembly", "Athens"], ["the Parthenon", "Athens"], ["helots did the farm work", "Sparta"], ["girls trained in athletics to be strong mothers", "Sparta"], ["philosophers like Socrates", "Athens"], ["two kings and a council of elders", "Sparta"], ["a strong navy and sea trade", "Athens"]].forEach(([x, k], i) =>
  mc("history", `as:${i}`, "h5", `Athens or Sparta: ${x}?`, k, ["Athens", "Sparta", "Both", "Neither"], `${k}.`));
deck("history", "ggods", "h5", [["Zeus", "king of the gods, sky and thunder"], ["Hera", "queen of the gods, marriage"], ["Poseidon", "god of the sea"], ["Athena", "goddess of wisdom, protector of Athens"], ["Apollo", "god of the sun, music and prophecy"], ["Artemis", "goddess of the hunt"],
  ["Ares", "god of war"], ["Aphrodite", "goddess of love"], ["Hermes", "messenger of the gods"], ["Hades", "god of the underworld"], ["Demeter", "goddess of the harvest"], ["Hephaestus", "god of fire and blacksmiths"]],
  t => `Who is ${t}?`, d => `Which Greek god is the ${d}?`);
})();
