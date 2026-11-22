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

window.JCHECK = { load, check, countWords, verdict };
