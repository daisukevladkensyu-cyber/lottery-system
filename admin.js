// ==========================================
// 管理画面 - メインロジック
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
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

import { firebaseConfig } from './firebase-config.js';

// ==========================================
// Firebase初期化
// ==========================================

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// 管理者のメールアドレス（firestore.rulesと同じ）
const ADMIN_EMAILS = ['daisukevladkensyu@gmail.com'];

// ==========================================
// DOM要素の取得
// ==========================================

const screens = {
    loading: document.getElementById('loading'),
    login: document.getElementById('login-screen'),
    unauthorized: document.getElementById('unauthorized-screen'),
    admin: document.getElementById('admin-screen')
};

const elements = {
    adminLoginBtn: document.getElementById('admin-login-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    logoutUnauthorizedBtn: document.getElementById('logout-unauthorized-btn'),
    adminEmail: document.getElementById('admin-email'),
    createCampaignBtn: document.getElementById('create-campaign-btn'),
    campaignsList: document.getElementById('campaigns-list'),

    // モーダル
    campaignModal: document.getElementById('campaign-modal'),
    qrModal: document.getElementById('qr-modal'),

    // モーダルボタン
    closeModalBtn: document.getElementById('close-modal-btn'),
    cancelModalBtn: document.getElementById('cancel-modal-btn'),
    saveCampaignBtn: document.getElementById('save-campaign-btn'),
    closeQrModalBtn: document.getElementById('close-qr-modal-btn'),

    // フォーム
    modalTitle: document.getElementById('modal-title'),
    campaignName: document.getElementById('campaign-name'),
    campaignDescription: document.getElementById('campaign-description'),
    campaignStartDate: document.getElementById('campaign-start-date'),
    campaignEndDate: document.getElementById('campaign-end-date'),
    campaignMaxWinners: document.getElementById('campaign-max-winners'),

    // QRコード
    qrCodeContainer: document.getElementById('qr-code-container'),
    campaignUrl: document.getElementById('campaign-url'),
    copyUrlBtn: document.getElementById('copy-url-btn'),
    downloadQrBtn: document.getElementById('download-qr-btn')
};

let currentEditingCampaignId = null;
let currentQrCanvas = null;

// ==========================================
// 画面制御
// ==========================================

function showScreen(screenName) {
    Object.values(screens).forEach(screen => {
        if (screen) screen.classList.add('hidden');
    });
    if (screens[screenName]) {
        screens[screenName].classList.remove('hidden');
    }
}

// ==========================================
// 認証状態の監視
// ==========================================

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // ログイン済み - 管理者権限をチェック
        if (ADMIN_EMAILS.includes(user.email)) {
            // 管理者
            elements.adminEmail.textContent = user.email;
            showScreen('admin');
            loadCampaigns();
        } else {
            // 権限なし
            showScreen('unauthorized');
        }
    } else {
        // 未ログイン
        showScreen('login');
    }
});

// ==========================================
// ログイン/ログアウト
// ==========================================

elements.adminLoginBtn.addEventListener('click', async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error('ログインエラー:', error);
        alert('ログインに失敗しました。');
    }
});

elements.logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('ログアウトエラー:', error);
    }
});

elements.logoutUnauthorizedBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('ログアウトエラー:', error);
    }
});

// ==========================================
// 企画一覧の読み込み
// ==========================================

async function loadCampaigns() {
    try {
        const campaignsRef = collection(db, 'campaigns');
        const q = query(campaignsRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            elements.campaignsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <h3>企画がまだありません</h3>
                    <p>「+ 新しい企画を作成」ボタンから最初の企画を作成しましょう</p>
                </div>
            `;
            return;
        }

        elements.campaignsList.innerHTML = '';

        for (const docSnap of snapshot.docs) {
            const campaign = docSnap.data();
            const campaignId = docSnap.id;

            // 応募者数を取得
            const applicantsCount = await getApplicantsCount(campaignId);

            const card = createCampaignCard(campaignId, campaign, applicantsCount);
            elements.campaignsList.appendChild(card);
        }
    } catch (error) {
        console.error('企画一覧の読み込みエラー:', error);
        alert('企画一覧の読み込みに失敗しました。');
    }
}

// ==========================================
// 応募者数の取得
// ==========================================

async function getApplicantsCount(campaignId) {
    try {
        const applicantsRef = collection(db, 'applicants');
        const q = query(applicantsRef, where('campaignId', '==', campaignId));
        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch (error) {
        console.error('応募者数の取得エラー:', error);
        return 0;
    }
}

// ==========================================
// 企画カードの作成
// ==========================================

function createCampaignCard(campaignId, campaign, applicantsCount) {
    const card = document.createElement('div');
    card.className = 'campaign-card';

    const startDate = campaign.startDate?.toDate();
    const endDate = campaign.endDate?.toDate();
    const now = new Date();
    const isActive = campaign.status === 'active' && now >= startDate && now <= endDate;

    card.innerHTML = `
        <div class="campaign-header">
            <div class="campaign-title">
                <h3>${escapeHtml(campaign.name)}</h3>
                <span class="campaign-status ${isActive ? 'active' : 'closed'}">
                    ${isActive ? '募集中' : '終了'}
                </span>
            </div>
        </div>
        
        ${campaign.description ? `<p class="campaign-description">${escapeHtml(campaign.description)}</p>` : ''}
        
        <div class="campaign-meta">
            <div class="meta-item">
                <span class="meta-label">開始日時</span>
                <span class="meta-value">${formatDate(startDate)}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">終了日時</span>
                <span class="meta-value">${formatDate(endDate)}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">応募者数</span>
                <span class="meta-value">${applicantsCount}人</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">当選者数</span>
                <span class="meta-value">${campaign.maxWinners}人</span>
            </div>
        </div>
        
        <div class="campaign-actions">
            <button class="btn-small btn-qr" data-campaign-id="${campaignId}">
                📱 QRコード
            </button>
            <button class="btn-small btn-edit" data-campaign-id="${campaignId}">
                ✏️ 編集
            </button>
            <button class="btn-small btn-delete" data-campaign-id="${campaignId}">
                🗑️ 削除
            </button>
        </div>
    `;

    // イベントリスナーを追加
    card.querySelector('.btn-qr').addEventListener('click', () => showQrCode(campaignId, campaign.name));
    card.querySelector('.btn-edit').addEventListener('click', () => editCampaign(campaignId, campaign));
    card.querySelector('.btn-delete').addEventListener('click', () => deleteCampaign(campaignId, campaign.name));

    return card;
}

// ==========================================
// 企画作成モーダルを開く
// ==========================================

elements.createCampaignBtn.addEventListener('click', () => {
    currentEditingCampaignId = null;
    elements.modalTitle.textContent = '新しい企画を作成';
    elements.campaignName.value = '';
    elements.campaignDescription.value = '';
    elements.campaignStartDate.value = '';
    elements.campaignEndDate.value = '';
    elements.campaignMaxWinners.value = '10';
    elements.campaignModal.classList.remove('hidden');
});

// ==========================================
// 企画編集
// ==========================================

function editCampaign(campaignId, campaign) {
    currentEditingCampaignId = campaignId;
    elements.modalTitle.textContent = '企画を編集';
    elements.campaignName.value = campaign.name;
    elements.campaignDescription.value = campaign.description || '';
    elements.campaignStartDate.value = formatDateTimeLocal(campaign.startDate?.toDate());
    elements.campaignEndDate.value = formatDateTimeLocal(campaign.endDate?.toDate());
    elements.campaignMaxWinners.value = campaign.maxWinners;
    elements.campaignModal.classList.remove('hidden');
}

// ==========================================
// 企画保存
// ==========================================

elements.saveCampaignBtn.addEventListener('click', async () => {
    const name = elements.campaignName.value.trim();
    const description = elements.campaignDescription.value.trim();
    const startDate = elements.campaignStartDate.value;
    const endDate = elements.campaignEndDate.value;
    const maxWinners = parseInt(elements.campaignMaxWinners.value);

    if (!name || !startDate || !endDate || !maxWinners) {
        alert('必須項目を入力してください。');
        return;
    }

    try {
        elements.saveCampaignBtn.disabled = true;
        elements.saveCampaignBtn.textContent = '保存中...';

        const campaignData = {
            name,
            description,
            startDate: Timestamp.fromDate(new Date(startDate)),
            endDate: Timestamp.fromDate(new Date(endDate)),
            maxWinners,
            status: 'active'
        };

        if (currentEditingCampaignId) {
            // 更新
            await updateDoc(doc(db, 'campaigns', currentEditingCampaignId), campaignData);
        } else {
            // 新規作成
            campaignData.createdBy = auth.currentUser.email;
            campaignData.createdAt = serverTimestamp();
            await setDoc(doc(collection(db, 'campaigns')), campaignData);
        }

        elements.campaignModal.classList.add('hidden');
        loadCampaigns();
    } catch (error) {
        console.error('企画保存エラー:', error);
        alert('企画の保存に失敗しました。');
    } finally {
        elements.saveCampaignBtn.disabled = false;
        elements.saveCampaignBtn.textContent = '保存';
    }
});

// ==========================================
// 企画削除
// ==========================================

async function deleteCampaign(campaignId, campaignName) {
    if (!confirm(`「${campaignName}」を削除しますか？\n\nこの操作は取り消せません。`)) {
        return;
    }

    try {
        await deleteDoc(doc(db, 'campaigns', campaignId));
        loadCampaigns();
    } catch (error) {
        console.error('企画削除エラー:', error);
        alert('企画の削除に失敗しました。');
    }
}

// ==========================================
// QRコード表示
// ==========================================

function showQrCode(campaignId, campaignName) {
    const baseUrl = window.location.origin + window.location.pathname.replace('admin.html', 'index.html');
    const url = `${baseUrl}?campaign=${campaignId}`;

    elements.campaignUrl.value = url;
    elements.qrCodeContainer.innerHTML = '';

    // QRコード生成
    QRCode.toCanvas(url, {
        width: 300,
        margin: 2,
        color: {
            dark: '#000000',
            light: '#FFFFFF'
        }
    }, (error, canvas) => {
        if (error) {
            console.error('QRコード生成エラー:', error);
            alert('QRコードの生成に失敗しました。');
            return;
        }

        currentQrCanvas = canvas;
        elements.qrCodeContainer.appendChild(canvas);
    });

    elements.qrModal.classList.remove('hidden');
}

// ==========================================
// URLコピー
// ==========================================

elements.copyUrlBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(elements.campaignUrl.value);
        elements.copyUrlBtn.textContent = '✓ コピーしました';
        setTimeout(() => {
            elements.copyUrlBtn.textContent = 'URLをコピー';
        }, 2000);
    } catch (error) {
        console.error('コピーエラー:', error);
        alert('URLのコピーに失敗しました。');
    }
});

// ==========================================
// QRコードダウンロード
// ==========================================

elements.downloadQrBtn.addEventListener('click', () => {
    if (!currentQrCanvas) return;

    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = currentQrCanvas.toDataURL();
    link.click();
});

// ==========================================
// モーダルを閉じる
// ==========================================

elements.closeModalBtn.addEventListener('click', () => {
    elements.campaignModal.classList.add('hidden');
});

elements.cancelModalBtn.addEventListener('click', () => {
    elements.campaignModal.classList.add('hidden');
});

elements.closeQrModalBtn.addEventListener('click', () => {
    elements.qrModal.classList.add('hidden');
});

// モーダル外クリックで閉じる
elements.campaignModal.addEventListener('click', (e) => {
    if (e.target === elements.campaignModal) {
        elements.campaignModal.classList.add('hidden');
    }
});

elements.qrModal.addEventListener('click', (e) => {
    if (e.target === elements.qrModal) {
        elements.qrModal.classList.add('hidden');
    }
});

// ==========================================
// ユーティリティ関数
// ==========================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(date) {
    if (!date) return '-';
    return new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function formatDateTimeLocal(date) {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

console.log('🎁 管理画面初期化完了');
