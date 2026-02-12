// ==========================================
// 抽選実行スクリプト
// ==========================================
//
// 使用方法：
// 1. npm run export で応募者データをエクスポート
// 2. npm run lottery を実行
// 3. 当選者数を入力
// 4. winners.json と losers.json が生成される
//

import fs from 'fs';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// ==========================================
// 質問関数
// ==========================================

function question(query) {
    return new Promise(resolve => {
        rl.question(query, resolve);
    });
}

// ==========================================
// 抽選実行
// ==========================================

async function runLottery() {
    try {
        // applicants.jsonを読み込み
        if (!fs.existsSync('applicants.json')) {
            console.error('❌ エラー: applicants.json が見つかりません');
            console.error('先に npm run export を実行してください');
            process.exit(1);
        }

        const applicants = JSON.parse(
            fs.readFileSync('applicants.json', 'utf8')
        );

        // 未抽選の応募者のみを対象
        const pendingApplicants = applicants.filter(a => a.status === 'pending');

        if (pendingApplicants.length === 0) {
            console.log('⚠️  未抽選の応募者がいません');
            process.exit(0);
        }

        console.log(`📊 未抽選の応募者: ${pendingApplicants.length}名`);
        console.log('');

        // 当選者数を入力
        const winnerCountStr = await question('当選者数を入力してください: ');
        const winnerCount = parseInt(winnerCountStr, 10);

        if (isNaN(winnerCount) || winnerCount <= 0) {
            console.error('❌ エラー: 有効な数値を入力してください');
            process.exit(1);
        }

        if (winnerCount > pendingApplicants.length) {
            console.error(`❌ エラー: 当選者数は${pendingApplicants.length}以下にしてください`);
            process.exit(1);
        }

        console.log('');
        console.log('🎲 抽選を実行中...');

        // Fisher-Yatesアルゴリズムでシャッフル
        const shuffled = [...pendingApplicants];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        // 当選者と落選者に分ける
        const winners = shuffled.slice(0, winnerCount).map(a => ({
            ...a,
            status: 'winner'
        }));

        const losers = shuffled.slice(winnerCount).map(a => ({
            ...a,
            status: 'loser'
        }));

        // ファイルに保存
        fs.writeFileSync(
            'winners.json',
            JSON.stringify(winners, null, 2),
            'utf8'
        );

        fs.writeFileSync(
            'losers.json',
            JSON.stringify(losers, null, 2),
            'utf8'
        );

        console.log('');
        console.log('✅ 抽選完了！');
        console.log(`   - 当選者: ${winners.length}名 (winners.json)`);
        console.log(`   - 落選者: ${losers.length}名 (losers.json)`);
        console.log('');
        console.log('📧 次のステップ:');
        console.log('   1. winners.json を確認して当選者にメールを送信');
        console.log('   2. メール送信完了後、npm run delete-losers で落選者データを削除');

    } catch (error) {
        console.error('❌ エラー:', error);
        process.exit(1);
    } finally {
        rl.close();
    }
}

// 実行
runLottery();
