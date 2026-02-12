# 🔒 セキュリティガイド

このドキュメントでは、抽選システムのセキュリティ対策について詳しく説明します。

## 🎯 セキュリティの基本方針

1. **最小権限の原則**: 必要最小限の権限のみを付与
2. **データの最小化**: 必要な情報のみを収集
3. **暗号化**: すべての通信はHTTPS
4. **監査**: すべての操作をログに記録
5. **即時削除**: 不要になったデータは速やかに削除

## 🛡️ 実装されているセキュリティ対策

### 1. 認証（Authentication）

#### Firebase Authentication
- **Googleログイン**: OAuth 2.0による安全な認証
- **トークンベース**: JWTトークンで認証状態を管理
- **自動更新**: トークンは自動的に更新される

#### メリット
- パスワード管理不要
- 二段階認証に対応（Googleアカウント側で設定）
- フィッシング対策

### 2. 認可（Authorization）

#### Firestoreセキュリティルール

```javascript
// 作成: 認証済みユーザーが自分のUIDと一致する場合のみ
allow create: if request.auth != null 
              && request.auth.uid == uid
              && request.resource.data.keys().hasAll(['uid', 'name', 'email', 'appliedAt', 'status'])
              && request.resource.data.uid == uid
              && request.resource.data.status == 'pending';
```

**保護内容:**
- ✅ 未認証ユーザーはデータを作成できない
- ✅ 他人のUIDでデータを作成できない
- ✅ 必須フィールドがすべて含まれていることを検証
- ✅ statusは必ず'pending'で作成される

```javascript
// 読み取り: 誰も許可しない
allow read: if false;
```

**保護内容:**
- ✅ フロントエンドから一切データを読み取れない
- ✅ 他の応募者の情報を見ることができない
- ✅ 管理者のみがFirebase Consoleから閲覧可能

```javascript
// 更新・削除: 誰も許可しない
allow update, delete: if false;
```

**保護内容:**
- ✅ 応募後のデータ改ざんを防止
- ✅ 削除はAdmin SDKからのみ可能

### 3. APIキーの保護

#### Google Cloud Consoleでの制限

**HTTPリファラー制限:**
```
your-project.web.app/*
your-project.firebaseapp.com/*
localhost/*
```

**効果:**
- ✅ 許可されたドメインからのみアクセス可能
- ✅ APIキーが漏洩しても他のサイトで使用不可

**API制限:**
- Identity Toolkit API（認証用）
- Cloud Firestore API（データベース用）
- Firebase Installations API（アプリ識別用）

**効果:**
- ✅ 必要最小限のAPIのみ有効
- ✅ 他のGoogle Cloud サービスへの不正アクセスを防止

### 4. データの暗号化

#### 転送中の暗号化
- すべての通信はHTTPS（TLS 1.3）
- Firebase Hostingは自動的にHTTPSを強制

#### 保存時の暗号化
- Firestoreは自動的にデータを暗号化
- AES-256で暗号化

### 5. 個人情報保護

#### 収集する情報
- 氏名（Googleアカウントから取得）
- メールアドレス（Googleアカウントから取得）
- 応募日時（自動記録）

#### 保管期間
- 当選者: メール送信完了まで
- 落選者: 抽選実施後、速やかに削除

#### 第三者提供
- 一切行わない

### 6. スパム対策

#### 1人1回の制限
```javascript
// UIDをドキュメントIDとして使用
doc(db, 'applicants', user.uid)
```

**効果:**
- ✅ 同じGoogleアカウントで複数回応募不可
- ✅ ドキュメントIDの一意性により自動的に保証

#### レート制限
- Firebase Authenticationの標準レート制限
- 同一IPからの大量リクエストを自動ブロック

### 7. 管理者権限の分離

#### フロントエンド
- データの作成のみ可能
- 読み取り・更新・削除は不可

#### Admin SDK（ローカル実行）
- すべての操作が可能
- サービスアカウントキーが必要
- `.gitignore`で秘密鍵を保護

## 🚨 想定される攻撃と対策

### 1. SQLインジェクション
**対策**: NoSQLデータベース（Firestore）を使用。パラメータ化されたクエリのみ。

### 2. XSS（クロスサイトスクリプティング）
**対策**: 
- ユーザー入力はGoogleアカウント情報のみ
- DOMへの直接挿入は`textContent`を使用
- HTMLエスケープ処理

### 3. CSRF（クロスサイトリクエストフォージェリ）
**対策**:
- Firebase Authenticationのトークンベース認証
- Same-Siteクッキー
- HTTPリファラー制限

### 4. データ漏洩
**対策**:
- セキュリティルールで読み取り完全禁止
- APIキーの制限
- HTTPS強制

### 5. 不正応募
**対策**:
- Googleログイン必須
- 1人1回の制限
- UIDベースの重複チェック

### 6. DDoS攻撃
**対策**:
- Firebase Hostingの自動スケーリング
- Cloud Armorによる保護（有料プランで利用可能）
- レート制限

### 7. APIキーの盗用
**対策**:
- HTTPリファラー制限
- API制限
- セキュリティルールによる二重保護

## 📊 セキュリティ監査

### 定期的に確認すべき項目

#### Firebase Console
- [ ] Authenticationのログイン履歴
- [ ] Firestoreの使用量
- [ ] セキュリティルールの変更履歴

#### Google Cloud Console
- [ ] APIキーの制限設定
- [ ] 予算アラート
- [ ] 監査ログ

### 異常検知の指標

#### 注意が必要な兆候
- 短時間に大量の応募
- 同一IPからの複数アカウント作成
- エラー率の急増
- 予想外のAPI使用量

## 🔐 秘密情報の管理

### GitHubにコミットしてはいけないもの

❌ **絶対にコミットしない:**
- `serviceAccountKey.json`（Firebase Admin SDK秘密鍵）
- `.env`ファイル（環境変数）
- `applicants.json`（応募者データ）
- `winners.json`（当選者データ）
- `losers.json`（落選者データ）

✅ **コミットしても問題ないもの:**
- `firebase-config.js`（APIキー）
  - ただし、必ずAPIキーの制限を設定すること

### .gitignoreの確認

```gitignore
# 秘密鍵
serviceAccountKey.json
*-firebase-adminsdk-*.json

# 環境変数
.env
.env.local

# 応募者データ
applicants.json
winners.json
losers.json
```

## 🎓 ベストプラクティス

### 1. 最小権限の原則
- 必要な権限のみを付与
- フロントエンドからは読み取り不可

### 2. 深層防御
- 複数のセキュリティ層を実装
- APIキー制限 + セキュリティルール

### 3. 監査とログ
- すべての操作を記録
- 定期的にログを確認

### 4. データの最小化
- 必要な情報のみを収集
- 不要になったら速やかに削除

### 5. 暗号化
- 転送中: HTTPS
- 保存時: Firestoreの自動暗号化

### 6. 定期的な見直し
- セキュリティルールの定期的な監査
- 依存関係の更新

## 📞 インシデント対応

### データ漏洩が疑われる場合

1. **即座に対応**
   - Firebase Authenticationを無効化
   - Firestoreへのアクセスを一時停止

2. **調査**
   - 監査ログを確認
   - 影響範囲を特定

3. **通知**
   - 影響を受けたユーザーに通知
   - 必要に応じて監督機関に報告

4. **再発防止**
   - セキュリティルールの見直し
   - 追加の保護措置を実装

### 不正アクセスが検知された場合

1. **APIキーの再生成**
2. **セキュリティルールの強化**
3. **監査ログの分析**
4. **影響を受けたデータの確認**

## 🔍 セキュリティチェックリスト

### 公開前
- [ ] Firestoreセキュリティルールが設定されている
- [ ] APIキーの制限が設定されている
- [ ] `.gitignore`が正しく設定されている
- [ ] HTTPS強制が有効
- [ ] プライバシーポリシーが表示されている

### 運用中
- [ ] 定期的に監査ログを確認
- [ ] 予算アラートを設定
- [ ] 異常なアクセスパターンを監視
- [ ] 依存関係を最新に保つ

### 抽選後
- [ ] 落選者データを削除
- [ ] 当選者データのバックアップ
- [ ] 監査ログの保存

## 📚 参考資料

- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Google Cloud Security Best Practices](https://cloud.google.com/security/best-practices)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**最終更新**: 2026年2月12日  
**バージョン**: 1.0.0
