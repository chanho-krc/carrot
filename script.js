// 사내 중고거래 - localStorage 버전
let currentItems = [];
let isEditing = false;
let editingId = null;

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM 로드 완료');
    console.log('📱 localStorage 버전 시작');
    
    // 500ms 후 이벤트 리스너 설정 (안정성을 위해)
    setTimeout(() => {
        setupEventListeners();
        loadItemsFromStorage();
    }, 500);
});

// 이벤트 리스너 설정
function setupEventListeners() {
    console.log('🔧 이벤트 리스너 설정 중...');
    
    // 등록 폼 이벤트
    const itemForm = document.getElementById('itemForm');
    const addBtn = document.getElementById('addBtn');
    
    if (itemForm) {
        itemForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('📝 폼 제출 이벤트');
            handleAddItem();
        });
        console.log('✅ 폼 이벤트 리스너 설정');
    }
    
    if (addBtn) {
        addBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('📝 등록 버튼 클릭 이벤트');
            handleAddItem();
        });
        console.log('✅ 버튼 이벤트 리스너 설정');
    }
    
    // 파일 선택 이벤트
    const fileInput = document.getElementById('itemImages');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            console.log('📁 파일 선택됨:', e.target.files.length + '개');
        });
    }
    
    // 검색 이벤트
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            searchItems(e.target.value);
        });
    }
    
    // 정렬 이벤트
    const sortSelect = document.getElementById('sortBy');
    if (sortSelect) {
        sortSelect.addEventListener('change', function(e) {
            sortItems(e.target.value);
            displayItems();
        });
    }
    
    console.log('🎯 모든 이벤트 리스너 설정 완료');
}

// localStorage에서 데이터 로드
function loadItemsFromStorage() {
    try {
        const storedItems = localStorage.getItem('items');
        if (storedItems) {
            currentItems = JSON.parse(storedItems);
            console.log('📱 localStorage에서 로드:', currentItems.length + '개 제품');
        } else {
            currentItems = [];
            console.log('📱 새로운 시작 - 저장된 제품 없음');
        }
        
        sortItems();
        displayItems();
        
    } catch (error) {
        console.error('❌ localStorage 로드 실패:', error);
        currentItems = [];
        displayItems();
    }
}

// 제품 등록 처리
async function handleAddItem() {
    try {
        console.log('🚀 제품 등록 시작');
        
        // 폼 데이터 수집
        const formData = {
            itemName: document.getElementById('itemName').value.trim(),
            usageYears: document.getElementById('usageYears').value,
            purchasePrice: document.getElementById('purchasePrice').value,
            itemPrice: document.getElementById('itemPrice').value,
            itemDescription: document.getElementById('itemDescription').value.trim(),
            sellerName: document.getElementById('sellerName').value.trim(),
            contactInfo: document.getElementById('contactInfo').value.trim()
        };
        
        console.log('📝 폼 데이터:', formData);
        
        // 필수 필드 확인
        if (!formData.itemName || !formData.itemPrice || !formData.sellerName) {
            console.log('⚠️ 필수 필드 누락');
            // 첫 번째 빈 필드로 포커스 이동
            if (!formData.itemName) document.getElementById('itemName').focus();
            else if (!formData.itemPrice) document.getElementById('itemPrice').focus();
            else if (!formData.sellerName) document.getElementById('sellerName').focus();
            return;
        }
        
        // 제품 데이터 생성
        const itemData = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            ...formData,
            images: [], // 이미지는 나중에 구현
            timestamp: Date.now(),
            dateAdded: new Date().toLocaleString('ko-KR')
        };
        
        console.log('💾 저장할 데이터:', itemData);
        
        // localStorage에 저장
        currentItems.push(itemData);
        localStorage.setItem('items', JSON.stringify(currentItems));
        
        console.log('✅ localStorage에 저장 완료');
        
        // 화면 업데이트
        sortItems();
        displayItems();
        
        // 폼 초기화
        document.getElementById('itemForm').reset();
        
        // 성공 메시지 (콘솔만)
        console.log('🎉 제품이 성공적으로 등록되었습니다!');
        
        // 등록 탭에서 목록 탭으로 자연스럽게 전환
        setTimeout(() => {
            document.getElementById('listTab')?.click();
        }, 100);
        
    } catch (error) {
        console.error('❌ 제품 등록 실패:', error);
        // alert 제거 - 콘솔 로그만 남김
    }
}

// 제품 목록 표시
function displayItems() {
    const container = document.getElementById('itemsContainer');
    if (!container) return;
    
    if (currentItems.length === 0) {
        container.innerHTML = '<div class="no-items">등록된 제품이 없습니다.</div>';
        return;
    }
    
    container.innerHTML = currentItems.map(item => `
        <div class="item-card" data-id="${item.id}">
            <div class="item-image">
                <img src="${item.images && item.images.length > 0 ? item.images[0] : 'data:image/svg+xml;charset=UTF-8,%3Csvg width="200" height="200" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="200" height="200" fill="%23f0f0f0"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="14" fill="%23999"%3E이미지 없음%3C/text%3E%3C/svg%3E'}" alt="${item.itemName}" onerror="this.src='data:image/svg+xml;charset=UTF-8,%3Csvg width=\\"200\\" height=\\"200\\" xmlns=\\"http://www.w3.org/2000/svg\\"%3E%3Crect width=\\"200\\" height=\\"200\\" fill=\\"%23f0f0f0\\"/%3E%3Ctext x=\\"50%\\" y=\\"50%\\" text-anchor=\\"middle\\" dy=\\".3em\\" font-size=\\"14\\" fill=\\"%23999\\"%3E이미지 없음%3C/text%3E%3C/svg%3E'">
            </div>
            <div class="item-info">
                <h3>${item.itemName}</h3>
                <p class="price">₩${parseInt(item.itemPrice).toLocaleString()}</p>
                <p class="usage">사용기간: ${item.usageYears}년</p>
                <p class="description">${item.itemDescription}</p>
                <p class="seller">판매자: ${item.sellerName}</p>
                <p class="contact">연락처: ${item.contactInfo}</p>
                <p class="date">등록일: ${item.dateAdded}</p>
            </div>
            <div class="item-actions">
                <button onclick="editItem('${item.id}')" class="edit-btn">수정</button>
                <button onclick="deleteItem('${item.id}')" class="delete-btn">삭제</button>
            </div>
        </div>
    `).join('');
}

// 제품 정렬
function sortItems(sortBy = 'newest') {
    currentItems.sort((a, b) => {
        switch(sortBy) {
            case 'oldest':
                return a.timestamp - b.timestamp;
            case 'price-low':
                return parseInt(a.itemPrice) - parseInt(b.itemPrice);
            case 'price-high':
                return parseInt(b.itemPrice) - parseInt(a.itemPrice);
            case 'name':
                return a.itemName.localeCompare(b.itemName);
            default:
                return b.timestamp - a.timestamp;
        }
    });
}

// 제품 검색
function searchItems(searchTerm) {
    const allItems = JSON.parse(localStorage.getItem('items') || '[]');
    
    if (!searchTerm.trim()) {
        currentItems = allItems;
    } else {
        currentItems = allItems.filter(item => 
            item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.itemDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sellerName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    displayItems();
}

// 제품 삭제
function deleteItem(id) {
    const item = currentItems.find(item => item.id === id);
    if (!item) return;
    
    // 더 자연스러운 확인 메시지
    if (confirm(`"${item.itemName}" 제품을 삭제하시겠습니까?`)) {
        currentItems = currentItems.filter(item => item.id !== id);
        localStorage.setItem('items', JSON.stringify(currentItems));
        displayItems();
        console.log('🗑️ 제품 삭제 완료:', id);
    }
}

// 제품 수정
function editItem(id) {
    const item = currentItems.find(item => item.id === id);
    if (!item) return;
    
    // 수정 모드 활성화
    isEditing = true;
    editingId = id;
    
    // 폼에 데이터 채우기
    document.getElementById('itemName').value = item.itemName;
    document.getElementById('usageYears').value = item.usageYears;
    document.getElementById('purchasePrice').value = item.purchasePrice;
    document.getElementById('itemPrice').value = item.itemPrice;
    document.getElementById('itemDescription').value = item.itemDescription;
    document.getElementById('sellerName').value = item.sellerName;
    document.getElementById('contactInfo').value = item.contactInfo;
    
    // 등록 탭으로 이동
    document.getElementById('addTab').click();
    
    // 버튼 텍스트 변경
    document.getElementById('addBtn').textContent = '수정하기';
    
    console.log('✏️ 수정 모드 활성화:', id);
}

// 탭 전환
function switchTab(tabName) {
    // 탭 버튼 활성화
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // 탭 컨텐츠 표시
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName + 'Content').classList.add('active');
    
    // 목록 탭으로 이동시 새로고침
    if (tabName === 'list') {
        loadItemsFromStorage();
    }
}

console.log('📱 localStorage 버전 스크립트 로드 완료'); 