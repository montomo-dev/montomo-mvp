# モンとも MVP

ブラウザで動く、モンスター育成RPGです。森・裏の世界・海・雪原・砂漠・工場・魔王城の7ワールドを冒険します。

## 遊びの流れ

1. フィールドを歩く
2. 草むらでモンスターと出会う
3. バトルでHPを減らして仲間に誘う(相性・状態異常もあり)
4. なかまにした個体は手持ちか牧場かを選べる
5. レベルを上げて進化させる、または配合で新しい個体を生み出す
6. 各ワールドの街でどうぐや・まきば・宿屋を利用しつつ、次のワールドへ

## ファイルの見かた

- `index.html`
  ゲーム画面の入口です。Canvas と読み込みスクリプトだけがあります。
- `css/style.css`
  画面の配置や文字まわりの見た目を担当します。
- `js/main.js`
  ゲーム全体の司令塔です。タイトル、フィールド、バトルなどの画面切り替えとミュート操作を管理します。
- `js/input.js`
  キーボード・タッチ入力をまとめています。キーの追加や変更をしたいときはここを見ます。
- `js/audio.js`
  Web Audio APIでの効果音生成(外部音源ファイルなし)。攻撃音・鳴き声・レベルアップ音などはここです。
- `js/data/monsters.js`
  モンスターの名前、色、成長、仲間になりやすさ、進化、配合専用個体を定義しています。数値調整はまずここです。
- `js/data/skills.js`
  スキル名、威力、命中率、タイプを管理しています。
- `js/data/types.js`
  13属性の相性表と、全モンスターのタイプ割り当てです。
- `js/data/flavor.js`
  図鑑用のフレーバーテキスト(生態・性格の説明文)です。
- `js/data/items.js`
  道具の効果・種類を管理しています。
- `js/data/stages.js`
  全7ワールド・各ワールドの街・タイル種別・出現レベル・移動先を管理しています。
- `js/sprites.js`
  モンスターとプレイヤーの見た目を Canvas で描いています。見た目を変えたいときの中心です。
- `js/scenes/title.js`
  タイトル画面です。最初の見せ方や案内文はここで調整できます。
- `js/scenes/field.js`
  マップ、移動、エンカウント、ワールドごとの地形演出・パーティクル、フィールドHUDを担当します。
- `js/scenes/battle.js`
  ターン制バトルの本体です。攻撃、スキル、タイプ相性、状態異常、勧誘、逃走の流れが入っています。
- `js/scenes/party.js`
  手持ちの確認、先頭変更、配合(親は消費される)、逃がす処理を担当します。
- `js/scenes/ranch.js`
  手持ちと牧場の出し入れを担当します。
- `js/scenes/shop.js`
  どうぐやでの売買を担当します。
- `js/scenes/pokedex.js`
  見つけたモンスターの一覧と、Zキーで開ける詳細(フレーバーテキスト付き)を表示します。
- `js/scenes/choice.js`
  ワールドクリア後の分岐選択を担当します。
- `js/scenes/ending.js`
  ボス撃破後の締め画面です。
- `js/systems/growth.js`
  経験値、レベルアップ、進化の計算があります。
- `js/systems/party.js`
  パーティ人数、並び替え、牧場への出し入れを担当します。
- `js/systems/breeding.js`
  配合の結果や色違い演出を作っています。
- `js/systems/rank.js`
  モンスターのE〜Sランク判定です。
- `js/systems/status.js`
  やけど・まひ・こおりの状態異常の付与と処理です。
- `js/systems/dex.js`
  図鑑の seen / caught を更新します。
- `js/systems/save.js`
  セーブデータを `localStorage` に保存します。

## よく触る場所

- 新しいモンスターを足したい
  `js/data/monsters.js`・`js/sprites.js`・`js/data/types.js`・`js/data/flavor.js`
- バトルのテンポやタイプ相性・状態異常を変えたい
  `js/scenes/battle.js`・`js/data/types.js`・`js/systems/status.js`
- マップや草むら、街の位置を変えたい
  `js/data/stages.js` と `js/scenes/field.js`
- 成長曲線を変えたい
  `js/systems/growth.js`
- 効果音を変えたい
  `js/audio.js`

## ローカル確認

`npm start` を実行し、`http://127.0.0.1:3461` をブラウザで開きます。外部依存のインストールは不要です。

`npm test` で既存のゲームルール・セーブ互換性と、新しい目的案内・移動・入力・バトル演出を検証します。

## ゲーム開発スキルを用いた改修

`awesome-gamedev-agent-skills` の内容を導入前に確認し、7スキルを `.agents/skills/` にプロジェクト限定で導入しています。取得元・固定コミット・ファイルハッシュは `.agents/skills/gamedev-skills.lock.json`、確認内容は [導入レビュー](docs/gamedev-skills-review.md) に記録しています。

- 冒険手帳をテーマにしたタイトルとレスポンシブ画面。タイトルのセーブ選択・確認はタップにも対応。
- 描画だけを補間する滑らかな移動と、進行に応じた次の目的表示。
- ダメージ・回復メッセージに連動する数値と短い反応。演出軽減設定とOSの設定に対応。
- 名前入力を取り消しても既存セーブを維持。3スロットと従来の保存形式を継続。

矢印キーで移動、Z / Enter で決定、X / Escape でもどります。スマートフォンでは十字・決定ボタンを使えます。

## itch.io配布用ビルド

`npm run build:itch` を実行すると、`dist/montomo-itch.zip` に配布用ファイル(index.html/css/js/assets)がまとまります。itch.io のHTMLゲームとしてアップロードできます。
