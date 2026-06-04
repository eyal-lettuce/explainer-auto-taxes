/**
 * scripts/transcribe.mjs
 *
 * Transcribes host videos via Whisper (word-level timestamps), chunks words
 * into short caption phrases, and saves results to src/captions/captions.json.
 *
 * Backends (auto-selected, or force with --backend):
 *   local   — mlx-whisper (no API key, runs on Apple Silicon)
 *   openai  — OpenAI Whisper API (requires OPENAI_API_KEY)
 *
 * Usage:
 *   node scripts/transcribe.mjs                        # all videos, auto backend
 *   node scripts/transcribe.mjs scene1.mp4             # single video
 *   node scripts/transcribe.mjs --backend openai       # force OpenAI
 *   OPENAI_API_KEY=sk-... node scripts/transcribe.mjs  # OpenAI with key
 */

import fs from "fs";
import path from "path";
import readline from "readline";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const OUT_FILE = path.join(ROOT, "src", "captions", "captions.json");

const ALL_VIDEOS = fs.readdirSync(PUBLIC_DIR).filter((f) => f.endsWith(".mp4")).sort();

const backendArg = process.argv.find((a) => a === "--backend");
const backendVal = backendArg ? process.argv[process.argv.indexOf("--backend") + 1] : null;
const targetVideo = process.argv.find((a) => a.endsWith(".mp4"));
const videos = targetVideo ? [targetVideo] : ALL_VIDEOS;

function detectBackend() {
  if (backendVal) return backendVal;
  try { execSync("which mlx_whisper", { stdio: "ignore" }); return "local"; } catch {}
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}

const backend = detectBackend();
if (!backend) {
  console.error("No transcription backend available. Install mlx-whisper or set OPENAI_API_KEY.");
  process.exit(1);
}
console.log(`Backend: ${backend}`);

const BREAK_BEFORE = new Set([
  "but", "and", "or", "so", "yet", "nor",
  "that", "which", "when", "if", "because", "as",
]);

const MAX_WORDS = 6;

function chunkWords(words) {
  const chunks = [];
  let current = [];

  const flush = () => {
    if (current.length === 0) return;
    chunks.push({
      text: current.map((w) => w.word).join("").trim(),
      startMs: Math.round(current[0].start * 1000),
      endMs: Math.round(current[current.length - 1].end * 1000),
      words: current.map((w) => ({
        word: w.word,
        startMs: Math.round(w.start * 1000),
        endMs: Math.round(w.end * 1000),
      })),
    });
    current = [];
  };

  for (const word of words) {
    const bare = word.word.trim().toLowerCase().replace(/[^a-z]/g, "");
    if (BREAK_BEFORE.has(bare) && current.length >= 3) flush();
    current.push(word);
    const lastChar = word.word.trim().slice(-1);
    if ([".", "!", "?"].includes(lastChar) || (lastChar === "," && current.length >= 3) || current.length >= MAX_WORDS) {
      flush();
    }
  }

  flush();
  return chunks;
}

async function transcribeLocal(videoPath) {
  const tmpDir = fs.mkdtempSync(path.join(ROOT, ".transcribe-tmp-"));
  try {
    execSync(
      `mlx_whisper "${videoPath}" --model mlx-community/whisper-large-v3-turbo --output-format json --word-timestamps True --output-dir "${tmpDir}"`,
      { stdio: "inherit" }
    );
    const jsonFile = fs.readdirSync(tmpDir).find((f) => f.endsWith(".json"));
    const result = JSON.parse(fs.readFileSync(path.join(tmpDir, jsonFile), "utf8"));
    const words = result.segments.flatMap((s) => s.words ?? []);
    return words;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

async function transcribeOpenAI(videoPath) {
  const { default: OpenAI } = await import("openai");
  const openai = new OpenAI();
  const response = await openai.audio.transcriptions.create({
    file: fs.createReadStream(videoPath),
    model: "whisper-1",
    response_format: "verbose_json",
    timestamp_granularities: ["word"],
  });
  return response.words;
}

let captions = {};
if (fs.existsSync(OUT_FILE)) {
  captions = JSON.parse(fs.readFileSync(OUT_FILE, "utf8"));
}

for (const video of videos) {
  const videoPath = path.join(PUBLIC_DIR, video);

  if (!fs.existsSync(videoPath)) {
    console.log(`Skipping ${video} (file not found)`);
    continue;
  }

  if (captions[video]) {
    const ans = await ask(`${video} already has captions. Re-transcribe? [y/N] `);
    if (!ans.trim().toLowerCase().startsWith("y")) {
      console.log(`  Skipping.`);
      continue;
    }
  }

  console.log(`Transcribing ${video}...`);

  const words = backend === "local"
    ? await transcribeLocal(videoPath)
    : await transcribeOpenAI(videoPath);

  captions[video] = chunkWords(words);
  console.log(`  → ${captions[video].length} caption chunks`);

  fs.writeFileSync(OUT_FILE, JSON.stringify(captions, null, 2));
}

console.log(`\nDone. Captions saved to ${path.relative(ROOT, OUT_FILE)}`);
