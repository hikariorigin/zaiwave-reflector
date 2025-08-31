#ZAI-WAVE Reflector (PWA Minimal)

位置に連動してZINEカードが点灯する最小テスト。

## 使い方
1. このリポジトリのルートに `index.html`, `app.js`, `sw.js`, `manifest.webmanifest`, `resonance-spots.geojson` を置く
2. GitHub → Settings → Pages → Deploy from branch → `main` / `/(root)`
3. スマホで公開URLを開く → 「近くをスキャン」 → 位置許可
4. 「ホーム画面に追加」でPWA化（オフライン可）
5. 「通知を許可」で近接時ローカル通知（端末仕様に依存）

## スポット編集
- `resonance-spots.geojson` の `coordinates`（[lon, lat]）, `unlock_at`（ISO）, `payload_url` を編集
- 半径は `app.js` の `RADIUS_M` を変更（例：150 → 50〜300）

## 注意
- GPS衛星から配信は不可（GNSSは受信専用）。配信は通常回線/衛星インターネットで
