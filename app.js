// ==========================================
// メインアプリケーションロジック
// ==========================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    signOut
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDoc,
    query,
    where,
    getDocs,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

import { firebaseConfig } from './firebase-config.js';

// ==========================================
// Firebase初期化
// ==========================================

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ==========================================
// 企画IDの取得
// ==========================================

const urlParams = new URLSearchParams(window.location.search);
const campaignId = urlParams.get('campaign');

console.log('📋 企画ID:', campaignId || 'なし（デフォルト）');

// 企画IDがない場合はエラー
if (!campaignId) {
    console.error('❌ 企画IDが指定されていません');
    // デフォルト企画IDを使用するか、エラー画面を表示
}

let currentCampaign = null;

// ==========================================
// DOM要素の取得
// ==========================================

const screens = {
    loading: document.getElementById('loading'),
    login: document.getElementById('login-screen'),
    application: document.getElementById('application-screen'),
    success: document.getElementById('success-screen'),
    error: document.getElementById('error-screen'),
    alreadyApplied: document.getElementById('already-applied-screen')
};

const elements = {
    googleLoginBtn: document.getElementById('google-login-btn'),
    submitBtn: document.getElementById('submit-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    logoutAlreadyBtn: document.getElementById('logout-already-btn'),
    closeBtn: document.getElementById('close-btn'),
    retryBtn: document.getElementById('retry-btn'),
    userName: document.getElementById('user-name'),
    userEmail: document.getElementById('user-email'),
    phoneNumber: document.getElementById('phone-number'),
    errorMessage: document.getElementById('error-message')
};

// ==========================================
// 画面制御
// ==========================================

function showScreen(screenName) {
    console.log('🖥️ 画面遷移:', screenName);

    // すべての画面を非表示
    Object.values(screens).forEach(screen => {
        if (screen) {
            screen.classList.add('hidden');
        }
    });

    // 指定された画面を表示
    if (screens[screenName]) {
        screens[screenName].classList.remove('hidden');
        console.log('✅ 画面表示完了:', screenName);
    } else {
        console.error('❌ 画面が見つかりません:', screenName);
    }
}

function showError(message) {
    elements.errorMessage.textContent = message;
    showScreen('error');
}

// ==========================================
// 電話番号のハッシュ化
// ==========================================

// 電話番号を正規化（ハイフンと空白を削除）
function normalizePhoneNumber(phone) {
    return phone.replace(/[-\s]/g, '');
}

// SHA-256ハッシュ化
async function hashPhoneNumber(phone) {
    const normalized = normalizePhoneNumber(phone);
    const encoder = new TextEncoder();
    const data = encoder.encode(normalized);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// 電話番号のバリデーション
function validatePhoneNumber(phone) {
    const normalized = normalizePhoneNumber(phone);
    // 日本の電話番号: 10桁または11桁
    return /^0\d{9,10}$/.test(normalized);
}

// ==========================================
// 認証状態の監視
// ==========================================

console.log('🔄 認証状態の監視を開始...');

// タイムアウト処理（10秒経過してもログイン画面に遷移しない場合）
let authCheckCompleted = false;
setTimeout(() => {
    if (!authCheckCompleted) {
        console.error('⏱️ 認証状態の確認がタイムアウトしました');
        showError('初期化に時間がかかっています。ページを再読み込みしてください。');
    }
}, 10000);

onAuthStateChanged(auth, async (user) => {
    console.log('👤 認証状態変更:', user ? `ログイン済み (${user.email})` : '未ログイン');

    if (user) {
        // ログイン済み - 企画情報を読み込んでから応募状態をチェック
        console.log('📋 企画情報を読み込み中...');
        await loadCampaignInfo();
        await checkApplicationStatus(user);
    } else {
        // 未ログイン - ログイン画面を表示
        console.log('🔓 ログイン画面を表示');
        showScreen('login');
    }

    // 認証チェック完了フラグ
    authCheckCompleted = true;
});

// ==========================================
// 日付フォーマットユーティリティ
// ==========================================

function formatDate(date) {
    if (!date) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Intl.DateTimeFormat('ja-JP', options).format(date);
}

// ==========================================
// 企画情報の読み込み
// ==========================================

async function loadCampaignInfo() {
    if (!campaignId) {
        showError('企画IDが指定されていません。URLを確認してください。');
        return;
    }

    try {
        const docRef = doc(db, 'campaigns', campaignId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            showError('指定された企画が見つかりません。');
            return;
        }

        currentCampaign = docSnap.data();
        console.log('✅ 企画情報読み込み完了:', currentCampaign.name);

        // 企画の有効期限チェック
        const now = new Date();
        const startDate = currentCampaign.startDate?.toDate();
        const endDate = currentCampaign.endDate?.toDate();

        if (now < startDate) {
            showError(`この企画は${formatDate(startDate)}から開始されます。`);
            return;
        }

        if (now > endDate) {
            showError('この企画は終了しました。');
            return;
        }

    } catch (error) {
        console.error('❌ 企画情報の読み込みエラー:', error);
        showError('企画情報の読み込みに失敗しました。');
    }
}

// ==========================================
// 応募状態のチェック
// ==========================================

async function checkApplicationStatus(user) {
    if (!campaignId) return;

    try {
        console.log('🔍 Firestoreからデータ取得中...', user.uid);
        const applicantId = `${campaignId}_${user.uid}`;
        const docRef = doc(db, 'applicants', applicantId);
        console.log('📄 ドキュメント参照作成完了');

        const docSnap = await getDoc(docRef);
        console.log('📥 データ取得完了:', docSnap.exists() ? '存在する' : '存在しない');

        if (docSnap.exists()) {
            // 既に応募済み
            console.log('✅ 既に応募済み');
            showScreen('alreadyApplied');
        } else {
            // 未応募 - 応募フォームを表示
            console.log('📝 未応募 - 応募フォームを表示');
            displayUserInfo(user);
            displayCampaignInfo();
            showScreen('application');
        }
    } catch (error) {
        console.error('❌ 応募状態の確認エラー:', error);
        console.error('エラーコード:', error.code);
        console.error('エラーメッセージ:', error.message);
        console.error('エラー詳細:', error);
        showError('応募状態の確認中にエラーが発生しました。再度お試しください。');
    }
}

// ==========================================
// ユーザー情報の表示
// ==========================================

function displayUserInfo(user) {
    elements.userName.textContent = user.displayName || '名前未設定';
    elements.userEmail.textContent = user.email || 'メールアドレス未設定';
}

// ==========================================
// 企画情報の表示
// ==========================================

function displayCampaignInfo() {
    if (!currentCampaign) return;

    // 企画名をページタイトルに表示
    document.title = `${currentCampaign.name} - 抽選応募`;

    // 企画情報を応募フォームに表示（HTMLに要素があれば）
    const campaignNameElement = document.getElementById('campaign-name-display');
    const campaignDescElement = document.getElementById('campaign-desc-display');

    if (campaignNameElement) {
        campaignNameElement.textContent = currentCampaign.name;
    }

    if (campaignDescElement && currentCampaign.description) {
        campaignDescElement.textContent = currentCampaign.description;
    }

    console.log('✅ 企画情報表示完了');
}

// ==========================================
// Googleログイン
// ==========================================

elements.googleLoginBtn.addEventListener('click', async () => {
    try {
        elements.googleLoginBtn.disabled = true;
        elements.googleLoginBtn.textContent = 'ログイン中...';

        await signInWithPopup(auth, provider);
        // onAuthStateChangedで自動的に次の画面へ遷移

    } catch (error) {
        console.error('ログインエラー:', error);

        let errorMsg = 'ログインに失敗しました。';

        if (error.code === 'auth/popup-closed-by-user') {
            errorMsg = 'ログインがキャンセルされました。';
        } else if (error.code === 'auth/popup-blocked') {
            errorMsg = 'ポップアップがブロックされました。ブラウザの設定を確認してください。';
        }

        showError(errorMsg);

    } finally {
        elements.googleLoginBtn.disabled = false;
        elements.googleLoginBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Googleアカウントでログイン
        `;
    }
});

// ==========================================
// 応募送信
// ==========================================

elements.submitBtn.addEventListener('click', async () => {
    const user = auth.currentUser;

    if (!user) {
        showError('ログイン情報が見つかりません。再度ログインしてください。');
        return;
    }

    // 電話番号の取得
    const phoneNumber = elements.phoneNumber.value.trim();

    // バリデーション
    if (!phoneNumber) {
        showError('電話番号を入力してください。');
        return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
        showError('正しい電話番号を入力してください。ハイフンなし11桁で入力してください。（例: 09012345678）');
        return;
    }

    try {
        elements.submitBtn.disabled = true;
        elements.submitBtn.textContent = '確認中...';

        // 電話番号をハッシュ化
        console.log('📞 電話番号をハッシュ化中...');
        const phoneHash = await hashPhoneNumber(phoneNumber);
        console.log('🔐 ハッシュ化完了');

        // 重複チェック: 同じ企画で同じ電話番号ハッシュが既に存在するか確認
        console.log('🔍 重複チェック中...');
        const q = query(
            collection(db, 'applicants'),
            where('campaignId', '==', campaignId),
            where('phoneHash', '==', phoneHash)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // 重複応募
            console.log('⚠️ 重複応募検出');
            showError('この電話番号は既に応募済みです。お一人様1回のみ応募可能です。');
            return;
        }

        console.log('✅ 重複なし');
        elements.submitBtn.textContent = '送信中...';

        // Firestoreに応募データを保存（個人情報は保存しない）
        const applicantId = `${campaignId}_${user.uid}`;
        await setDoc(doc(db, 'applicants', applicantId), {
            campaignId: campaignId,           // 企画ID
            uid: user.uid,                    // Firebase認証ID
            phoneHash: phoneHash,             // ハッシュ化された電話番号（重複チェック用）
            appliedAt: serverTimestamp(),     // 応募日時
            status: 'pending'                 // pending, winner, loser
        });

        console.log('✅ 応募データ保存完了');

        // 成功画面を表示
        showScreen('success');

    } catch (error) {
        console.error('応募送信エラー:', error);

        let errorMsg = '応募の送信に失敗しました。';

        if (error.code === 'permission-denied') {
            errorMsg = 'データの保存権限がありません。セキュリティルールを確認してください。';
        } else if (error.code === 'unavailable') {
            errorMsg = 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
        }

        showError(errorMsg);

    } finally {
        elements.submitBtn.disabled = false;
        elements.submitBtn.textContent = '応募する';
    }
});

// ==========================================
// ログアウト
// ==========================================

async function handleLogout() {
    try {
        await signOut(auth);
        showScreen('login');
    } catch (error) {
        console.error('ログアウトエラー:', error);
        showError('ログアウトに失敗しました。');
    }
}

elements.logoutBtn.addEventListener('click', handleLogout);
elements.logoutAlreadyBtn.addEventListener('click', handleLogout);

// ==========================================
// その他のボタン
// ==========================================

elements.closeBtn.addEventListener('click', () => {
    handleLogout();
});

elements.retryBtn.addEventListener('click', () => {
    showScreen('loading');
    location.reload();
});

// ==========================================
// 電話番号処理
// ==========================================

// 電話番号のバリデーション（ハイフンなし11桁のみ）
function validatePhoneNumber(phoneNumber) {
    // 数字のみ11桁かチェック
    const phoneRegex = /^[0-9]{11}$/;
    return phoneRegex.test(phoneNumber);
}

// 電話番号のハッシュ化（SHA-256）
async function hashPhoneNumber(phoneNumber) {
    const encoder = new TextEncoder();
    const data = encoder.encode(phoneNumber);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// ==========================================
// 初期化完了
// ==========================================

console.log('🎁 抽選応募システム初期化完了');
console.log('⚠️ セキュリティルールの設定を忘れずに!');
