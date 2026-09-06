# 今週の机（Mastery Life Agile）

一人アジャイルの対話机です。目標を音声またはテキストで渡し、エピックと PBI に分解し、**承認した内容だけ** Notion に書きます。

## 使い方

1. Notion の「Mastery Life Agile」ページに、自分の Integration を接続する
2. `.env.example` を `.env.local` にコピーし、`GEMINI_API_KEY` と `NOTION_TOKEN` を入れる
3. `pnpm install` → `pnpm dev`
4. 机で話す → 赤い「承認」印を押す → Notion の Epics / Product Backlog に載る
5. 日曜朝に「今週の計画を出す」、土曜夜に「振り返りを始める」

スプリントは日曜〜土曜、週 8 時間、見積は時間単位です。パラメータは `config/app.json`。

## アーキテクチャ

```
UI → React Query → /api/* → Use Case → Infrastructure
```

詳細は [`.cursor/skills/`](.cursor/skills/) を読んでください。

## Notion

親ページ: [Mastery Life Agile](https://app.notion.com/p/3d29a12e522181c7897dc5cc1d750d1f)

| DB | 用途 |
| --- | --- |
| Epics | 大目標 |
| Product Backlog | 1〜2 週間粒度のタスク |
| Sprints | 週次スプリント |
| Retrospectives | Keep / Problem / Try |

データベース ID は `.env.example` に入れてあります。Integration にページを共有しないと API から見えません。

## Cron（任意）

Vercel に載せる場合、`vercel.json` が日曜 8:00 JST 相当（UTC 土曜 23:00）に計画、土曜 21:00 JST 相当（UTC 土曜 12:00）にレトロを起動します。書き込みはせず、承認待ちの案を作ります。

## 開発コマンド

```bash
pnpm install
cp .env.example .env.local
pnpm dev
pnpm test
pnpm check
```
