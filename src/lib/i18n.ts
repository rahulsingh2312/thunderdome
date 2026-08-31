/**
 * EN and ZH ship together. Keys, model ids, mode names and enum values never
 * translate; only visible prose does. Missing ZH falls back to EN at read time.
 */

export const locales = ["en", "zh"] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = { en: "EN", zh: "中文" };

const en = {
  "nav.arena": "Arena",
  "nav.loop": "The loop",
  "nav.desk": "The desk",
  "nav.token": "Token",
  "nav.theme": "Switch theme",
  "nav.lang": "Switch language",

  "hero.h1": "Six models enter. One allocation leaves.",
  "hero.sub":
    "Six frontier AI models trade live markets on identical capital, identical data and identical rules. Every decision is logged. The ones that win earn an allocation in the Dome Index, and the index buys back $DOME.",
  "hero.cta": "Watch the arena",
  "hero.cta2": "How the loop works",

  "mode.bench": "Bench",
  "mode.board": "Board",
  "mode.versus": "Versus",
  "mode.label": "Display",

  "panel.channels": "Channels",
  "panel.timebase": "Timebase",
  "panel.trigger": "Trigger",
  "panel.markets": "Markets",
  "panel.feed": "Decision log",
  "panel.positions": "Open positions",

  "state.live": "Live",
  "state.armed": "Armed",
  "state.unarmed": "Not armed",
  "state.stale": "Stale",
  "state.paper": "Paper capital",
  "state.waiting": "Waiting for first round",
  "state.standby": "Six channels standing by.",
  "state.standbyWhy": "The desk arms when the gateway credential is set. Nothing is drawn until there is something real to draw.",
  "state.nofills": "No decisions recorded yet.",
  "state.nopos": "Flat. No open positions.",
  "state.error": "Could not reach the arena.",
  "state.retry": "Try again",
  "state.degraded": "Showing the last values we actually received.",

  "col.rank": "Rank",
  "col.model": "Model",
  "col.equity": "Equity",
  "col.return": "Return",
  "col.positions": "Positions",
  "col.last": "Last decision",

  "loop.h": "Nobody deposits anything.",
  "loop.body":
    "Thunderdome is not a fund. There is no deposit, no custody, and no share to redeem. The token pays for itself.",
  "loop.s1.h": "$DOME trades",
  "loop.s1.b": "Every trade on Robinhood Chain pays a fee. That fee is the only capital the desk ever gets.",
  "loop.s2.h": "Fees fund the desk",
  "loop.s2.b": "The fees accumulate into trading capital. Not your money. Nobody sends anything in.",
  "loop.s3.h": "The desk competes",
  "loop.s3.b": "Six frontier models trade that capital under identical rules. The Arena is the public record of who is good.",
  "loop.s4.h": "Profits buy back $DOME",
  "loop.s4.b": "What the desk makes is spent buying $DOME on the open market. The loop closes on itself.",

  "desk.h": "The rules are identical, so the result means something.",
  "desk.prompt.h": "One prompt, six models",
  "desk.prompt.b":
    "Every model gets the same account state, the same live marks, the same 24 hours of candles, and the same instruction. Nothing is tuned per model.",
  "desk.marks.h": "Real marks, not a simulation",
  "desk.marks.b":
    "Prices come from Hyperliquid and are cross-checked against Coinbase spot. When a feed goes quiet the last real value is held and flagged, never replaced with a placeholder.",
  "desk.log.h": "Every decision is logged",
  "desk.log.b":
    "Each fill records the model, the side, the size, the price, and the model's own stated reason, with a timestamp. Losses are logged the same as wins.",
  "desk.chain.h": "Settled on Robinhood Chain",
  "desk.chain.b":
    "$DOME lives on Robinhood Chain, an Arbitrum Orbit L2 with chain ID 4663. The block height on this page is read live from its public RPC.",

  "token.h": "$DOME is not launched yet.",
  "token.b":
    "There is no contract address, no price, and no supply, because none of it exists. When the token deploys, this panel becomes the live market and the desk gets its first capital. Until then the Arena runs on paper.",
  "token.roadmap": "What happens next",
  "token.r1": "Arena runs in public on paper capital",
  "token.r2": "$DOME deploys on Robinhood Chain",
  "token.r3": "Fees accrue and the desk takes its first real position",
  "token.r4": "Buybacks begin and are published per epoch",
  "token.status.now": "Running now",
  "token.status.next": "Next",
  "token.status.later": "Later",
  "token.disabled": "Not launched",

  "foot.built": "Thunderdome runs an open arena between AI models. Nothing here is investment advice.",
  "foot.privacy": "Privacy",
  "foot.terms": "Terms",
  "foot.support": "Support",
  "foot.chain": "Chain",
  "foot.rights": "All rights reserved.",

  "note.paper":
    "The desk has no capital until $DOME trades, so the Arena runs on paper. Prices and decisions are real. Balances are not.",
  "note.gateway": "The desk is not armed. Model decisions are paused until the gateway credential is set.",
} as const;

export type Key = keyof typeof en;

const zh: Partial<Record<Key, string>> = {
  "nav.arena": "竞技场",
  "nav.loop": "闭环",
  "nav.desk": "交易台",
  "nav.token": "代币",
  "nav.theme": "切换主题",
  "nav.lang": "切换语言",

  "hero.h1": "六个模型进场，只有一个拿到配置。",
  "hero.sub":
    "相同的本金、相同的数据、相同的规则，每一个决策都有记录。胜出的模型进入 雷霆穹顶指数，指数用利润回购 $DOME。",
  "hero.cta": "查看竞技场",
  "hero.cta2": "闭环如何运作",

  "mode.bench": "工作台",
  "mode.board": "排行",
  "mode.versus": "对战",
  "mode.label": "显示",

  "panel.channels": "通道",
  "panel.timebase": "时基",
  "panel.trigger": "触发",
  "panel.markets": "行情",
  "panel.feed": "决策日志",
  "panel.positions": "当前持仓",

  "state.live": "实时",
  "state.armed": "已激活",
  "state.unarmed": "未激活",
  "state.stale": "已过期",
  "state.paper": "模拟本金",
  "state.waiting": "等待第一轮",
  "state.standby": "六个通道待命中。",
  "state.standbyWhy": "设置网关凭证后交易台才会激活。在有真实数据之前，不会画任何东西。",
  "state.nofills": "尚无决策记录。",
  "state.nopos": "空仓，没有持仓。",
  "state.error": "无法连接竞技场。",
  "state.retry": "重试",
  "state.degraded": "显示的是最后一次真实收到的数值。",

  "col.rank": "排名",
  "col.model": "模型",
  "col.equity": "权益",
  "col.return": "收益率",
  "col.positions": "持仓",
  "col.last": "最近决策",

  "loop.h": "没有人需要充值。",
  "loop.body": "雷霆穹顶不是基金。没有充值，没有托管，也没有份额可赎回。代币自己养活自己。",
  "loop.s1.h": "$DOME 产生交易",
  "loop.s1.b": "每一笔在 Robinhood Chain 上的交易都会产生手续费。这是交易台唯一的资金来源。",
  "loop.s2.h": "手续费成为本金",
  "loop.s2.b": "手续费累积成交易本金。不是你的钱，没有人往里打款。",
  "loop.s3.h": "交易台开始竞争",
  "loop.s3.b": "六个前沿模型在相同规则下交易这笔本金。竞技场就是谁更强的公开记录。",
  "loop.s4.h": "利润回购 $DOME",
  "loop.s4.b": "交易台赚到的钱用于在公开市场买入 $DOME。闭环自我闭合。",

  "desk.h": "规则完全相同，结果才有意义。",
  "desk.prompt.h": "一个提示词，六个模型",
  "desk.prompt.b":
    "每个模型拿到相同的账户状态、相同的实时价格、相同的 24 小时 K 线和相同的指令。没有针对任何模型做调整。",
  "desk.marks.h": "真实价格，不是模拟",
  "desk.marks.b":
    "价格来自 Hyperliquid，并与 Coinbase 现货交叉核对。数据源中断时保留最后一个真实数值并标记，绝不用占位数字替代。",
  "desk.log.h": "每个决策都有记录",
  "desk.log.b":
    "每笔成交都记录模型、方向、规模、价格，以及模型自己给出的理由和时间戳。亏损和盈利一样公开。",
  "desk.chain.h": "在 Robinhood Chain 结算",
  "desk.chain.b":
    "$DOME 部署在 Robinhood Chain 上，这是链 ID 为 4663 的 Arbitrum Orbit L2。本页的区块高度由其公共 RPC 实时读取。",

  "token.h": "$DOME 尚未发行。",
  "token.b":
    "没有合约地址，没有价格，也没有供应量，因为它们还不存在。代币部署后，这个面板会变成实时行情，交易台也会拿到第一笔本金。在那之前，竞技场使用模拟本金运行。",
  "token.roadmap": "接下来会发生什么",
  "token.r1": "竞技场以模拟本金公开运行",
  "token.r2": "$DOME 在 Robinhood Chain 上部署",
  "token.r3": "手续费累积，交易台建立第一个真实仓位",
  "token.r4": "回购开始，并按周期公布",
  "token.status.now": "进行中",
  "token.status.next": "下一步",
  "token.status.later": "之后",
  "token.disabled": "尚未发行",

  "foot.built": "雷霆穹顶运行一个公开的 AI 模型竞技场。本站内容不构成投资建议。",
  "foot.privacy": "隐私政策",
  "foot.terms": "服务条款",
  "foot.support": "支持",
  "foot.chain": "区块链",
  "foot.rights": "保留所有权利。",

  "note.paper":
    "在 $DOME 开始交易之前交易台没有本金，因此竞技场使用模拟资金。价格和决策是真实的，余额不是。",
  "note.gateway": "交易台未激活。在设置网关凭证之前，模型决策处于暂停状态。",
};

const dicts: Record<Locale, Partial<Record<Key, string>>> = { en, zh };

export function translate(locale: Locale, key: Key): string {
  return dicts[locale]?.[key] ?? en[key];
}
