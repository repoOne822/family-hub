// Journal checker (Bobby 2026-11-21): counts real words (no padding) and finds spelling + basic grammar mistakes.
// Runs on the device; the journal text is never sent anywhere. Dictionary: Hunspell en_US (dictionary-en, MIT/BSD).
import nspell from "nspell";

let SP = null, loading = null;
const BASE = new URL("./dict/", import.meta.url || document.currentScript?.src || location.href);

// Words the dictionary doesn't know but the boys use a lot. Lowercase.
const ALLOW = `eric ellis jonah qiu yang lin bobby shan mom mommy dad daddy grandma grandpa nainai yeye laolao laoye ayi
basis quarry lane dublin alamo danville tri-valley bay area sf
amc mathcounts pre-algebra algebra geometry physics covert stem robotics python scratch lego legos mars rover
fencing fencer fencers foil epee épée sabre saber riposte parry lunge piste askfred usfa usa nac rjcc roc rcc sjcc mfa
minecraft roblox fortnite pokemon pokémon nintendo switch xbox playstation ps5 youtube youtuber tiktok ipad iphone chromebook wifi app apps
ok okay lol omg emoji emojis selfie online offline homework classmate classmates teammate teammates gameplay
weekday weekdays weekend weekends today's tomorrow's yesterday's boba ramen sushi dumpling dumplings mochi
`.split(/\s+/).filter(Boolean);
const ALLOWSET = new Set(ALLOW);

async function load() {
  if (SP) return SP;
  if (!loading) loading = Promise.all([fetch(new URL("en.aff", BASE)).then(r => r.text()), fetch(new URL("en.dic", BASE)).then(r => r.text())])
    .then(([aff, dic]) => { SP = nspell(aff, dic); ALLOW.forEach(w => SP.add(w)); return SP; });
  return loading;
}

const CJK = /[㐀-鿿豈-﫿]/g;
const WORD = /[A-Za-zÀ-ɏ]+(?:['’][A-Za-z]+)*/g;

// Sentences with their offsets.
function sentences(text) {
  const out = []; const re = /[^.!?\n]+(?:[.!?]+["')\]]*|\n|$)/g; let m;
  while ((m = re.exec(text))) { if (!m[0].trim()) { if (m[0] === "") re.lastIndex++; continue; } out.push({ s: m.index, t: m[0] }); if (m.index === re.lastIndex) re.lastIndex++; }
  return out;
}

// Real word count: duplicate sentences count once, and the same word 3+ times in a row counts once.
function countWords(text) {
  const t = String(text || ""); const cjk = (t.match(CJK) || []).length;
  const seen = new Set(); let n = 0;
  for (const s of sentences(t.replace(CJK, " "))) {
    const ws = (s.t.match(/[A-Za-z0-9À-ɏ]+(?:['’-][A-Za-z0-9]+)*/g) || []).map(w => w.toLowerCase());
    if (!ws.length) continue;
    const key = ws.join(" ");
    if (ws.length >= 4 && seen.has(key)) continue; seen.add(key);
    let prev = "", run = 0;
    for (const w of ws) { run = w === prev ? run + 1 : 1; prev = w; if (run <= 2) n++; }
  }
  return cjk + n;
}

const CONTRACT = { dont: "don't", didnt: "didn't", doesnt: "doesn't", isnt: "isn't", wasnt: "wasn't", werent: "weren't", couldnt: "couldn't", shouldnt: "shouldn't", wouldnt: "wouldn't", havent: "haven't", hasnt: "hasn't", arent: "aren't", im: "I'm", ive: "I've", thats: "that's", theyre: "they're", youre: "you're", whats: "what's", lets: null, cant: "can't", wont: "won't" };
const MSG = {
  spell: w => `Spelling: "${w}"`,
  cap: () => "Start the sentence with a capital letter",
  i: () => `Write "I" as a capital letter`,
  dup: w => `Repeated word: "${w} ${w}"`,
  apos: (w, f) => `Missing apostrophe: "${w}" → "${f}"`,
  alot: () => `"alot" is two words: "a lot"`,
  of: w => `"${w} of" should be "${w} have"`,
  end: () => "End the sentence with . ! or ?",
  runon: () => "This sentence is too long. Split it into shorter sentences",
  an: (w) => `Use "an" before "${w}"`,
};

async function check(text) {
  const sp = await load(); const t = String(text || ""), issues = [];
  const add = (start, end, kind, msg, fix) => issues.push({ start, end, kind, msg, fix });
  const sents = sentences(t);
  for (let si = 0; si < sents.length; si++) {
    const { s, t: st } = sents[si];
    // first letter of the sentence should be capital
    const fm = st.match(/[A-Za-z]/); if (fm) { const p = s + st.indexOf(fm[0]); if (/[a-z]/.test(fm[0]) && !/^\s*(?:[a-z]+:\/\/|www\.)/.test(st)) add(p, p + 1, "cap", MSG.cap(), fm[0].toUpperCase()); }
    const ws = []; let m; WORD.lastIndex = 0; const local = st;
    while ((m = WORD.exec(local))) ws.push({ w: m[0], s: s + m.index });
    if (ws.length > 45 && !/[,;:]/.test(st)) add(s, s + st.length, "runon", MSG.runon());
    // ending punctuation (only for a sentence that ends a line/paragraph or the text)
    const tail = st.replace(/\s+$/, "");
    if (ws.length >= 4 && !/[.!?]["')\]]*$/.test(tail) && !/[:,;]$/.test(tail)) add(s + tail.length - 1, s + tail.length, "end", MSG.end(), tail.slice(-1) + ".");
    for (let i = 0; i < ws.length; i++) {
      const { w, s: p } = ws[i], lw = w.toLowerCase().replace(/’/g, "'"), base = lw.replace(/'s$/, "");
      if (/^i('m|'ve|'ll|'d)?$/.test(w)) { add(p, p + w.length, "i", MSG.i(), "I" + w.slice(1)); continue; }
      if (i > 0 && lw === ws[i - 1].w.toLowerCase() && !["had", "that"].includes(lw)) { add(p, p + w.length, "dup", MSG.dup(w)); continue; }
      if (lw === "alot") { add(p, p + w.length, "alot", MSG.alot(), "a lot"); continue; }
      if (CONTRACT[lw] !== undefined && CONTRACT[lw] && !["cant", "wont"].includes(lw)) { add(p, p + w.length, "apos", MSG.apos(w, CONTRACT[lw]), CONTRACT[lw]); continue; }
      if (lw === "of" && i > 0 && /^(could|should|would|must|might)$/i.test(ws[i - 1].w)) { add(ws[i - 1].s, p + 2, "of", MSG.of(ws[i - 1].w), ws[i - 1].w + " have"); continue; }
      if (lw === "a" && i + 1 < ws.length) { const nx = ws[i + 1].w.toLowerCase(); if (/^[aeio]/.test(nx) && !/^(one|once|eu|ur)/.test(nx) && /^a\s+\S/i.test(t.slice(p, p + 2 + nx.length))) add(p, p + 1, "an", MSG.an(ws[i + 1].w), "an"); }
      // spelling
      if (w.length < 2 || ALLOWSET.has(lw) || ALLOWSET.has(base)) continue;
      if (/^[A-Z]{2,}$/.test(w)) continue;                       // acronyms
      if (/^[A-Z]/.test(w) && i > 0) continue;                   // names in the middle of a sentence
      if (sp.correct(w) || sp.correct(lw) || sp.correct(base) || sp.correct(w.replace(/’/g, "'"))) continue;
      add(p, p + w.length, "spell", MSG.spell(w), null);
    }
  }
  issues.sort((a, b) => a.start - b.start || (a.kind === "cap") - (b.kind === "cap"));
  for (let i = issues.length - 1; i > 0; i--) if (issues[i].start === issues[i - 1].start) issues.splice(i, 1);  // one mistake per spot
  let n = 0; for (const x of issues) if (x.kind === "spell" && n < 40) { n++; try { x.fix = (sp.suggest(x.msg.match(/"(.+)"/)[1]) || [])[0] || null; } catch (e) {} }
  const words = countWords(t);
  return { words, mistakes: issues.length, issues };
}

// The rule: at least `min` real words, and fewer than one mistake per `per` words (e.g. 350 words → 6 allowed, 7 locks).
function verdict(r, min = 350, per = 50) {
  const lockAt = Math.max(1, Math.floor(Math.max(r.words, min) / per));
  return { longEnough: r.words >= min, allowed: lockAt - 1, lockAt, tooMany: r.mistakes >= lockAt, pass: r.words >= min && r.mistakes < lockAt };
}


// ---- ✅ Corrected version: his text with each fixable mistake shown as wrong → fix (he still makes the edits himself) ----
function corrected(text, issues) {
  const segs = []; let pos = 0;
  for (const x of issues) {
    if (x.start < pos) continue;
    let fix = x.fix;
    if (x.kind === "dup") fix = "";                         // drop the repeated word
    if (fix == null && x.kind !== "end") continue;          // runon / unknown spelling: no automatic fix
    let start = x.start, end = x.end;
    if (x.kind === "cap") { const m = text.slice(x.start).match(/^[A-Za-z']+/); if (m) { end = x.start + m[0].length; fix = m[0][0].toUpperCase() + m[0].slice(1); } }
    if (x.kind === "end") { if (x.end > pos) segs.push({ t: text.slice(pos, x.end) }); segs.push({ wrong: "", fix: "." }); pos = x.end; continue; }
    if (x.kind === "dup") { while (start > pos && /\s/.test(text[start - 1])) start--; }
    if (start > pos) segs.push({ t: text.slice(pos, start) });
    segs.push({ wrong: text.slice(start, end), fix, unsure: x.kind === "spell" });
    pos = end;
  }
  if (pos < text.length) segs.push({ t: text.slice(pos) });
  return segs;
}

// ---- ✍️ Writing coach: 5 traits (6+1 traits model), tuned by age; tips quote his own words ----
const WEAK = { good: "great, helpful, exciting, tasty, kind", bad: "awful, frustrating, disappointing, tough", fun: "exciting, thrilling, enjoyable, hilarious",
  nice: "friendly, pleasant, thoughtful, beautiful", very: "(cut it, or use a stronger word: very tired → exhausted)", really: "(cut it, or use a stronger word: really happy → thrilled)",
  thing: "(name the actual thing)", things: "(name the actual things)", stuff: "(name what it was)", got: "received, earned, became, bought", cool: "amazing, clever, impressive",
  awesome: "incredible, outstanding, epic", lot: "many, plenty of, tons of", big: "huge, enormous, giant", happy: "proud, thrilled, relieved, cheerful", sad: "disappointed, upset, gloomy", went: "rushed, walked, drove, headed" };
const TRANS = /\b(first|firstly|then|next|after that|afterwards|later|finally|in the end|meanwhile|because|however|but|so|also|although|when|while|before|after|since|suddenly|at first|eventually|luckily|unfortunately|for example|instead)\b/gi;
const FEEL = /\b(happy|sad|proud|nervous|excited|worried|angry|mad|scared|calm|frustrated|annoyed|relieved|bored|tired|disappointed|surprised|confident|embarrassed|grateful|thankful|upset|glad|lonely|jealous|curious|felt|feel|feeling)\b/gi;
const REFLECT = /\b(learned|learnt|realized|realised|next time|i will|i'll|i should|i want to|i hope|my goal|tomorrow i|because|i think|i wonder|lesson)\b/gi;
const SENSE = /\b(saw|see|heard|hear|smelled|smell|tasted|taste|touched|loud|quiet|bright|dark|cold|hot|warm|soft|hard|sweet|sour|bitter|crunchy|shiny|noisy)\b/gi;
const STOP = new Set("the a an and or but so to of in on at for with it is was were be been am are i me my we our you your he she they them his her their this that there then than as if not no do did does have has had will would can could just from by up out about into over after before when what who which how all some one two very really".split(" "));

function coach(text, issues, age) {
  const t = String(text || ""); age = +age || 10;
  const sents = sentences(t).map(s => s.t.trim()).filter(x => /[A-Za-z]/.test(x));
  const words = (t.match(/[A-Za-z']+/g) || []).map(w => w.toLowerCase());
  const nW = words.length || 1, nS = sents.length || 1, avg = nW / nS;
  const paras = t.split(/\n\s*\n|\n/).map(p => p.trim()).filter(p => (p.match(/[A-Za-z]+/g) || []).length >= 8);
  const target = age >= 11 ? { lo: 11, hi: 20, paras: 3 } : { lo: 9, hi: 17, paras: 3 };
  const cnt = re => (t.match(re) || []).length;
  const traits = [];
  // Ideas & details
  { const feel = cnt(FEEL), refl = cnt(REFLECT), sense = cnt(SENSE), nums = cnt(/\b\d+\b/g), tips = [];
    let st = 1 + (feel > 0) + (refl > 0) + ((sense + nums) >= 2);
    const sk = {}; sents.forEach(x => { const k = x.toLowerCase().replace(/[^a-z ]/g, "").trim(); if (k.split(" ").length >= 4) sk[k] = (sk[k] || 0) + 1; });
    const dupN = Object.values(sk).filter(n => n > 1).reduce((a, n) => a + n - 1, 0);
    if (dupN) { st = Math.max(1, st - 1); tips.unshift(`You repeated the same sentence ${dupN} time${dupN > 1 ? "s" : ""}. Repeats don't count toward your words, and every sentence should tell something new.`); }
    if (!feel) tips.push("Tell how you felt and why. Example: \"I felt nervous before my bout because my coach was watching.\"");
    if (!refl) tips.push("End with what you learned or what you'll do next time. Example: \"Next time, I'll start my homework right after school.\"");
    if (sense + nums < 2) tips.push("Add details someone can picture: a number, a name, a sound, a color. \"We won 15–12\" beats \"we won.\"");
    traits.push({ key: "ideas", name: "Ideas & details", stars: Math.min(4, st), tips }); }
  // Organization
  { const tr = cnt(TRANS), tips = []; let st = 1;
    if (paras.length >= target.paras) st++; else tips.push(`Split your journal into ${target.paras} paragraphs: 1) what happened, 2) the most important part with details, 3) how you feel and what you learned. Press Enter twice between them.`);
    if (tr >= Math.max(3, Math.round(nS / 4))) st++; else tips.push("Use linking words so the story flows: First, Then, After that, Because, However, Finally.");
    const open = (sents[0] || "").toLowerCase();
    if (/^(today|yesterday|this morning|tonight)\s+(i|we)\b/.test(open)) tips.push(`Try a stronger first sentence than "${(sents[0] || "").split(/\s+/).slice(0, 4).join(" ")}…". Start with the most surprising moment, a question, or what someone said.`); else st++;
    traits.push({ key: "org", name: "Organization", stars: Math.min(4, st), tips }); }
  // Word choice
  { const tips = [], freq = {}; words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
    const weak = Object.keys(WEAK).filter(w => (freq[w] || 0) >= 3).sort((a, b) => freq[b] - freq[a]);
    weak.slice(0, 3).forEach(w => tips.push(`You used "${w}" ${freq[w]} times. Try: ${WEAK[w]}.`));
    const rep = Object.keys(freq).filter(w => w.length > 3 && !STOP.has(w) && !WEAK[w] && freq[w] >= Math.max(5, nW / 40)).sort((a, b) => freq[b] - freq[a]).slice(0, 2);
    rep.forEach(w => tips.push(`"${w}" appears ${freq[w]} times. Use a different word or a pronoun for some of them.`));
    const st = Math.max(1, 4 - weak.length - (rep.length ? 1 : 0));
    traits.push({ key: "words", name: "Word choice", stars: st, tips }); }
  // Sentence fluency
  { const tips = []; let st = 4;
    if (avg < target.lo) { st--; tips.push(`Your sentences are short (about ${Math.round(avg)} words each). Join some with because, when, but, or so. "I was tired. I kept going." → "I was tired, but I kept going."`); }
    if (avg > target.hi) { st--; tips.push(`Your sentences are long (about ${Math.round(avg)} words each). Split them so each sentence has one main idea.`); }
    const starts = sents.map(s => (s.match(/[A-Za-z']+/) || [""])[0].toLowerCase());
    const top = Object.entries(starts.reduce((m, w) => (m[w] = (m[w] || 0) + 1, m), {})).sort((a, b) => b[1] - a[1])[0];
    if (top && nS >= 6 && top[1] / nS > 0.35) { st--; tips.push(`${top[1]} of your ${nS} sentences start with "${top[0].replace(/^i$/, "I")}". Start some with a time ("After dinner,"), a feeling ("Proudly,"), or an action ("Racing down the hall,").`); }
    let run = 1; for (let i = 1; i < starts.length; i++) { run = starts[i] === starts[i - 1] ? run + 1 : 1; if (run === 3) { st--; const w = starts[i].replace(/^i$/, "I"); tips.push(`3 sentences in a row start with "${w[0].toUpperCase() + w.slice(1)}". Change one: "${w === "then" ? "After that," : "Later,"}" or join two of them with "and".`); break; } }
    traits.push({ key: "flow", name: "Sentence flow", stars: Math.max(1, st), tips }); }
  // Conventions
  { const per100 = (issues.length / Math.max(nW, 1)) * 100, tips = [];
    const st = per100 < 0.5 ? 4 : per100 < 1.5 ? 3 : per100 < 3 ? 2 : 1;
    const kinds = issues.reduce((m, x) => (m[x.kind] = (m[x.kind] || 0) + 1, m), {});
    if (kinds.spell) tips.push(`${kinds.spell} spelling mistake${kinds.spell > 1 ? "s" : ""}. Say the word slowly and spell each sound; check the corrected version below.`);
    if (kinds.i || kinds.cap) tips.push("Capitals: every sentence starts with one, and \"I\" is always a capital.");
    if (kinds.apos) tips.push("Apostrophes in short forms: don't, didn't, I'm, that's (the apostrophe replaces the missing letter).");
    if (kinds.end) tips.push("Finish every sentence with . ! or ?");
    if (kinds.runon) tips.push("A very long sentence with no commas is hard to read. Split it into two or three.");
    traits.push({ key: "conv", name: "Spelling & grammar", stars: st, tips }); }
  const total = traits.reduce((a, x) => a + x.stars, 0);
  const next = traits.filter(x => x.tips.length).sort((a, b) => a.stars - b.stars)[0];
  return { traits, total, max: traits.length * 4, focus: next ? next.tips[0] : null, stats: { words: nW, sentences: nS, avg: Math.round(avg * 10) / 10, paragraphs: paras.length } };
}

window.JCHECK = { load, check, countWords, verdict, corrected, coach };
