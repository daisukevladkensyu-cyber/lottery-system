# ✅ 企画管理機能 実装完了

## 🎉 実装された機能

### 1. 管理画面（admin.html）
- ✅ 管理者認証（Googleログイン + メールアドレスチェック）
- ✅ 企画の作成・編集・削除
- ✅ 企画一覧の表示（応募者数付き）
- ✅ QRコード自動生成
- ✅ URLコピー機能
- ✅ QRコード画像ダウンロード

### 2. 応募ページ（index.html）
- ✅ URLパラメータから企画IDを取得
- ✅ 企画情報の表示（企画名・説明）
- ✅ 企画ごとの応募データ保存
- ✅ 企画ごとの重複チェック
- ✅ 企画の有効期限チェック

### 3. セキュリティ
- ✅ 管理者権限チェック（Firestoreルール）
- ✅ 企画情報は誰でも読み取り可能
- ✅ 応募データは本人と管理者のみアクセス可能
- ✅ 個人情報（氏名・メール）は保存しない

---

## 📁 作成・更新されたファイル

### 新規作成
1. **admin.html** - 管理画面のHTML
2. **admin.js** - 管理画面のJavaScript
3. **admin-styles.css** - 管理画面のCSS
4. **CAMPAIGN_MANAGEMENT.md** - 実装ガイド

### 更新
1. **firestore.rules** - 企画管理対応のセキュリティルール
2. **app.js** - 企画ID対応に変更
3. **index.html** - 企画情報表示要素を追加

---

## 🚀 使用方法

### ステップ1: Firestoreセキュリティルールをデプロイ

1. Firebase Console → Firestore Database → ルール
2. `firestore.rules` の内容をコピー＆ペースト
3. **管理者のメールアドレスを設定**:
   ```javascript
   function isAdmin() {
     return request.auth != null && 
            request.auth.token.email in [
              'your-admin-email@gmail.com'  // ← ここを変更
            ];
   }
   ```
4. 「公開」をクリック

### ステップ2: ファイルをGitHubにアップロード

以下のファイルをすべてアップロード：
- `admin.html`
- `admin.js`
- `admin-styles.css`
- `app.js`（更新版）
- `index.html`（更新版）
- `firestore.rules`（更新版）

### ステップ3: 管理画面にアクセス

```
https://your-domain.com/admin.html
```

1. Googleアカウントでログイン
2. 管理者として登録されたメールアドレスでログイン

### ステップ4: 企画を作成

1. 「+ 新しい企画を作成」をクリック
2. 企画情報を入力:
   - 企画名: 例「夏のキャンペーン」
   - 説明: 例「夏限定の特別キャンペーン」
   - 開始日時: 例「2026-02-12 00:00」
   - 終了日時: 例「2026-03-31 23:59」
   - 当選者数: 例「10」
3. 「保存」をクリック

### ステップ5: QRコードを生成

1. 企画カードの「📱 QRコード」ボタンをクリック
2. QRコードが自動生成される
3. 以下のいずれかを実行:
   - 「URLをコピー」→ SNSやメールで共有
   - 「QRコードをダウンロード」→ ポスターやチラシに印刷

### ステップ6: 応募ページのURL

```
https://your-domain.com/?campaign=企画ID
```

例:
```
https://daisukevladkensyu-cyber.github.io/lottery-system/?campaign=abc123xyz
```

---

## 📊 データ構造

### campaigns コレクション
```javascript
{
  id: "abc123xyz",  // ドキュメントID（自動生成）
  name: "夏のキャンペーン",
  description: "夏限定の特別キャンペーン",
  startDate: Timestamp(2026-02-12 00:00:00),
  endDate: Timestamp(2026-03-31 23:59:59),
  maxWinners: 10,
  status: "active",
  createdBy: "admin@example.com",
  createdAt: Timestamp(2026-02-12 13:00:00)
}
```

### applicants コレクション
```javascript
{
  id: "abc123xyz_user123",  // {campaignId}_{uid}
  campaignId: "abc123xyz",
  uid: "user123",
  phoneHash: "a1b2c3d4e5f6...",
  appliedAt: Timestamp(2026-02-12 14:00:00),
  status: "pending"  // "pending" | "winner" | "loser"
}
```

---

## 🔐 セキュリティ設定

### 管理者の追加

`firestore.rules` の以下の部分を編集：

```javascript
function isAdmin() {
  return request.auth != null && 
         request.auth.token.email in [
           'admin1@gmail.com',
           'admin2@gmail.com',
           'admin3@gmail.com'
         ];
}
```

### セキュリティルールの概要

| コレクション | 読み取り | 作成 | 更新 | 削除 |
|------------|---------|------|------|------|
| campaigns | 誰でも | 管理者のみ | 管理者のみ | 管理者のみ |
| applicants | 本人+管理者 | 本人のみ | 管理者のみ | 管理者のみ |

---

## 🎯 次のステップ

### 1. 管理者スクリプトの更新

企画ごとの抽選を実行できるように、`scripts/export-applicants.js` と `scripts/lottery.js` を更新する必要があります。

### 2. テスト

1. 管理画面で企画を作成
2. QRコードを生成
3. 応募ページにアクセス（URLパラメータ付き）
4. 応募を実行
5. 管理画面で応募者数を確認

### 3. デプロイ

すべてのファイルをGitHub Pagesにデプロイ

---

## 🐛 トラブルシューティング

### 問題1: 管理画面にアクセスできない

**原因**: 管理者として登録されていない

**解決方法**:
1. `firestore.rules` の `isAdmin()` 関数を確認
2. 自分のメールアドレスが含まれているか確認
3. Firestoreルールを再デプロイ

### 問題2: 企画が表示されない

**原因**: URLに企画IDが含まれていない

**解決方法**:
- 正しいURL形式を使用: `?campaign=企画ID`

### 問題3: 応募できない

**原因**: 企画の有効期限外

**解決方法**:
- 管理画面で企画の開始日時・終了日時を確認
- 必要に応じて編集

---

## 📝 今後の拡張案

1. **統計ダッシュボード**
   - 企画ごとの応募者数グラフ
   - 日別応募数の推移

2. **メール通知**
   - 応募完了メール
   - 当選通知メール

3. **応募者管理**
   - 応募者リストのエクスポート
   - 応募者の検索・フィルター

4. **複数商品対応**
   - 企画内で複数の商品を設定
   - 商品ごとの当選者数設定

---

**実装完了日**: 2026年2月12日  
**バージョン**: 4.0.0（企画管理機能完全版）
