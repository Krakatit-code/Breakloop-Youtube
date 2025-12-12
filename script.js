// -------------------------------------------------------------
// script.js - 完全統合版（ランダムワード + ひらがなノイズ対応）
// -------------------------------------------------------------

// Load JSON files from same directory
async function loadData() {
  const [categories, features, exclude] = await Promise.all([
    fetch("categories.json").then(r => r.json()),
    fetch("features.json").then(r => r.json()),
    fetch("exclude.json").then(r => r.json())
  ]);
  return { categories, features, exclude };
}

// -------------------------------------------------------------
// State
// -------------------------------------------------------------
let DATA = {};
let state = {
  category: null,
  genre: null,
  randomWord: null,
  features: new Set(),
  excludeDisplay: new Set(),
  excludeQuery: [],
  noise: "" // ★ ノイズ三文字
};

// Utility
const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];
const escapeText = (s) => s.trim();

// -------------------------------------------------------------
//  共通：ラベル表示生成
// -------------------------------------------------------------
function renderOptionGroup(containerId, items, type) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  items.forEach(text => {
    const el = document.createElement("label");
    el.className = "option-label";
    el.textContent = text;
    el.onclick = () => toggleOption(type, text, el);
    container.appendChild(el);
  });
}

// -------------------------------------------------------------
//  特徴 / 除外ワードのトグル
// -------------------------------------------------------------
function toggleOption(type, text, el) {
  if (type === "feature") {
    if (state.features.has(text)) {
      state.features.delete(text);
      el.classList.remove("selected");
    } else {
      state.features.add(text);
      el.classList.add("selected");
    }
  }

  else if (type === "exclude") {
    const item = DATA.exclude.find(e => e.text === text);
    const queryText = item && item.children.length > 0
      ? item.children[0].text
      : "-" + text;

    if (state.excludeDisplay.has(text)) {
      state.excludeDisplay.delete(text);
      state.excludeQuery = state.excludeQuery.filter(q => q !== queryText);
      el.classList.remove("selected");
    } else {
      state.excludeDisplay.add(text);
      state.excludeQuery.push(queryText);
      el.classList.add("selected");
    }
  }

  updateSearchPreview();
}

// -------------------------------------------------------------
//  カテゴリ → ジャンル
// -------------------------------------------------------------
function renderCategories() {
  const categoryNames = DATA.categories.map(c => c.text.trim());
  renderOptionGroup("categoryOptions", categoryNames, "category");

  document
    .getElementById("categoryOptions")
    .querySelectorAll(".option-label")
    .forEach((el, idx) => {
      el.onclick = () => {
        document.querySelectorAll("#categoryOptions .selected")
          .forEach(x => x.classList.remove("selected"));
        el.classList.add("selected");

        state.category = categoryNames[idx];
        renderGenres(idx);
      };
    });
}

function renderGenres(catIndex) {
  const genres = DATA.categories[catIndex].children.map(g => g.text.trim());
  renderOptionGroup("genreOptions", genres, "genre");

  document
    .getElementById("genreOptions")
    .querySelectorAll(".option-label")
    .forEach((el, idx) => {
      el.onclick = () => {
        document.querySelectorAll("#genreOptions .selected")
          .forEach(x => x.classList.remove("selected"));
        el.classList.add("selected");

        state.genre = genres[idx];
        pickRandomWord(catIndex, idx);
      };
    });
}

// -------------------------------------------------------------
//  ランダム人気語句
// -------------------------------------------------------------
function pickRandomWord(catIndex, genreIndex) {
  const children = DATA.categories[catIndex].children[genreIndex].children;
  const words = children.map(c => escapeText(c.text));

  state.randomWord = (document.getElementById("noRandomWord").checked)
    ? ""
    : pickOne(words);

  updateSearchPreview();
}

// -------------------------------------------------------------
//  検索語プレビュー
// -------------------------------------------------------------
function updateSearchPreview() {
  const genreText   = state.genre || "未選択";
  const featureText = state.features.size ? [...state.features].join(", ") : "未選択";
  const excludeText = state.excludeDisplay.size ? [...state.excludeDisplay].join(", ") : "なし";
  const randomText  = state.randomWord || "なし";
  const noiseText   = state.noise || "なし";

  document.getElementById("searchPreview").textContent =
    `【ジャンル：${genreText}　特徴：${featureText}　ランダム：${randomText}　除外：${excludeText}　ノイズ：${noiseText}】`;
}

// -------------------------------------------------------------
//  ワードガチャ再抽選
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const resetBtn = document.getElementById("resetKeywordsBtn");
  if (resetBtn) {
    resetBtn.onclick = () => {
      if (state.category && state.genre) {
        const catIndex = DATA.categories.findIndex(c => c.text.trim() === state.category);
        const genreIndex = DATA.categories[catIndex].children.findIndex(
          g => g.text.trim() === state.genre
        );
        pickRandomWord(catIndex, genreIndex);
      }
    };
  }
});

// -------------------------------------------------------------
//  自由入力
// -------------------------------------------------------------
function setupFreeInputs() {
  const featureInput = document.getElementById("featureInput");
  if (featureInput) {
    featureInput.addEventListener("change", (e) => {
      e.target.value.split(",").forEach(v => state.features.add(escapeText(v)));
      updateSearchPreview();
    });
  }

  const excludeInput = document.getElementById("excludeInput");
  if (excludeInput) {
    excludeInput.addEventListener("change", (e) => {
      e.target.value.split(",").forEach(v => {
        const word = escapeText(v);
        state.excludeDisplay.add(word);
        state.excludeQuery.push("-" + word);
      });
      updateSearchPreview();
    });
  }
}

// -------------------------------------------------------------
//  ひらがなノイズ生成
// -------------------------------------------------------------
const HIRAGANA = [
  "あ","い","う","え","お",
  "か","き","く","け","こ",
  "さ","し","す","せ","そ",
  "た","ち","つ","て","と",
  "な","に","ぬ","ね","の",
  "は","ひ","ふ","へ","ほ",
  "ま","み","む","め","も",
  "や","ゆ","よ",
  "ら","り","る","れ","ろ",
  "わ","を","ん"
];

function randomKana(n = 3) {
  let out = "";
  for (let i = 0; i < n; i++) {
    out += HIRAGANA[Math.floor(Math.random() * HIRAGANA.length)];
  }
  return out;
}

// ★ ノイズ生成ボタン
function generateNoise() {
  state.noise = randomKana(3);
  updateSearchPreview();
}
window.generateNoise = generateNoise;

// ★ ノイズ消去
function clearNoise() {
  state.noise = "";
  updateSearchPreview();
}
window.clearNoise = clearNoise;

// -------------------------------------------------------------
//  検索
// -------------------------------------------------------------
function search(type) {
  let parts = [];

  if (state.genre) parts.push(state.genre);
  if (state.randomWord) parts.push(state.randomWord);
  if (state.noise) parts.push(state.noise);

  if (state.features.size) parts.push(...state.features);
  if (state.excludeQuery.length) parts.push(...state.excludeQuery);

  const q = parts.join(" ").trim();

  if (!q) {
    alert("検索語がまだ選ばれていません（ジャンル、特徴、または除外ワードを選択してください）");
    return;
  }

  if (type === "youtube") {
    window.open("https://www.youtube.com/results?search_query=" + encodeURIComponent(q));
  } else {
    window.open("https://www.google.com/search?tbm=vid&q=" + encodeURIComponent(q));
  }
}

// -------------------------------------------------------------
// Init
// -------------------------------------------------------------
(async () => {
  DATA = await loadData();

  renderCategories();
  renderOptionGroup("featureOptions", DATA.features.map(f => f.text), "feature");
  renderOptionGroup("excludeOptions", DATA.exclude.map(e => e.text), "exclude");

  setupFreeInputs();
})();
