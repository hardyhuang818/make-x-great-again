import assert from "node:assert/strict";
import { test } from "node:test";

interface SignalsLike {
  isProfile: boolean;
  handle: string;
  displayName: string;
  bio: string;
  hasDefaultAvatar: boolean;
  recentTweets: string[];
}

const detectModulePath = "../extension/lib/detect.ts";
const { AUTO_HIDE_THRESHOLD, AUTO_THRESHOLD, heuristic } = (await import(detectModulePath)) as {
  AUTO_HIDE_THRESHOLD: number;
  AUTO_THRESHOLD: number;
  heuristic: (s: SignalsLike) => { score: number; why: string[] };
};

function signals(overrides: Partial<SignalsLike>): SignalsLike {
  return {
    isProfile: false,
    handle: "example",
    displayName: "",
    bio: "",
    hasDefaultAvatar: false,
    recentTweets: [],
    ...overrides,
  };
}

test("heuristic catches botany-name spam replies with promotional display names", () => {
  const h = heuristic(
    signals({
      handle: "leigh_hann21111",
      displayName: "㊙ 男士快速㊙ 匹配通道 ㊙",
      recentTweets: ["🥞🥞\nElaeisguineensis\n\n🥞🥞\n油棕"],
    }),
  );

  assert.ok(h.score >= AUTO_THRESHOLD);
  assert.ok(h.why.some((reason) => reason.includes("植物拉丁名")));
});

test("heuristic keeps ordinary botany discussion below the auto threshold", () => {
  const h = heuristic(
    signals({
      handle: "botany_journal",
      displayName: "Botany Journal",
      bio: "Plant science notes",
      recentTweets: ["Elaeis guineensis is grown for palm oil in tropical climates."],
    }),
  );

  assert.ok(h.score < AUTO_THRESHOLD);
});

test("heuristic auto-hides promotional display names with emoji-only replies", () => {
  const h = heuristic(
    signals({
      handle: "LindaHood218975",
      displayName: "水水姐姐❤️ 免费破处 ❤️",
      recentTweets: ["🤥"],
    }),
  );

  assert.ok(h.score >= AUTO_HIDE_THRESHOLD);
  assert.ok(h.why.some((reason) => reason.includes("极短 emoji 回复")));
});

test("heuristic catches scheduled soft-porn broadcast display names", () => {
  const h = heuristic(
    signals({
      handle: "ArthurOlga35190",
      displayName: "今晚准时涩播⭐",
      recentTweets: ["🐯"],
    }),
  );

  assert.ok(h.score >= AUTO_HIDE_THRESHOLD);
});

test("heuristic auto-hides profile-click hookup templates with decorated emoji replies", () => {
  const h = heuristic(
    signals({
      handle: "SRamirez83047",
      displayName: "心动猫🍑找炮友🍑点主页🍑",
      recentTweets: ["]🦋\n\n]🦋"],
    }),
  );

  assert.ok(h.score >= AUTO_HIDE_THRESHOLD);
  assert.ok(h.why.some((reason) => reason.includes("极短 emoji 回复")));
});

test("heuristic auto-hides explicit meetup entrypoint display names", () => {
  const h = heuristic(
    signals({
      handle: "juliana_su54",
      displayName: "全国1-5线🌈真实约见入口🌈点我",
      recentTweets: ["Sellers\n🟡\nUntil\n💛\n卖家\n🟡\n直到\n💛"],
    }),
  );

  assert.ok(h.score >= AUTO_HIDE_THRESHOLD);
  assert.ok(h.why.some((reason) => reason.includes("明确招嫖")));
});

test("heuristic auto-hides tomato-station emoji bait display names", () => {
  const h = heuristic(
    signals({
      handle: "BerylWylde69722",
      displayName: "☝️红最爱野站🍅",
      recentTweets: ["❤️"],
    }),
  );

  assert.ok(h.score >= AUTO_HIDE_THRESHOLD);
});

test("heuristic auto-hides sibling-themed emoji bait display names", () => {
  const h = heuristic(
    signals({
      handle: "HugginsMar42774",
      displayName: "☝️玉琪大兄妹🍅",
      recentTweets: ["😊"],
    }),
  );

  assert.ok(h.score >= AUTO_HIDE_THRESHOLD);
});

test("heuristic auto-hides hookup matching display names", () => {
  const h = heuristic(
    signals({
      handle: "WrightBery19297",
      displayName: "听话佳欣（炮友速配",
      recentTweets: ["😊"],
    }),
  );

  assert.ok(h.score >= AUTO_HIDE_THRESHOLD);
});

test("heuristic does not flag ordinary CJK replies without promo profile signals", () => {
  const h = heuristic(
    signals({
      handle: "maomao2233",
      displayName: "泽元形意喵喵拳创始人马保喵",
      recentTweets: ["等它老了送去老年网瘾学校，叫爱打人的护工天天电他。"],
    }),
  );

  assert.ok(h.score < AUTO_THRESHOLD);
});
