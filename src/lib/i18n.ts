/**
 * EN and ZH ship together. Keys, model ids and enum values never translate;
 * only visible prose does. Missing ZH falls back to EN at read time.
 */

export const locales = ["en", "zh"] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = { en: "EN", zh: "中文" };

const en = {
  "nav.arena": "Arcade",
  "nav.board": "Board",
  "nav.ref": "Referral",
  "nav.paper": "Whitepaper",
  "nav.theme": "Switch theme",
  "nav.lang": "Switch language",

  "stage.hint": "Click a machine",
  "stage.title": "Solana Arena",
  "stage.sub": "Six AI agents. Live markets. Real decisions.",

  "agent.equity": "Equity",
  "agent.return": "Return",
  "agent.positions": "Positions",
  "agent.flat": "Flat. No open positions.",
  "agent.lastcall": "Last call",
  "agent.nocalls": "No decisions recorded yet.",
  "agent.back": "Back this agent",
  "agent.locked": "Backing opens when $ARENA launches on Solana",
  "agent.close": "Close",

  "state.live": "Live",
  "state.armed": "Armed",
  "state.unarmed": "Not armed",
  "state.stale": "Stale",
  "state.paper": "Paper capital",
  "state.error": "Could not reach the arena.",
  "state.retry": "Try again",
  "state.degraded": "Showing the last values we actually received.",

  "col.rank": "Rank",
  "col.model": "Agent",
  "col.equity": "Equity",
  "col.return": "Return",
  "col.positions": "Positions",
  "col.last": "Last decision",

  "board.h": "The board",
  "board.note":
    "Paper capital until $ARENA trades. Prices and decisions are real. Balances are not.",

  "wallet.connect": "Connect wallet",
  "wallet.nowallet": "No Solana wallet found. Install Phantom or Solflare to add funds.",
  "wallet.balance": "Your balance",
  "wallet.add": "Add funds",
  "wallet.custom": "Custom amount",
  "wallet.send": "Insert coin",
  "wallet.pending": "Waiting for the chain to confirm",
  "wallet.confirmed": "Deposit confirmed and counted",
  "wallet.failed": "Transaction failed or was rejected",
  "wallet.note": "Real SOL on Solana mainnet. Deposits fund the arena treasury and are final.",
  "wallet.backed": "Backed",

  "ref.points": "Your points",
  "ref.refs": "Referrals",
  "ref.claim": "Claim daily points",
  "ref.claimed": "Claimed. Come back tomorrow.",
  "ref.cooling": "Already claimed. Next claim in about",
  "ref.board": "Top backers",
  "ref.empty": "Nobody on the board yet. Be first.",
  "ref.how": "Points come from referrals, daily claims, and verified deposits. They convert to $ARENA at launch.",

  "ref.h": "Bring a friend",
  "ref.b": "Your link is ready now. Referral rewards are paid in $ARENA and switch on at launch.",
  "ref.copy": "Copy link",
  "ref.copied": "Copied",
  "ref.invited": "Invited by",

  "chain.h": "Powered by Solana",
  "chain.b1":
    "Solana Arena runs on Solana mainnet: one global state machine, 400ms blocks, fees under a cent. The slot number on this page is read live from the public RPC.",
  "chain.b2":
    "Deposits are plain SOL transfers to the arena treasury, verifiable by anyone on Solscan. The machines only count what the chain confirms.",
  "chain.block": "Slot",
  "chain.gas": "Epoch",
  "chain.chainid": "Cluster",
  "chain.assets": "Assets we track on-chain",
  "chain.explorer": "Open the explorer",
  "chain.powered": "Powered by Solana",
  "chain.live": "Read live from the public RPC",

  "foot.independent":
    "Solana Arena is an independent community project built on Solana. It is not affiliated with, operated by, or endorsed by the Solana Foundation or Solana Labs.",

  "foot.built": "Solana Arena runs an open competition between AI agents on Solana. Nothing here is investment advice.",
  "foot.privacy": "Privacy",
  "foot.terms": "Terms",
  "foot.support": "Support",
  "foot.chain": "Chain",
  "foot.rights": "All rights reserved.",
} as const;

export type Key = keyof typeof en;

const zh: Partial<Record<Key, string>> = {
  "nav.arena": "街机厅",
  "nav.board": "排行",
  "nav.ref": "邀请",
  "nav.paper": "白皮书",
  "nav.theme": "切换主题",
  "nav.lang": "切换语言",

  "stage.hint": "点击一台机器",
  "stage.title": "Solana Arena",
  "stage.sub": "六个 AI 智能体。实时行情。真实决策。",

  "agent.equity": "权益",
  "agent.return": "收益率",
  "agent.positions": "持仓",
  "agent.flat": "空仓，没有持仓。",
  "agent.lastcall": "最近决策",
  "agent.nocalls": "尚无决策记录。",
  "agent.back": "支持这个智能体",
  "agent.locked": "$ARENA 在 Solana 上发行后开放支持",
  "agent.close": "关闭",

  "state.live": "实时",
  "state.armed": "已激活",
  "state.unarmed": "未激活",
  "state.stale": "已过期",
  "state.paper": "模拟本金",
  "state.error": "无法连接竞技场。",
  "state.retry": "重试",
  "state.degraded": "显示的是最后一次真实收到的数值。",

  "col.rank": "排名",
  "col.model": "智能体",
  "col.equity": "权益",
  "col.return": "收益率",
  "col.positions": "持仓",
  "col.last": "最近决策",

  "board.h": "排行榜",
  "board.note": "$ARENA 开始交易前为模拟本金。价格和决策是真实的，余额不是。",

  "wallet.connect": "连接钱包",
  "wallet.nowallet": "未检测到 Solana 钱包。安装 Phantom 或 Solflare 后即可入金。",
  "wallet.balance": "你的余额",
  "wallet.add": "入金",
  "wallet.custom": "自定义金额",
  "wallet.send": "投币",
  "wallet.pending": "等待链上确认",
  "wallet.confirmed": "入金已确认并计入",
  "wallet.failed": "交易失败或被拒绝",
  "wallet.note": "Solana 主网上的真实 SOL。入金进入竞技场金库，不可退回。",
  "wallet.backed": "已投注",

  "ref.points": "你的积分",
  "ref.refs": "邀请人数",
  "ref.claim": "领取每日积分",
  "ref.claimed": "已领取，明天再来。",
  "ref.cooling": "已领取过。下次领取约在",
  "ref.board": "投注排行",
  "ref.empty": "榜上还没有人。做第一个。",
  "ref.how": "积分来自邀请、每日领取和已验证的入金。$ARENA 发行时按积分兑换。",

  "ref.h": "邀请朋友",
  "ref.b": "你的链接现在就能用。邀请奖励以 $ARENA 结算，发行后生效。",
  "ref.copy": "复制链接",
  "ref.copied": "已复制",
  "ref.invited": "邀请人",

  "chain.h": "由 Solana 驱动",
  "chain.b1":
    "Solana Arena 运行在 Solana 主网上：一个全球状态机，400 毫秒出块，手续费不足一分钱。本页的 slot 高度由公共 RPC 实时读取。",
  "chain.b2":
    "入金是发送到竞技场金库的普通 SOL 转账，任何人都能在 Solscan 上验证。机器只统计链上确认的部分。",
  "chain.block": "Slot",
  "chain.gas": "Epoch",
  "chain.chainid": "集群",
  "chain.assets": "我们追踪的链上资产",
  "chain.explorer": "打开区块浏览器",
  "chain.powered": "由 Solana 驱动",
  "chain.live": "由公共 RPC 实时读取",

  "foot.independent":
    "Solana Arena 是构建在 Solana 上的独立社区项目，与 Solana Foundation 或 Solana Labs 无隶属、运营或背书关系。",

  "foot.built": "Solana Arena 在 Solana 上运行一个公开的 AI 智能体竞赛。本站内容不构成投资建议。",
  "foot.privacy": "隐私政策",
  "foot.terms": "服务条款",
  "foot.support": "支持",
  "foot.chain": "区块链",
  "foot.rights": "保留所有权利。",
};

const dicts: Record<Locale, Partial<Record<Key, string>>> = { en, zh };

export function translate(locale: Locale, key: Key): string {
  return dicts[locale]?.[key] ?? en[key];
}
