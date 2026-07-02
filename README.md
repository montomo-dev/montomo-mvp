# モンとも MVP

ブラウザで動く、小さなモンスター育成RPGです。

## 遊びの流れ

1. フィールドを歩く
2. 草むらでモンスターと出会う
3. バトルでHPを減らして仲間に誘う
4. レベルを上げて進化させる

## ファイルの見かた

- `index.html`
  ゲーム画面の入口です。Canvas と読み込みスクリプトだけがあります。
- `css/style.css`
  画面の配置や文字まわりの見た目を担当します。
- `js/main.js`
  ゲーム全体の司令塔です。タイトル、フィールド、バトルなどの画面切り替えを管理します。
- `js/input.js`
  キーボード入力をまとめています。キーの追加や変更をしたいときはここを見ます。
- `js/data/monsters.js`
  モンスターの名前、色、成長、仲間になりやすさを定義しています。数値調整はまずここです。
- `js/data/skills.js`
  スキル名、威力、命中率を管理しています。
- `js/sprites.js`
  モンスターとプレイヤーの見た目を Canvas で描いています。見た目を変えたいときの中心です。
- `js/scenes/title.js`
  タイトル画面です。最初の見せ方や案内文はここで調整できます。
- `js/scenes/field.js`
  マップ、移動、エンカウント、フィールドHUDを担当します。草むらや泉の挙動もここです。
- `js/scenes/battle.js`
  ターン制バトルの本体です。攻撃、スキル、勧誘、逃走の流れが入っています。
- `js/scenes/party.js`
  手持ちの確認、先頭変更、配合、逃がす処理を担当します。
- `js/scenes/ranch.js`
  手持ちと牧場の出し入れを担当します。
- `js/scenes/pokedex.js`
  見つけたモンスターの一覧を表示します。
- `js/scenes/ending.js`
  ボス撃破後の締め画面です。
- `js/systems/growth.js`
  経験値、レベルアップ、進化の計算があります。
- `js/systems/party.js`
  パーティ人数、並び替え、牧場への出し入れを担当します。
- `js/systems/breeding.js`
  配合の結果や色違い演出を作っています。
- `js/systems/dex.js`
  図鑑の seen / caught を更新します。
- `js/systems/save.js`
  セーブデータを `localStorage` に保存します。

## よく触る場所

- 新しいモンスターを足したい
  `js/data/monsters.js` と `js/sprites.js`
- バトルのテンポを変えたい
  `js/scenes/battle.js`
- マップや草むらの位置を変えたい
  `js/scenes/field.js`
- 成長曲線を変えたい
  `js/systems/growth.js`

## ローカル確認

`serve.py` を使ってローカルサーバーを立て、ブラウザで開いて確認します。
