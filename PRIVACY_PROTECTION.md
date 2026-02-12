# 🔒 個人情報保護対策ガイド

## 📊 データベースに保存されるデータ

### ✅ 現在の構成（安全）

```javascript
{
  uid: "abc123...",              // Firebase認証ID
  phoneHash: "a1b2c3d4e5f6...",  // ハッシュ化された電話番号（64文字）
  appliedAt: Timestamp,          // 応募日時
  status: "pending"              // 抽選状態（pending/winner/loser）
}
```

### ❌ 保存されないデータ

- **氏名（name）** - 個人情報
- **メールアドレス（email）** - 個人情報
- **電話番号（phone）** - 個人情報（ハッシュ化された値のみ保存）

---

## 🛡️ セキュリティ対策

### 1. 個人情報の分離

**Firestore（応募データ）:**
- UID
- 電話番号ハッシュ
- 応募日時
- 抽選状態

**Firebase Authentication（ユーザー情報）:**
- 氏名
- メールアドレス
- Googleアカウント情報

### 2. メリット

✅ **データ漏洩リスクの最小化**
- Firestoreが漏洩しても、個人を特定できない
- UIDと電話番号ハッシュだけでは意味がない

✅ **プライバシー保護**
- 必要最小限のデータのみ保存
- 個人情報は分散管理

✅ **当選連絡は可能**
- Firebase Authenticationから当選者のメールアドレスを取得
- 管理者スクリプトで自動的に結合

---

## 📋 Firestoreセキュリティルールの強化

### 個人情報の保存を明示的に禁止

```javascript
allow create: if request.auth != null 
              && request.auth.uid == uid
              && request.resource.data.keys().hasAll(['uid', 'phoneHash', 'appliedAt', 'status'])
              && request.resource.data.uid == uid
              && request.resource.data.status == 'pending'
              && request.resource.data.phoneHash is string
              && request.resource.data.phoneHash.size() == 64
              && !request.resource.data.keys().hasAny(['name', 'email', 'phone']);  // ← 個人情報の保存を禁止
```

### 禁止されているフィールド

- ❌ `name` - 氏名
- ❌ `email` - メールアドレス
- ❌ `phone` - 電話番号（ハッシュ化されていない）

これらのフィールドを含むデータは、**自動的に拒否**されます。

---

## 🔧 管理者用スクリプトの変更

### エクスポートスクリプト（export-applicants.js）

**変更前:**
```javascript
// Firestoreから氏名とメールアドレスを取得
const data = doc.data();
applicants.push({
  uid: doc.id,
  name: data.name,        // ← Firestoreから取得（存在しない）
  email: data.email,      // ← Firestoreから取得（存在しない）
  ...
});
```

**変更後:**
```javascript
// Firebase Authenticationから氏名とメールアドレスを取得
const userRecord = await auth.getUser(doc.id);
applicants.push({
  uid: doc.id,
  name: userRecord.displayName,   // ← Authenticationから取得
  email: userRecord.email,        // ← Authenticationから取得
  phoneHash: data.phoneHash,      // ← Firestoreから取得
  ...
});
```

### エクスポートされるデータ

```json
{
  "uid": "abc123...",
  "name": "山田太郎",
  "email": "yamada@example.com",
  "phoneHash": "a1b2c3d4e5f6...",
  "appliedAt": "2026-02-12T10:00:00.000Z",
  "status": "pending"
}
```

---

## 🧪 テスト方法

### テスト1: 正常な応募

1. サイトにアクセス
2. Googleログイン
3. 電話番号を入力
4. 「応募する」をクリック
5. ✅ 応募完了

### テスト2: Firestoreのデータ確認

1. Firebase Console → Firestore Database
2. `applicants` コレクションを開く
3. ✅ 以下のフィールドのみ存在することを確認：
   - `uid`
   - `phoneHash`
   - `appliedAt`
   - `status`
4. ❌ 以下のフィールドが**存在しない**ことを確認：
   - `name`
   - `email`
   - `phone`

### テスト3: エクスポートスクリプト

```powershell
npm run export
```

1. ✅ `applicants.json` が作成される
2. ✅ 氏名とメールアドレスが含まれている
3. ✅ Firebase Authenticationから取得されている

---

## 📊 データフロー図

```
┌─────────────────┐
│  ユーザー入力   │
│  - 氏名         │
│  - メール       │
│  - 電話番号     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  Firebase Authentication    │
│  - 氏名（保存）             │
│  - メール（保存）           │
│  - UID（生成）              │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  アプリケーション           │
│  - 電話番号をハッシュ化     │
│  - UIDと紐付け              │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Firestore Database         │
│  - UID（保存）              │
│  - phoneHash（保存）        │
│  - appliedAt（保存）        │
│  - status（保存）           │
│  ❌ 氏名・メール（保存しない）│
└─────────────────────────────┘
```

---

## 🚀 デプロイ手順

### 1. Firestoreセキュリティルールの更新

Firebase Console → Firestore Database → ルール

`firestore.rules` の内容をコピー＆ペーストして「公開」

### 2. ファイルをGitHubにアップロード

```powershell
# 変更されたファイル:
# - app.js (個人情報の保存を削除)
# - firestore.rules (個人情報の保存を禁止)
# - scripts/export-applicants.js (Authenticationから取得)
```

### 3. 既存データの削除（推奨）

もし既に個人情報を含むデータが保存されている場合：

```powershell
npm run delete-all
```

⚠️ **注意**: すべての応募データが削除されます

---

## 🔐 セキュリティチェックリスト

- [ ] Firestoreに個人情報（氏名・メール）が保存されていない
- [ ] セキュリティルールで個人情報の保存が禁止されている
- [ ] 電話番号はハッシュ化されている
- [ ] エクスポートスクリプトがAuthenticationから情報を取得している
- [ ] 既存の個人情報を含むデータを削除した

---

## 💡 よくある質問

### Q1: 当選者にどうやって連絡しますか？

**A:** 管理者スクリプト（`npm run export`）を実行すると、Firebase Authenticationから自動的にメールアドレスを取得します。

### Q2: Firestoreが漏洩したらどうなりますか？

**A:** UIDと電話番号ハッシュのみなので、個人を特定することはできません。

### Q3: 既に保存されている個人情報はどうすればいいですか？

**A:** `npm run delete-all` ですべてのデータを削除し、新しいルールで再度応募を受け付けてください。

---

**最終更新**: 2026年2月12日  
**バージョン**: 3.0.0（個人情報保護強化版）
