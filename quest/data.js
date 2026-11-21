// Realm of Forces: world data (acts, monsters, classes, loot tables). All names and art are original.
window.QDATA = {
 classes: {
  vanguard: { name: "Vanguard", zh: "铁卫", icon: "🛡️", weapon: "⚔️", blurb: "Tough armored fighter. Most health and armor.", hp: 70, dmg: 9, arm: 10, crit: 5,
   skill: { name: "Shield Slam", icon: "💥", mult: 2.0, cost: 15, desc: "Big hit that stuns: the enemy skips its next attack." } },
  ranger: { name: "Ranger", zh: "游侠", icon: "🏹", weapon: "🏹", blurb: "Quick and precise. Highest critical-hit chance.", hp: 58, dmg: 10, arm: 5, crit: 15,
   skill: { name: "Piercing Volley", icon: "🎯", mult: 2.6, cost: 15, desc: "A volley of arrows: the biggest single hit." } },
  arcanist: { name: "Arcanist", zh: "奥术师", icon: "🔮", weapon: "🪄", blurb: "Master of energy. More mana; spells heal you.", hp: 54, dmg: 11, arm: 3, crit: 8, mp: 15,
   skill: { name: "Arc Lightning", icon: "⚡", mult: 2.2, cost: 12, desc: "Lightning strike that heals you for 25% of the damage." } }
 },
 acts: [
  { id: "a1", n: 1, name: "The Proving Grounds", zh: "试炼之地", subject: "Physics", lessons: ["inquiry", "measure"], gens: ["conv"], bg: "#1f2a1c",
    blurb: "Scientific inquiry and measurement. Units 2–3.",
    mobs: [["🐀", "Scale Rat"], ["🦇", "Hypothesis Bat"], ["🕷️", "Ruler Spider"], ["🐌", "Slime of Guesswork"]], elite: [["🐗", "Tusked Variable"]], boss: ["🗿", "The Unmeasured Golem", "It has no units. Give it some!"] },
  { id: "a2", n: 2, name: "Velocity Wastes", zh: "速度荒原", subject: "Physics", lessons: ["kinematics"], gens: ["speed", "dist", "time", "accel", "avgspeed"], bg: "#3a2a14",
    blurb: "Motion: speed, velocity, acceleration. Unit 4.",
    mobs: [["🦂", "Dune Scorpion"], ["🐍", "Swift Viper"], ["🦅", "Gale Hawk"], ["🐺", "Sprint Wolf"]], elite: [["🐆", "Displacement Stalker"]], boss: ["🐉", "Accelerax, the Dune Wyrm", "It speeds up every second."] },
  { id: "a3", n: 3, name: "Citadel of Forces", zh: "力之堡垒", subject: "Physics", lessons: ["forces"], gens: ["weight", "netforce", "fma"], bg: "#25222e",
    blurb: "Forces and Newton's three laws. Unit 5.",
    mobs: [["💀", "Skeleton Sentry"], ["🗡️", "Iron Husk"], ["🧌", "Friction Troll"], ["👻", "Inertia Wraith"]], elite: [["🦍", "Net-Force Brute"]], boss: ["👑", "The Unmoved King", "An object at rest stays at rest… unless YOU act."] },
  { id: "a4", n: 4, name: "Furnace of Energy", zh: "能量熔炉", subject: "Physics", lessons: ["energy"], gens: ["work", "ke", "pe"], bg: "#3a1610",
    blurb: "Work, kinetic and potential energy. Unit 8 (after PreComp).",
    mobs: [["🔥", "Ember Imp"], ["🪨", "Magma Brute"], ["⚙️", "Clockwork Drone"], ["🦎", "Salamander"]], elite: [["🐂", "Momentum Bull"]], boss: ["😈", "The Joule-Eater", "It hoards energy. Make it pay back every joule."] },
  { id: "a5", n: 5, name: "Tide Caverns", zh: "潮汐洞窟", subject: "Physics", lessons: ["waves"], gens: ["wave", "period"], bg: "#10263a",
    blurb: "Waves and oscillations. Unit 9.",
    mobs: [["🦀", "Echo Crab"], ["🐙", "Abyss Squid"], ["🪼", "Pulse Jelly"], ["🦈", "Ripple Shark"]], elite: [["🐳", "Amplitude Whale"]], boss: ["🌊", "Leviathan of Frequencies", "It hums at every frequency at once."] }
 ],
 sealed: [],
 slots: { weapon: "Weapon", helm: "Helm", armor: "Armor", boots: "Boots", amulet: "Amulet", ring: "Ring" },
 slotIcon: { helm: "⛑️", armor: "🧥", boots: "🥾", amulet: "📿", ring: "💍" },
 bases: {
  weapon: { vanguard: ["Short Sword", "Broadsword", "War Blade", "Runed Greatsword"], ranger: ["Hunting Bow", "Longbow", "Composite Bow", "Stormstring Bow"], arcanist: ["Oak Wand", "Crystal Rod", "Storm Staff", "Starforged Staff"] },
  helm: ["Leather Cap", "Iron Helm", "Visored Helm", "Crowned Helm"], armor: ["Padded Vest", "Chain Shirt", "Scale Mail", "Gilded Plate"],
  boots: ["Soft Boots", "Iron Boots", "Ranger Treads", "Windstep Boots"], amulet: ["Bone Charm", "Silver Pendant", "Jade Amulet", "Star Amulet"], ring: ["Copper Ring", "Silver Band", "Gold Ring", "Opal Signet"]
 },
 prefixes: { dmg: "Sharp", arm: "Sturdy", hp: "Vital", crit: "Keen", gold: "Lucky", xp: "Wise", swift: "Swift", mp: "Arcane" },
 suffixes: { dmg: "of Force", arm: "of the Wall", hp: "of the Bear", crit: "of Precision", gold: "of Fortune", xp: "of Learning", swift: "of Velocity", mp: "of Energy" },
 rareA: ["Storm", "Grim", "Iron", "Bright", "Dusk", "Ember", "Frost", "Tide", "Thunder", "Ashen"], rareB: ["Grip", "Ward", "Fang", "Shroud", "Spark", "Crest", "Bane", "Song", "Mark", "Coil"],
 legendary: {
  weapon: { name: "Newton's Reckoning", flavor: "For every strike, an equal and opposite regret.", stats: ["dmg", "crit", "dmg"] },
  helm: { name: "Galileo's Gaze", flavor: "It sees the moons others miss.", stats: ["swift", "xp", "hp"] },
  armor: { name: "Faraday's Cage", flavor: "Nothing gets in. Nothing.", stats: ["arm", "hp", "arm"] },
  boots: { name: "Doppler Striders", flavor: "You sound different coming and going.", stats: ["swift", "gold", "arm"] },
  amulet: { name: "Curie's Glow", flavor: "A faint, brave light.", stats: ["mp", "dmg", "crit"] },
  ring: { name: "Hertz Loop", flavor: "It hums at exactly one beat per second.", stats: ["crit", "swift", "dmg"] }
 },
 rarity: [["Common", "#e6dfcf"], ["Magic", "#7b9bff"], ["Rare", "#ffd84a"], ["Legendary", "#ff8a1e"]],
 statName: { dmg: "Damage", arm: "Armor", hp: "Health", crit: "% Crit", gold: "% Gold", xp: "% XP", swift: "s Swift window", mp: "Mana" }
};
