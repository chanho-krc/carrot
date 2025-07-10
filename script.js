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
        console.log('🔍 localStorage 체크 시작...');
        
        // localStorage 지원 확인
        if (typeof(Storage) === "undefined") {
            console.error('❌ localStorage 지원 안됨');
            currentItems = [];
            displayItems();
            return;
        }
        
        const storedItems = localStorage.getItem('items');
        console.log('📦 localStorage raw 데이터:', storedItems);
        
        if (storedItems) {
            currentItems = JSON.parse(storedItems);
            console.log('📱 localStorage에서 로드:', currentItems.length + '개 제품');
            console.log('📋 로드된 제품들:', currentItems);
        } else {
            // 테스트용 샘플 데이터
            currentItems = [
                {
                    id: 'sample1',
                    itemName: '사무용 의자',
                    usageYears: '2',
                    purchasePrice: '150000',
                    itemPrice: '50000',
                    itemDescription: '깔끔한 사무용 의자입니다. 쿠션감이 좋습니다.',
                    sellerName: '홍길동',
                    contactInfo: '010-1234-5678',
                    images: [],
                    timestamp: Date.now() - 86400000, // 하루 전
                    dateAdded: new Date(Date.now() - 86400000).toLocaleString('ko-KR')
                },
                {
                    id: 'sample2',
                    itemName: '노트북 거치대',
                    usageYears: '1',
                    purchasePrice: '30000',
                    itemPrice: '15000',
                    itemDescription: '알루미늄 재질의 노트북 거치대입니다.',
                    sellerName: '김철수',
                    contactInfo: '010-5678-1234',
                    images: [],
                    timestamp: Date.now() - 43200000, // 12시간 전
                    dateAdded: new Date(Date.now() - 43200000).toLocaleString('ko-KR')
                }
            ];
            console.log('📱 샘플 데이터 로드 - 테스트용');
            
            // 샘플 데이터를 localStorage에 저장
            localStorage.setItem('items', JSON.stringify(currentItems));
        }
        
        // 컨테이너 확인
        const container = document.getElementById('itemsContainer');
        if (!container) {
            console.error('❌ itemsContainer 요소를 찾을 수 없음');
            // 다른 가능한 컨테이너 찾기
            const itemsList = document.getElementById('itemsList');
            if (itemsList) {
                console.log('✅ itemsList 컨테이너 발견');
            }
        } else {
            console.log('✅ itemsContainer 발견');
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
        
        // 등록 완료 후 모달 닫기
        setTimeout(() => {
            const modal = document.getElementById('addItemModal');
            if (modal) {
                modal.style.display = 'none';
                console.log('📋 등록 모달 닫기');
            }
        }, 100);
        
    } catch (error) {
        console.error('❌ 제품 등록 실패:', error);
        // alert 제거 - 콘솔 로그만 남김
    }
}

// 제품 목록 표시
function displayItems() {
    console.log('🖼️ 화면 업데이트 시작 - 제품 수:', currentItems.length);
    
    // 실제 HTML 구조에 맞는 컨테이너 찾기
    let container = document.getElementById('itemsContainer');
    if (!container) {
        container = document.getElementById('itemsList');
        console.log('📋 itemsList 컨테이너 사용');
    }
    
    if (!container) {
        console.error('❌ 컨테이너를 찾을 수 없음');
        return;
    }
    
    if (currentItems.length === 0) {
        container.innerHTML = '<div class="no-items">등록된 제품이 없습니다.</div>';
        console.log('📭 빈 상태 표시');
        
        // 빈 상태 메시지 표시
        const emptyState = document.getElementById('emptyState');
        if (emptyState) {
            emptyState.style.display = 'block';
        }
        return;
    }
    
    // 빈 상태 숨기기
    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    container.innerHTML = currentItems.map(item => `
        <div class="item-card" data-id="${item.id}" style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px;">
            <div class="item-info">
                <h3 style="margin: 0 0 10px 0; color: #333;">${item.itemName}</h3>
                <p style="font-size: 18px; color: #e74c3c; font-weight: bold; margin: 5px 0;">₩${parseInt(item.itemPrice).toLocaleString()}</p>
                <p style="margin: 5px 0; color: #666;">사용기간: ${item.usageYears}년</p>
                <p style="margin: 5px 0; color: #666;">${item.itemDescription}</p>
                <p style="margin: 5px 0; color: #666;">판매자: ${item.sellerName}</p>
                <p style="margin: 5px 0; color: #666;">등록일: ${item.dateAdded}</p>
            </div>
            <div class="item-actions" style="margin-top: 10px;">
                <button onclick="editItem('${item.id}')" style="margin-right: 10px; padding: 5px 10px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">수정</button>
                <button onclick="deleteItem('${item.id}')" style="padding: 5px 10px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">삭제</button>
            </div>
        </div>
    `).join('');
    
    console.log('✅ 화면 업데이트 완료 - 제품 표시됨');
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
    
    // 등록 모달 열기
    showAddItemModal();
    
    // 버튼 텍스트 변경
    const addBtn = document.getElementById('addBtn');
    if (addBtn) {
        addBtn.textContent = '수정하기';
    }
    
    console.log('✏️ 수정 모드 활성화:', id);
}

// 모달 기반 UI를 위한 함수들
function showAddItemModal() {
    const modal = document.getElementById('addItemModal');
    if (modal) {
        modal.style.display = 'block';
        console.log('📝 등록 모달 열기');
    }
}

function hideAddItemModal() {
    const modal = document.getElementById('addItemModal');
    if (modal) {
        modal.style.display = 'none';
        console.log('📋 등록 모달 닫기');
    }
}

console.log('📱 localStorage 버전 스크립트 로드 완료'); 