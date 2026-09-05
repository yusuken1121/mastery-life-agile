# 初心者向け：コードの読み方と Clean Architecture 入門

このドキュメントは、このプロジェクトの**コードをどう読めばいいか**と、**なぜこの構成になっているか**を、実際のファイルを交えて説明します。

> 詳細ルールは [`.cursor/skills/`](../.cursor/skills/) に集約されています。  
> このガイドは「最初の1周」を目的とした読み物です。

---

## 1. まず覚える1行

このアプリのデータの流れは次のとおりです。

```
UI → React Query → /api/* → Use Case → Infrastructure
```

**日本語にすると：**

1. ユーザーが画面で操作する（UI）
2. React Query のフックが API を呼ぶ（クライアント）
3. Next.js の Route Handler がリクエストを受ける（サーバー入口）
4. Use Case がビジネスロジックを実行する（アプリの心臓）
5. Infrastructure が Gemini や Notion など外部サービスと通信する（具体実装）

---

## 2. なぜレイヤーに分けるのか？

### たとえ話：レストラン

| レイヤー           | レストランでの役割                             | このプロジェクトでの例         |
| ------------------ | ---------------------------------------------- | ------------------------------ |
| **UI**             | お客さんが注文するカウンター                   | `ChatInterface` コンポーネント |
| **Client Data**    | ウェイター（注文を厨房に伝える）               | `useSendMessageStream` フック  |
| **Route Handler**  | 受付（注文票をチェックする）                   | `/api/chat/route.ts`           |
| **Use Case**       | シェフ（調理の手順を決める）                   | `SendMessageUseCase`           |
| **Port**           | レシピの「調味料は何でもよい」と書いてある部分 | `IAIGateway` インターフェース  |
| **Infrastructure** | 実際の調味料（Gemini SDK など）                | `GeminiGateway`                |

**ポイント：** シェフ（Use Case）は「Gemini という調味料」ではなく、「AI ゲートウェイという抽象」にだけ依存します。  
将来 OpenAI に変えても、シェフのレシピ（Use Case）は変更不要、という設計です。

---

## 3. フォルダ構成：どこに何があるか

```text
src/
├── app/                    # 画面と API の入口
│   ├── page.tsx            # トップページ（/）
│   ├── _components/        # 機能ごとの UI（ChatInterface など）
│   └── api/                # Route Handler（Composition Root）
│
├── components/ui/          # shadcn/ui（ボタン、入力欄など部品）
│
├── core/                   # ★ ビジネスの中心（外部ライブラリ禁止）
│   ├── domain/             # データの形（Entity）
│   ├── ports/              # インターフェース（約束）
│   └── use-cases/          # ビジネスロジック
│
├── infrastructure/         # 外部サービスの具体実装
│   ├── gemini/
│   └── notion/
│
└── lib/
    ├── api/                # フロントから API を呼ぶコード
    └── validators/         # Zod スキーマ（入力チェック）
```

**初心者が最初に読む順番（Chat 機能）：**

1. `src/app/page.tsx` — 何が表示されるか
2. `src/app/_components/chat-interface.tsx` — ユーザー操作
3. `src/lib/api/queries/useChat.ts` — API 呼び出し
4. `src/app/api/chat/route.ts` — サーバー入口
5. `src/core/use-cases/send-message.use-case.ts` — ビジネスロジック
6. `src/infrastructure/gemini/gemini-chat.gateway.ts` — Gemini 連携

---

## 4. レイヤー別：実際のコードで理解する

### 4-1. Domain（ドメイン）— 「データの形」

**役割：** アプリが扱うデータを TypeScript の型で表現する。  
React も Next.js も Gemini も import しない、**純粋な TypeScript だけ**。

```10:35:src/core/domain/message.entity.ts
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}
```

`Message` は「チャットの1メッセージがどんな形か」を定義しています。  
`createMessage()` はその形のオブジェクトを作る工場関数です。

**読み方のコツ：** Domain ファイルは「名詞の定義」。ロジックは少なめ、型と factory が中心。

---

### 4-2. Port（ポート）— 「約束・インターフェース」

**役割：** 外部サービス（AI、DB など）に対する**約束**を interface で書く。  
実装は書かない。「こういうメソッドがあれば動く」という契約書。

```50:76:src/core/ports/ai-gateway.port.ts
export interface IAIGateway {
  generateStream(
    messages: Message[],
    options?: AIGenerateOptions
  ): Promise<ReadableStream<string>>;

  generate(
    messages: Message[],
    options?: AIGenerateOptions
  ): Promise<string>;
}
```

Use Case は `GeminiGateway` ではなく `IAIGateway` だけを知っています。  
これが **依存性逆転の原則（DIP）** です。

**読み方のコツ：** Port は `I` で始まる interface が多い（`IAIGateway`, `INotionRecordWriter`）。

---

### 4-3. Use Case（ユースケース）— 「ビジネスロジック」

**役割：** 「メッセージを送って AI から返答をもらう」など、アプリ固有の処理手順を書く。  
Port（interface）だけに依存し、Gemini SDK などには直接触らない。

```47:68:src/core/use-cases/send-message.use-case.ts
export class SendMessageUseCase {
  constructor(private readonly aiGateway: IAIGateway) {}

  async execute(input: SendMessageInput): Promise<SendMessageOutput> {
    this.validateInput(input);

    const stream = await this.aiGateway.generateStream(
      input.messages,
      input.options
    );

    return { stream };
  }
```

**3つのポイント：**

1. **constructor で Port を受け取る** — 外から注入（DI）される
2. **`execute()` が入口** — 「このユースケースを実行する」メソッド
3. **バリデーションもここ** — 「ユーザーメッセージが1つ以上必要」などのルール

Notion の例も同じパターンです。非常にシンプルな Use Case です。

```4:11:src/core/use-cases/create-notion-record.use-case.ts
export class CreateNotionRecordUseCase<
  TRecord extends Record<string, unknown>,
> {
  constructor(private readonly writer: INotionRecordWriter<TRecord>) {}

  async execute(record: TRecord): Promise<NotionPageRef> {
    return this.writer.create(record);
  }
}
```

**読み方のコツ：** Use Case は「if 文やルール + Port の呼び出し」。UI や HTTP のことは書いていない。

---

### 4-4. Infrastructure（インフラ）— 「外部サービスの具体実装」

**役割：** Port の interface を**実際に実装**する。Gemini SDK、Notion SDK などをここで使う。

```29:46:src/infrastructure/gemini/gemini-chat.gateway.ts
export class GeminiGateway implements IAIGateway {
  private client: GoogleGenerativeAI;

  constructor(apiKey?: string) {
    this.client = GeminiClientFactory.create(apiKey);
  }

  private convertMessagesToGeminiFormat(messages: Message[]): Content[] {
    return messages
      .filter((msg) => msg.role !== "system")
      .map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));
  }
```

`implements IAIGateway` — Port の約束を守っている、という意味です。

**読み方のコツ：** Infrastructure は「SDK との翻訳係」。Domain の `Message` を Gemini の `Content` 形式に変換している。

---

### 4-5. Route Handler（Composition Root）— 「部品を組み立てる場所」

**役割：** HTTP リクエストを受け取り、Zod で入力チェックし、Infrastructure を作って Use Case に渡す。  
**ここだけ**が Infrastructure の具体クラスを `new` してよい場所です。

```7:26:src/app/api/chat/route.ts
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedInput = sendMessageInputSchema.parse(body)

    const aiGateway = createGeminiGateway()
    const sendMessageUseCase = new SendMessageUseCase(aiGateway)

    if (validatedInput.stream) {
      const { stream } = await sendMessageUseCase.execute({
        messages: validatedInput.messages,
        options: validatedInput.options,
      })

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
        },
      })
    }
```

**流れ：**

1. リクエスト body を JSON で取得
2. Zod スキーマで検証（`sendMessageInputSchema`）
3. `createGeminiGateway()` で Infrastructure を生成
4. `new SendMessageUseCase(aiGateway)` で Use Case に注入
5. `execute()` を呼んで結果を HTTP レスポンスとして返す

Zod スキーマは `src/lib/validators/` に置いています。

```12:24:src/lib/validators/chat.schema.ts
export const sendMessageInputSchema = z.object({
  messages: z.array(messageSchema).min(1, "At least one message is required"),
  options: z
    .object({
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().positive().optional(),
      topP: z.number().min(0).max(1).optional(),
      model: z.string().optional(),
      systemPrompt: z.string().optional(),
    })
    .optional(),
  stream: z.boolean().optional().default(true),
})
```

**読み方のコツ：** Route Handler は「配線係」。ビジネスロジックは書かず、Use Case に任せる。

---

### 4-6. Client Data Layer — 「フロントから API を呼ぶ」

**役割：** ブラウザ上の React コンポーネントが、サーバーの `/api/*` を呼ぶためのコード。

#### ① API ラッパー（`lib/api/chat.ts`）

```20:32:src/lib/api/chat.ts
  sendMessageStream: async (
    data: PostChatMessageRequest,
  ): Promise<Response> => {
    const baseUrl = apiClient.defaults.baseURL ?? ""
    const url = `${baseUrl}/api/chat`
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ ...data, stream: true }),
    })
  },
```

ストリーミングは Axios ではなく `fetch` を使っています（Axios はレスポンス全体を待ってしまうため）。

#### ② React Query フック（`lib/api/queries/useChat.ts`）

```43:49:src/lib/api/queries/useChat.ts
export const useSendMessageStream = (
  options?: UseSendMessageStreamOptions,
) => {
  return useMutation({
    mutationFn: chatApi.sendMessageStream,
    ...options,
  })
}
```

`useMutation` は「ボタンを押したときに API を呼ぶ」パターン向け。  
`isPending`（読み込み中）や `error` などの状態も自動管理してくれます。

**読み方のコツ：** `lib/api/` は「フロント専用の API クライアント」。Infrastructure は import しない。

---

### 4-7. UI — 「ユーザーが触る画面」

**役割：** 見た目と操作。Use Case や Gemini SDK は直接呼ばない。

```17:57:src/app/_components/chat-interface.tsx
export function ChatInterface() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputValue, setInputValue] = React.useState("");
  const { mutateAsync: sendMessage, isPending: isLoading } = useSendMessageStream();

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userContent = inputValue.trim();
    setInputValue("");

    const userMessage = createChatMessage("user", userContent);
    const newHistory = [...messages, userMessage];
    setMessages(newHistory);

    try {
      const assistantMessage = createChatMessage("assistant", "");
      setMessages((prev) => [...prev, assistantMessage]);

      const response = await sendMessage({
        messages: newHistory,
        options: {
          model: "gemini-2.0-flash-exp",
          temperature: 0.7,
        },
      });
```

**UI がやっていること：**

1. 入力値を state に保持
2. `createChatMessage()` で Domain の Message を作成
3. `useSendMessageStream()` で API を呼ぶ
4. 返ってきたストリームを読みながら画面を更新

`createChatMessage` は Domain の `createMessage` をラップしたヘルパーです。

```7:12:src/lib/chat-utils.ts
export function createChatMessage(
  role: "user" | "assistant" | "system",
  content: string,
  metadata?: Record<string, unknown>
) {
  return createMessage(role, content, undefined, metadata);
}
```

**読み方のコツ：** UI ファイルの先頭に `"use client"` があるのは、React の hooks を使うため。

---

## 5. 実践：Chat 送信を最初から追う

ユーザーがメッセージを送って AI が返答するまで、ファイルを順に辿ります。

```
[1] page.tsx
      ↓ ChatInterface を表示
[2] chat-interface.tsx
      ↓ ユーザーが送信ボタンを押す
      ↓ createChatMessage() で Message を作成
      ↓ useSendMessageStream() を呼ぶ
[3] useChat.ts
      ↓ chatApi.sendMessageStream() を実行
[4] chat.ts
      ↓ fetch POST /api/chat
[5] api/chat/route.ts
      ↓ Zod で入力チェック
      ↓ createGeminiGateway() + new SendMessageUseCase()
      ↓ useCase.execute()
[6] send-message.use-case.ts
      ↓ validateInput()
      ↓ aiGateway.generateStream()
[7] gemini-chat.gateway.ts
      ↓ Google Gemini API を呼ぶ
      ↓ ReadableStream を返す
[5] route.ts
      ↓ Response として stream を返す
[2] chat-interface.tsx
      ↓ stream を1文字ずつ読んで画面更新
```

---

## 6. アーキテクチャの思想（3つの原則）

### 原則 1：依存は内側向き

```
UI / API → Use Case → Port ← Infrastructure
                ↑
             Domain（中心）
```

- **Domain** は誰にも依存しない（中心）
- **Use Case** は Domain と Port だけに依存
- **Infrastructure** は Port を実装する（外側）

`core/` から `infrastructure/` を import してはいけない、というルールの理由です。

### 原則 2：抽象に依存する（DIP）

Use Case は `GeminiGateway` ではなく `IAIGateway` に依存します。

```typescript
// ✅ 正しい — interface に依存
constructor(private readonly aiGateway: IAIGateway) {}

// ❌ 避ける — 具体クラスに依存
constructor(private readonly aiGateway: GeminiGateway) {}
```

AI プロバイダーを Gemini → OpenAI に変えるとき、変えるのは Route Handler の1行だけで済みます。

```typescript
// api/chat/route.ts で差し替えるだけ
const aiGateway = createOpenAIGateway() // 以前は createGeminiGateway()
```

### 原則 3：組み立ては1か所（Composition Root）

Infrastructure のインスタンス生成は **`src/app/api/**/route.ts` だけ\*\*。

コンポーネントや Use Case の中で `new GeminiGateway()` してはいけません。

---

## 7. よくある間違い

| 間違い                                   | なぜダメか                   | 正しい場所                          |
| ---------------------------------------- | ---------------------------- | ----------------------------------- |
| コンポーネントで Gemini SDK を直接呼ぶ   | UI が外部サービスに縛られる  | Infrastructure                      |
| Use Case で `process.env` を読む         | ビジネスロジックが環境に依存 | Route Handler または Infrastructure |
| `core/` から `infrastructure/` を import | 依存の方向が逆               | Route Handler で DI                 |
| ビジネスルールを Route Handler に書く    | ロジックが散らばる           | Use Case                            |
| Zod なしで body を Use Case に渡す       | 不正な入力が内部に入る       | Route Handler + validators          |

---

## 8. 新機能を追加するときの順番

Chat と同じパターンで、次の順番でファイルを作ります。

| 順番 | 作るもの       | 例                                                      |
| ---- | -------------- | ------------------------------------------------------- |
| 1    | Entity         | `core/domain/feedback.entity.ts`                        |
| 2    | Port           | `core/ports/feedback-repository.port.ts`                |
| 3    | Use Case       | `core/use-cases/submit-feedback.use-case.ts`            |
| 4    | Infrastructure | `infrastructure/database/...`                           |
| 5    | Route Handler  | `app/api/feedback/route.ts`                             |
| 6    | API + Hook     | `lib/api/feedback.ts`, `lib/api/queries/useFeedback.ts` |
| 7    | UI             | `app/_components/feedback-form.tsx`                     |

詳細は [clean-architecture-extension Skill](../.cursor/skills/clean-architecture-extension/SKILL.md) を参照。

---

## 9. ローカルで動かしながら読む

```bash
pnpm install
cp .env.example .env.local   # GEMINI_API_KEY を設定
pnpm dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開き、  
DevTools の **Network** タブで `POST /api/chat` を見ながらコードを追うと理解が深まります。

テストを読むのもおすすめです。

```bash
pnpm test
```

`src/infrastructure/notion/notion-property.builder.spec.ts` など、  
Infrastructure 層の単体テストが「Port の実装が正しいか」を確認する良い例です。

---

## 10. 次に読むもの

| 資料                                                                                | 内容                          |
| ----------------------------------------------------------------------------------- | ----------------------------- |
| [README.md](../README.md)                                                           | プロジェクト概要と Skill 一覧 |
| [architecture-overview Skill](../.cursor/skills/architecture-overview/SKILL.md)     | レイヤー表・ディレクトリ構造  |
| [architectural-rules Skill](../.cursor/skills/architectural-rules/SKILL.md)         | 厳密なルール                  |
| [react-query-api-pattern Skill](../.cursor/skills/react-query-api-pattern/SKILL.md) | フロント ↔ API の標準パターン |

---

## まとめ

- **Domain** = データの形
- **Port** = 外部サービスへの約束（interface）
- **Use Case** = ビジネスロジック（Port だけ知っている）
- **Infrastructure** = Port の具体実装（SDK を使う）
- **Route Handler** = 部品を組み立てる唯一の場所
- **UI + lib/api** = ユーザー操作と API 呼び出し

コードを読むときは **UI から下に降りていく**（上記セクション 5 の順番）と迷いにくいです。
