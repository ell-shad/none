// A curated list of common English words of lengths 3-8 to keep the game fun and responsive.
const COMMON_WORDS = [
  // 3 letters
  "the", "and", "for", "are", "but", "not", "you", "all", "any", "can", "had", "her", "was", "one", "our", "out", "day", "get", "has", "him", "his", "how", "man", "new", "now", "old", "see", "two", "way", "who", "boy", "cat", "dog", "eat", "run", "say", "sit", "map", "pen", "car", "fly", "hot", "ice", "key", "sky", "tea", "win", "yes", "act", "add", "age", "aim", "air", "art", "bag", "bar", "bed", "big", "box", "bus", "cap", "cop", "cow", "cry", "cup", "cut", "dry", "due", "ear", "egg", "end", "era", "eye", "fan", "far", "fat", "few", "fit", "fix", "fox", "fun", "gas", "gem", "god", "gum", "hat", "hey", "hit", "ill", "ink", "job", "joy", "kid", "lab", "law", "lay", "leg", "let", "lid", "lip", "log", "low", "mad", "mix", "mud", "net", "nod", "nut", "odd", "oil", "own", "pad", "pan", "pay", "pet", "pig", "pin", "pot", "rag", "rat", "raw", "red", "rib", "row", "sad", "sea", "set", "sew", "son", "sun", "tap", "tax", "ten", "the", "tie", "tin", "tip", "toe", "ton", "top", "toy", "try", "tub", "use", "van", "war", "wet", "who", "why", "wet", "row", "mix", "zip",

  // 4 letters
  "that", "with", "this", "they", "from", "have", "word", "some", "what", "more", "when", "your", "them", "time", "been", "each", "were", "hows", "said", "each", "make", "many", "then", "them", "into", "look", "more", "work", "life", "back", "part", "real", "over", "only", "year", "good", "know", "take", "came", "come", "show", "give", "much", "body", "food", "keep", "home", "side", "cold", "wind", "ship", "land", "line", "east", "west", "city", "tree", "hard", "soft", "blue", "reds", "four", "five", "nine", "zero", "once", "slow", "fast", "dark", "light", "gold", "iron", "rock", "sand", "wave", "fish", "bird", "lion", "bear", "frog", "worm", "leaf", "root", "seed", "grow", "fall", "rain", "snow", "fire", "heat", "cool", "warm", "star", "moon", "hope", "love", "hate", "fear", "bold", "kind", "mind", "soul", "face", "head", "hand", "foot", "hair", "eyes", "nose", "eary", "mouth", "song", "play", "game", "ball", "door", "wall", "gate", "path", "road", "cart", "boat", "coin", "card", "book", "page", "read", "note", "talk", "tell", "hear", "sing", "jump", "walk", "step", "move", "find", "lose", "hold", "draw", "wear", "wash", "open", "shut", "stop", "join", "turn", "sent", "save", "free", "rich", "poor", "safe", "wild", "easy", "busy", "glad", "lazy", "neat", "tidy", "pure", "fine", "nice", "cute", "cool", "loud", "calm", "flat", "thin", "wide", "deep", "tall", "high", "long", "best", "last", "next", "past", "late", "soon", "here", "there", "then", "thus", "ever", "never", "away", "well", "even", "also", "only", "both", "such", "same", "like", "just", "near", "upon", "down", "over", "into", "send", "went", "grew", "blew", "flew", "drew", "knew", "seen", "done", "make", "made", "take", "took", "give", "gave", "keep", "kept", "feel", "felt", "find", "found", "lose", "lost", "meet", "met", "hear", "heard", "seek", "sought", "tell", "told", "sell", "sold", "pay", "paid", "buy", "bought", "rise", "rose", "fall", "fell", "sing", "sang", "ring", "rang", "blow", "blew", "grow", "grew", "show", "shew", "draw", "drew", "fly", "flew", "ride", "rode", "hide", "hid", "bite", "bit", "wear", "wore", "tear", "tore", "bear", "bore", "know", "knew", "think", "thought", "see", "saw", "say", "said",

  // 5 letters
  "about", "other", "their", "there", "which", "would", "write", "could", "these", "water", "first", "place", "where", "after", "round", "every", "under", "great", "think", "house", "world", "point", "right", "might", "small", "large", "sound", "still", "along", "shall", "found", "night", "court", "force", "light", "white", "black", "green", "happy", "angry", "sweet", "short", "smart", "quick", "quiet", "clean", "dirty", "heavy", "light", "broad", "stone", "paper", "glass", "metal", "earth", "river", "ocean", "grass", "plant", "fruit", "bread", "drink", "table", "chair", "board", "clock", "watch", "money", "paper", "sheet", "music", "dance", "voice", "speak", "laugh", "smile", "dream", "sleep", "heart", "brain", "blood", "mouth", "teeth", "train", "plane", "truck", "wheel", "motor", "space", "field", "force", "power", "front", "scale", "shape", "style", "theme", "block", "match", "score", "level", "point", "board", "brick", "frame", "lever", "press", "print", "paper", "inked", "ribon", "keysy", "metal", "steel", "brass", "woody", "clear", "lines", "words", "bonus", "speed", "pause", "start", "sound", "clack", "space", "shift", "capsy", "enter", "click", "mouse", "touch", "phone", "audio", "music", "retro", "classic", "style",

  // 6 letters
  "people", "before", "around", "during", "button", "screen", "typing", "ribbon", "letter", "matrix", "column", "scores", "levels", "points", "delete", "remove", "system", "player", "gamers", "record", "header", "footer", "border", "canvas", "visual", "active", "paused", "sounds", "clicks", "clacks", "status", "layout", "blocks", "pieces", "shapes", "colors", "whites", "blacks", "matrix", "source", "engine", "update", "render", "config", "effect", "action", "object", "number", "string", "symbol", "syntax", "editor", "simple", "modern", "design", "unique", "retroy", "cleared", "rowing", "column", "triple", "double", "single", "master", "expert", "helper", "solver", "scorer", "timing", "motion", "smooth", "spring", "bounce", "shadow", "stroke", "weight", "height", "widths", "length", "format", "cursor", "typing", "writer", "plates", "wheels", "roller", "return", "scroll", "papers", "margin", "custom",

  // 7 letters
  "through", "between", "another", "typewriter", "letters", "columns", "scoring", "leveling", "cleared", "history", "records", "minimal", "classic", "machine", "buttons", "layouts", "configs", "renders", "engines", "effects", "actions", "objects", "numbers", "strings", "symbols", "editors", "simpler", "designs", "uniques", "masters", "experts", "helpers", "solvers", "scorers", "timings", "motions", "smooths", "springs", "bounces", "shadows", "strokes", "weights", "heights", "lengths", "formats", "cursors", "typings", "writers", "rollers", "returns", "scrolls", "margins", "customs"
];

// Combine into a Set for O(1) lookups
const wordSet = new Set(COMMON_WORDS.map(w => w.toLowerCase()));

// Fast prefix check to help search for valid words in progress
const prefixSet = new Set<string>();
for (const word of COMMON_WORDS) {
  for (let i = 1; i < word.length; i++) {
    prefixSet.add(word.substring(0, i).toLowerCase());
  }
}

/**
 * Checks if a string is a valid word in our curated list.
 * Supports strings of length 3 to 12.
 */
export function isValidWord(word: string): boolean {
  const normalized = word.toLowerCase();
  if (normalized.length < 3) return false;
  return wordSet.has(normalized);
}

/**
 * Checks if a string is a valid prefix of any word in our list.
 */
export function isValidPrefix(prefix: string): boolean {
  const normalized = prefix.toLowerCase();
  return prefixSet.has(normalized) || wordSet.has(normalized);
}

/**
 * Custom dictionary expansion helper
 */
export function addCustomWord(word: string): void {
  const normalized = word.trim().toLowerCase();
  if (normalized.length >= 3) {
    wordSet.add(normalized);
    for (let i = 1; i < normalized.length; i++) {
      prefixSet.add(normalized.substring(0, i));
    }
  }
}

/**
 * Shuffles an array helper.
 */
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Gets a random selection of unique words of a given length.
 * Falls back to other lengths if not enough words are found.
 */
export function getRandomWordsOfLength(length: number, count: number): string[] {
  let matched = COMMON_WORDS.filter(w => w.length === length);
  if (matched.length < count) {
    matched = COMMON_WORDS.filter(w => Math.abs(w.length - length) <= 1);
  }
  if (matched.length < count) {
    matched = COMMON_WORDS;
  }
  
  const shuffled = shuffle(matched);
  const uniqueWords: string[] = [];
  const seen = new Set<string>();
  for (const w of shuffled) {
    const upper = w.toUpperCase();
    if (!seen.has(upper)) {
      seen.add(upper);
      uniqueWords.push(upper);
      if (uniqueWords.length === count) break;
    }
  }
  
  return uniqueWords;
}

/**
 * Generates a completely randomized target set of words for 10 levels.
 */
export function getRandomTargetWordsForLevels(): string[][] {
  return [
    getRandomWordsOfLength(3, 3), // Level 1
    getRandomWordsOfLength(4, 4), // Level 2
    getRandomWordsOfLength(5, 4), // Level 3
    getRandomWordsOfLength(6, 4), // Level 4
    getRandomWordsOfLength(7, 5), // Level 5
    getRandomWordsOfLength(5, 5), // Level 6
    getRandomWordsOfLength(6, 5), // Level 7
    getRandomWordsOfLength(7, 5), // Level 8
    getRandomWordsOfLength(6, 5), // Level 9
    getRandomWordsOfLength(7, 5), // Level 10
  ];
}

