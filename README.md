# HTML Studio

Canvaのように見たまま編集できる、日本語のHTMLエディターです。GitHub Pagesで動作する静的サイトです。

- パーツの追加、ドラッグ移動、サイズ変更
- 文字、色、リンク、配置、重なり順の編集
- ローカル画像の読み込み（8MB以下）
- 元に戻す・やり直す、キーボード移動
- プレビュー、単体HTMLへの書き出し
- JSONプロジェクトの保存・読み込み
- 縦長ページのスクロール（最大5,000px）と画面内に収める表示
- 移動・サイズ変更・数値入力・読み込み・ページ縮小時の枠内制限
- クリックゲーム／よけゲームの配置、制限時間・難易度の編集

編集内容は自動保存されません。「プロジェクトを保存」で保存してください。自由配置のHTMLは小さい画面でページ全体を縮小します。ブロックの自動再配置は行いません。

ページ設定の「ページを下に延長」で縦長にできます。「長いページを縦にスクロール」をオフにすると縦横とも画面内に収まります。パーツの位置とサイズはページの境界で制限されます。

「ゲームエリアを追加」でゲームを配置し、右パネルで種類・タイトル・制限時間・難易度を変更します。プレビューと書き出した単体HTMLで遊べます。よけゲームは左右キー・左右ボタン・タッチ操作に対応。ゲームは用意された2種類のルールを調整する方式です。

GitHub Pages: Settings → Pages → Deploy from a branch → main / (root)

## コードでゲームを作る

「JS / Pythonで作る」でパーツを追加し、「コードを編集」を開きます。650msの入力待ち後にプレビューを再実行します。自動実行はオフにもでき、Ctrl+Enterで手動実行できます。サンプル置換は現在のコードを置き換えます。プロジェクト保存にはソースと言語も含まれます。

- JavaScriptとPythonで共通の `game.*` API（描画、スプライト、入力、矩形の当たり判定、重力、タイマー、得点、音、シーン、ボタン）
- `react.start("game1")` / `react.stop("game1")` で指定IDの更新・描画を再開／一時停止。ID省略は自分自身。Reactフレームワークとは別の専用APIです。
- `game.button("start", "開始", () => react.start("game1"))` でJSボタンを登録。Pythonは `game.button("start", "開始", lambda: react.start("game1"))`。
- ページの通常ボタンにも、対象プログラムIDによる開始／停止、`react.on("名前", 関数)` のイベント実行を設定できます。
- 全ページプレビューで複数IDの連携を確認できます。コード編集横のプレビューは選択中のプログラムだけです。
- 構文／実行時エラーの行を赤く表示します。行を特定できない読み込み・タイムアウトの問題は原因のみ表示します。すべての論理的なバグを自動検出するものではありません。
- コードはWorkerで実行し、無限ループ等で応答しない場合は停止します。DOM操作やサーバー側Pythonは対象外です。
- PythonはPyodide 0.27.7をCDNから読み込むため、初回および書き出し先でインターネット接続が必要です。JSコードゲームは単体HTMLで実行できます。

## マウス・ショートカット

左ボタンを350ms長押しで選択、ドラッグで移動。短いクリックも選択に使えます。パーツを右クリックすると削除、Ctrl+Zで戻せます。Ctrl+C／Vでパーツをコピー／貼り付けます（同じエディター内のクリップボード）。入力欄・コード欄では通常のテキスト操作を優先します。

入力候補：game. / react. / game.mouse.、JS・Pythonの基本構文、コード内で宣言した名前を候補表示します。↑↓で選択、Enter/Tabで挿入、Escで閉じる、Ctrl+Spaceで候補を再表示。APIには引数と日本語説明が付き、挿入形式は言語に合わせます。静的な候補補完であり、外部ライブラリーの型解析には対応しません。

余白を左クリックで350ms長押ししてからドラッグ（またはそのままドラッグ）すると、紫色の選択範囲に重なるパーツを複数選択できます。選択中のパーツをドラッグして一括移動。配置間隔を保って全体がページの端で止まります。Ctrl+C/V、右クリック削除、Delete、矢印キー、複製は複数選択に対応し、編集はCtrl+Zで一括で戻せます。余白クリック／Escで解除。パーツの上から始めるドラッグは移動です。

引数アシスト：game.sprite({...})のオブジェクト／Python辞書内でx,y,w,h,vx,vy,gravity,color,image,tag,visibleを補完。game.spriteで定義したplayer等の変数のドット入力でも候補を表示します。game.*／react.*の括弧内にカーソルを置くと引数入力パネルが開き、数値・テキスト・真偽値を入力するだけでコードを自動更新します。引用符・カンマ・PythonのTrue/Falseは自動生成。関数や変数は「式」で指定し、既存の式や独自プロパティは保持します。独自関数・外部ライブラリーの引数フォームは対象外です。

引数の説明：候補一覧と引数入力欄に、各項目の意味・単位・入力例を表示します。同じx/yでも円の中心、四角形の左上、文字のベースラインなど呼び出す関数に合わせて説明。速度・重力にはphysicsの必要性、visibleには描画以外は停止しないことも表示します。

テキスト / HTML欄ではb,strong,i,em,u,s,del,mark,small,sub,sup,br,span,p,div,h1〜h6,ul,ol,li,blockquote,pre,code,hrで書式を編集できます。文字色・背景色・文字サイズなどのインラインstyleに対応。キャンバスとHTML書き出しで同じ書式を使用します。script、イベント属性、iframe、位置指定CSSはこの欄では適用しません。ゲームのコードは専用エディターで編集します。

## Cloud project storage

Projects and exported HTML are saved in Supabase `studio_projects`. The page remains on GitHub Pages. `cloud-config.js` contains only the browser-safe publishable key; never put a secret/service-role key there.

- Sign up / sign in from 保存した作品 (HTML Studio accounts are separate from the Supabase dashboard account).
- The first クラウドに保存 creates a private project; later edits autosave after 1.2 seconds.
- Open a saved project on another device using the same HTML Studio account.
- Updates match the last known revision. A conflicting write is rejected; 別の作品として保存 preserves the current draft.
- Unsaved changes prompt before leaving. File backup/import and HTML download remain available.
- Current email delivery uses Supabase's default SMTP: new-user confirmation email is restricted to addresses belonging to the project's organization. Configure custom SMTP before opening signups to arbitrary addresses. Email confirmation stays enabled.
- Project reference: bbgahsmqhijjsvnbfchi. Site URL: https://rippy0311-afk.github.io/html-studio/
- Vendor SDK: @supabase/supabase-js 2.57.4, MIT license in vendor/supabase-LICENSE.txt.

Validation: `node tests/cloud-store.cjs`. A transaction rolled back in the live SQL editor verified owner save/read/update, revision increment, stale-write rejection, cross-owner read/update/insert denial, and anonymous privilege denial. Browser UI tests used a local mock to verify reload restore, listing, cross-tab conflicts, and save-as-copy. Actual user email confirmation/sign-in requires the user to register their own account; it has not been claimed as tested.

Docs: https://supabase.com/docs/guides/auth/auth-smtp and https://supabase.com/docs/guides/database/postgres/row-level-security

## テキストモード

画面上部の「制作モード」で「テキストモード」を選択します。入力とプレビューは黒背景・白文字。レイアウトのパーツは保持され、モードを戻すと編集を再開できます。保存ファイル・クラウド保存にはモードとソースを含め、HTML書き出しは選択中のモードを出力します。

```text
"HELLO WORLD"
[HELLO<changeTo('\"こんにちは！\"')>]
```

- `"..."` は文字、`[...]` はボタン、`<...>` はJavaScriptです。
- ボタン内のスクリプトはクリック時、それ以外は画面の初期表示時に実行します。
- `changeTo(source)` は画面全体を同じ記法のソースに置き換えます。`changeTo("")` は空の画面にします。切り替え時にスクリプトの変数はリセットされます。
- ソースの改行は表示にも反映。文字列では `\"`、`\\`、`\n`、`\t` が使えます。
- スクリプト内の比較演算 `>` は括弧内に書きます（例：`if (n > 0) { ... }`）。
- 「実行 / 最初から」または Ctrl+Enter で再実行。「停止」で実行環境を破棄します。
- JavaScriptは専用Workerで実行し、編集画面のDOMや保存情報には触れません。同期処理が2.5秒を超えると停止します。外部ライブラリやDOM APIは提供しません。

### 名前付きの処理

```text
{class{hello{
  <changeTo('"こんにちは！"')>
}}}
"HELLO WORLD"
[HELLO<hello()>]
```

`{class{名前{<処理>}}}` は処理を定義します。定義だけでは実行せず、`<名前()>` や `[ボタン<名前()>]` から呼び出します。複数の `<処理>`、処理同士の呼び出しにも対応。名前は英字・`_`・`$`で始め、以降は英数字・`_`・`$`を使用します。重複名・予約語・`changeTo` は定義できません。定義の有効範囲は現在の画面です。
