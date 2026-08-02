# ぷらかん AI フロア (purakan virtual AI office)

ぷらかんのバーチャルオフィスを 3D で表示する、単体で動く HTML です。
マウスのドラッグで回転、ホイールでズームできます。

## 中身

| フロア | 内容 |
| --- | --- |
| ワークフロア | 水槽より手前に 5列 × 2行 = 10席。部門で分けないオープンフロア |
| PM 席 | 奥中央。背面に大型ライブダッシュボード、脇にサーバーラック |
| ぷらかん 社長室 | 左奥。ガラスパーティションの役員室に社長＋秘書、応接ソファ |
| カフェ / 仮眠 | 右奥。L 字カウンター、ペンダント照明、スリープポッド |
| 中央 | フレームレスの大水槽（魚が泳ぐ） |

デザインはグレーのマット床＋ガラスカーテンウォールのモダンな IT オフィス。
社員は社長・秘書・PM・スタッフ 10 名・カフェ 3 名を、髪型／服装／メガネ／表情で
一人ずつ描き分けています。

## 使い方

そのまま見るだけなら `dist/index.html` をブラウザで開くだけです（外部通信なし）。

編集するときは `src/` を触ってからビルドします。

```bash
bash tools/build.sh          # src + vendor → dist/index.html
```

## 構成

```
ai-floor/
├── src/
│   ├── overlay.html   ページの外側（タイトル、フロアガイド、CSS）
│   └── scene.js       3D シーン本体（レイアウト・家具・キャラクター）
├── vendor/            three.js r128 と OrbitControls（インライン埋め込み用）
├── tools/
│   ├── build.sh       上記をまとめて dist/index.html を作る
│   ├── shot.js        全体像のスクリーンショット
│   └── closeup.js     キャラクターの寄りスクリーンショット
└── dist/index.html    ビルド済み。これ 1 枚で動く
```

`src/scene.js` の主な編集ポイント:

- `CEO` / `SEC` / `PM` / `STAFF` / `CAFE_PEOPLE` … 各キャラクターの設定（髪型・服・メガネ・表情）
- `buildHair()` … 髪型のバリエーション
- `ワークフロア` のブロック内 `xs` と `rows` … 席の位置と間隔
- `C` … 床・壁・家具の配色

## スクリーンショット（任意）

Playwright と Chromium が必要です。

```bash
npm install playwright-core
node tools/shot.js       # → shots/shot1.png など
node tools/closeup.js    # → shots/cu-*.png
```
