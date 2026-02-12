// ==========================================
// 応募者データエクスポートスクリプト
// ==========================================
//
// 使用方法：
// 1. Firebase Console > プロジェクト設定 > サービスアカウント
// 2. 「新しい秘密鍵の生成」をクリック
// 3. ダウンロードしたJSONファイルを serviceAccountKey.json として保存
// 4. npm run export を実行
//

import admin from 'firebase-admin';
import fs from 'fs';

// Firebase Admin初期化
try {
    const serviceAccount = JSON.parse(
        fs.readFileSync('./serviceAccountKey.json', 'utf8')
    );

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    console.log('✅ Firebase Admin SDK初期化完了');
} catch (error) {
    console.error('❌ エラー: serviceAccountKey.json が見つかりません');
    console.error('Firebase Consoleからサービスアカウントキーをダウンロードしてください');
    process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

// ==========================================
// 応募者データのエクスポート
// ==========================================

async function exportApplicants() {
    try {
        console.log('📥 応募者データを取得中...');

        const snapshot = await db.collection('applicants').get();

        if (snapshot.empty) {
            console.log('⚠️  応募者データが見つかりません');
            return;
        }

        const applicants = [];

        console.log('👤 ユーザー情報を取得中...');

        for (const doc of snapshot.docs) {
            const data = doc.data();

            // Firebase Authenticationからユーザー情報を取得
            try {
                const userRecord = await auth.getUser(doc.id);

                applicants.push({
                    uid: doc.id,
                    name: userRecord.displayName || '名前未設定',
                    email: userRecord.email || 'メールアドレス未設定',
                    phoneHash: data.phoneHash || '',
                    appliedAt: data.appliedAt?.toDate().toISOString(),
                    status: data.status || 'pending'
                });
            } catch (authError) {
                console.warn(`⚠️  ユーザー ${doc.id} の情報取得に失敗:`, authError.message);
                // Authenticationにユーザーが存在しない場合もデータは保持
                applicants.push({
                    uid: doc.id,
                    name: '取得失敗',
                    email: '取得失敗',
                    phoneHash: data.phoneHash || '',
                    appliedAt: data.appliedAt?.toDate().toISOString(),
                    status: data.status || 'pending'
                });
            }
        }

        // JSONファイルに保存
        fs.writeFileSync(
            'applicants.json',
            JSON.stringify(applicants, null, 2),
            'utf8'
        );

        console.log(`✅ ${applicants.length}件の応募者データをエクスポートしました`);
        console.log('📄 ファイル: applicants.json');

        // 統計情報を表示
        const pending = applicants.filter(a => a.status === 'pending').length;
        const winners = applicants.filter(a => a.status === 'winner').length;
        const losers = applicants.filter(a => a.status === 'loser').length;

        console.log('\n📊 統計情報:');
        console.log(`   - 未抽選: ${pending}件`);
        console.log(`   - 当選: ${winners}件`);
        console.log(`   - 落選: ${losers}件`);

    } catch (error) {
        console.error('❌ エクスポート中にエラーが発生しました:', error);
        process.exit(1);
    }
}

// 実行
exportApplicants()
    .then(() => {
        console.log('\n✨ エクスポート完了');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ エラー:', error);
        process.exit(1);
    });
