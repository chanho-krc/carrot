// Firebase 모듈 가져오기 (로컬 테스트용 주석 처리)
// import { ref, set, get, push, remove, onValue, update } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// 전역 변수
let isAdmin = false;
let currentItems = [];
let currentItemIdForComplete = null;
let currentItemForAuth = null; // 인증이 필요한 아이템
let authAction = null; // 'complete' 또는 'cancel'

// 로컬 스토리지 헬퍼 함수들
function generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('로컬 스토리지 저장 실패:', error);
        return false;
    }
}

function loadFromLocalStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('로컬 스토리지 로드 실패:', error);
        return defaultValue;
    }
}

// DOM이 로드되면 실행
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM 로드 완료');
    console.log('스크립트 버전: 2024-01-15-예약기능제거');
    
    // 이벤트 리스너 등록
    setupEventListeners();
    
    // 관리자 상태 확인 (localStorage에서)
    const savedAdminState = localStorage.getItem('adminLoggedIn');
    if (savedAdminState === 'true') {
        isAdmin = true;
        updateAdminUI();
    }
    
    // 로컬 스토리지에서 데이터 로드
    loadItems();
});

// 이벤트 리스너 설정
function setupEventListeners() {
    // 물건 등록 버튼
    const addItemBtn = document.getElementById('addItemBtn');
    if (addItemBtn) {
        addItemBtn.addEventListener('click', openAddItemModal);
    }
    
    // 관리자 버튼
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) {
        adminBtn.addEventListener('click', openAdminModal);
    }
    
    // 모달 닫기 버튼들
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(button => {
        button.addEventListener('click', closeModals);
    });
    
    // 모달 외부 클릭시 닫기
    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // 물건 등록 폼
    const addItemForm = document.getElementById('addItemForm');
    if (addItemForm) {
        addItemForm.addEventListener('submit', handleAddItem);
    }
    

    
    // 관리자 로그인
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', handleAdminLogin);
    }
    
    // 정렬 선택
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', sortItems);
    }
    
    // 파일 업로드 관련
    setupFileUpload();
    

    
    // 거래 완료 모달 버튼들
    const confirmCompleteBtn = document.getElementById('confirmCompleteBtn');
    const cancelCompleteBtn = document.getElementById('cancelCompleteBtn');
    
    if (confirmCompleteBtn) {
        confirmCompleteBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            confirmCompleteTransaction();
        });
    }
    
    if (cancelCompleteBtn) {
        cancelCompleteBtn.addEventListener('click', function() {
            document.getElementById('completeModal').style.display = 'none';
        });
    }
    
    // 상세보기 모달 닫기 버튼
    const closeDetailModal = document.getElementById('closeDetailModal');
    if (closeDetailModal) {
        closeDetailModal.addEventListener('click', function() {
            const modal = document.getElementById('itemDetailModal');
            const modalContent = modal.querySelector('.modal-content');
            
            // 슬라이드 아웃 애니메이션
            modalContent.classList.remove('show');
            
            // 애니메이션 완료 후 모달 숨김
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        });
    }
    
    // 판매자 인증 모달 관련
    const closeSellerAuthModalBtn = document.getElementById('closeSellerAuthModal');
    if (closeSellerAuthModalBtn) {
        closeSellerAuthModalBtn.addEventListener('click', function() {
            closeSellerAuthModal();
        });
    }
    
    const sellerAuthForm = document.getElementById('sellerAuthForm');
    if (sellerAuthForm) {
        sellerAuthForm.addEventListener('submit', handleSellerAuth);
    }
    
    // 판매자 인증 모달의 연락처 입력 포맷팅
    const authContactInput = document.getElementById('authSellerContact');
    if (authContactInput) {
        authContactInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/[^\d]/g, '');
            
            if (value.length >= 3) {
                if (value.length <= 7) {
                    value = value.replace(/(\d{3})(\d+)/, '$1-$2');
                } else {
                    value = value.replace(/(\d{3})(\d{4})(\d+)/, '$1-$2-$3');
                }
            }
            
            e.target.value = value;
        });
    }
    
    // 연락처 자동 포맷팅
    setupContactFormatting();
}

// 연락처 자동 포맷팅 설정
function setupContactFormatting() {
    const contactInputs = ['sellerContact'];
    
    contactInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', function(e) {
                let value = e.target.value.replace(/[^\d]/g, '');
                
                if (value.length >= 3) {
                    if (value.length <= 7) {
                        value = value.replace(/(\d{3})(\d+)/, '$1-$2');
                    } else {
                        value = value.replace(/(\d{3})(\d{4})(\d+)/, '$1-$2-$3');
                    }
                }
                
                e.target.value = value;
            });
        }
    });
}

// 파일 업로드 설정
function setupFileUpload() {
    const fileInput = document.getElementById('itemImage');
    const fileUploadBtn = document.getElementById('fileUploadBtn');
    const selectedFilesList = document.getElementById('selectedFilesList');
    const imagePreview = document.getElementById('imagePreview');
    
    if (fileUploadBtn && fileInput) {
        fileUploadBtn.addEventListener('click', () => fileInput.click());
        
        fileInput.addEventListener('change', handleFileSelection);
        
        // 드래그 앤 드롭
        fileUploadBtn.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUploadBtn.classList.add('drag-over');
        });
        
        fileUploadBtn.addEventListener('dragleave', () => {
            fileUploadBtn.classList.remove('drag-over');
        });
        
        fileUploadBtn.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUploadBtn.classList.remove('drag-over');
            fileInput.files = e.dataTransfer.files;
            handleFileSelection();
        });
    }
}

// 파일 선택 처리
function handleFileSelection() {
    const fileInput = document.getElementById('itemImage');
    const selectedFilesList = document.getElementById('selectedFilesList');
    const imagePreview = document.getElementById('imagePreview');
    
    // 최대 10장 제한
    if (fileInput.files.length > 10) {
        alert('최대 10장까지만 업로드할 수 있습니다.');
        fileInput.value = ''; // 파일 선택 초기화
        return;
    }
    
    if (fileInput.files.length > 0) {
        selectedFilesList.innerHTML = '';
        imagePreview.innerHTML = '';
        
        Array.from(fileInput.files).forEach((file, index) => {
            // 파일 목록에 추가
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <span>${file.name}</span>
                <button type="button" onclick="removeFile(${index})" class="remove-file-btn">×</button>
            `;
            selectedFilesList.appendChild(fileItem);
            
            // 이미지 미리보기
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const imgContainer = document.createElement('div');
                    imgContainer.className = 'image-preview-item';
                    imgContainer.innerHTML = `
                        <img src="${e.target.result}" alt="미리보기">
                        <button type="button" onclick="removeFile(${index})" class="remove-preview-btn">×</button>
                    `;
                    imagePreview.appendChild(imgContainer);
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

// 파일 제거
function removeFile(index) {
    const fileInput = document.getElementById('itemImage');
    const dt = new DataTransfer();
    
    Array.from(fileInput.files).forEach((file, i) => {
        if (i !== index) {
            dt.items.add(file);
        }
    });
    
    fileInput.files = dt.files;
    handleFileSelection();
}

// 모달 열기/닫기 함수들
function openAddItemModal() {
    document.getElementById('addItemModal').style.display = 'block';
}

function openAdminModal() {
    if (isAdmin) {
        // 이미 관리자로 로그인된 경우 로그아웃
        handleAdminLogout();
    } else {
        document.getElementById('adminModal').style.display = 'block';
    }
}

function closeModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

// 물건 등록 처리
async function handleAddItem(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const imageFiles = document.getElementById('itemImage').files;
    
    try {
        // 이미지 업로드 및 압축 (이미지가 없어도 빈 배열로 처리)
        let imageUrls = [];
        if (imageFiles.length > 0) {
            imageUrls = await Promise.all(
                Array.from(imageFiles).map(file => compressAndConvertToBase64(file))
            );
        }
        
        // 사용기간 텍스트 생성
        const yearsValue = formData.get('usageYears');
        const years = parseFloat(yearsValue) || 0;
        const months = parseInt(formData.get('usageMonths')) || 0;
        
        let usagePeriodText = '';
        if (years === 0 && months === 0) {
            usagePeriodText = '신제품 (미사용)';
        } else if (yearsValue === '0.5') {
            // "1년 미만" 옵션인 경우
            usagePeriodText = months > 0 ? `1년 미만 (${months}개월)` : '1년 미만';
        } else {
            const yearText = years > 0 ? `${years}년` : '';
            const monthText = months > 0 ? `${months}개월` : '';
            
            if (years >= 10) {
                usagePeriodText = '10년 이상';
            } else {
                usagePeriodText = [yearText, monthText].filter(Boolean).join(' ') || '신제품';
            }
        }
        
        const itemData = {
            id: generateId(),
            name: formData.get('itemName'),
            images: imageUrls,
            usagePeriod: usagePeriodText,
            usageYears: years,
            usageMonths: months,
            purchasePrice: parseInt(formData.get('purchasePrice')),
            price: parseInt(formData.get('itemPrice')),
            description: formData.get('itemDescription'),
            sellerName: formData.get('sellerName'),
            sellerContact: formData.get('sellerContact'),
            timestamp: Date.now(),
            status: 'available' // available, sold
        };
        
        // 로컬 스토리지에 저장
        const items = loadFromLocalStorage('items', []);
        items.push(itemData);
        const saved = saveToLocalStorage('items', items);
        
        if (saved) {
            alert('물건이 성공적으로 등록되었습니다!');
            closeModals();
            event.target.reset();
            document.getElementById('imagePreview').innerHTML = '';
            document.getElementById('selectedFilesList').innerHTML = '';
            
            // 목록 새로고침
            loadItems();
        } else {
            throw new Error('로컬 스토리지 저장에 실패했습니다.');
        }
        
    } catch (error) {
        console.error('물건 등록 중 오류 발생:', error);
        alert('물건 등록 중 오류가 발생했습니다: ' + error.message);
    }
}

// 이미지 압축 및 Base64 변환
function compressAndConvertToBase64(file) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            const maxWidth = 800;
            const maxHeight = 600;
            let { width, height } = img;
            
            if (width > height) {
                if (width > maxWidth) {
                    height = height * maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = width * maxHeight / height;
                    height = maxHeight;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob((blob) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            }, 'image/jpeg', 0.8);
        };
        
        img.src = URL.createObjectURL(file);
    });
}



// 물건 목록 로드
function loadItems() {
    const items = loadFromLocalStorage('items', []);
    currentItems = items;
    
    sortItems();
    displayItems();
}

// 물건 표시
function displayItems() {
    const itemsList = document.getElementById('itemsList');
    const emptyState = document.getElementById('emptyState');
    
    if (currentItems.length === 0) {
        itemsList.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }
    
    itemsList.style.display = 'grid';
    emptyState.style.display = 'none';
    
    itemsList.innerHTML = currentItems.map(item => createItemCard(item)).join('');
}

// 물건 카드 생성
function createItemCard(item) {
    const isSold = item.status === 'sold';
    
    // 당근마켓 스타일의 이미지
    const imageHtml = item.images && item.images.length > 0 
        ? `<div class="carrot-item-image" onclick="openItemDetail('${item.id}')">
             <img src="${item.images[0]}" alt="${item.name}" loading="lazy">
             ${item.images.length > 1 ? `<div class="image-count">${item.images.length}</div>` : ''}
           </div>`
        : `<div class="carrot-item-image carrot-no-image" onclick="openItemDetail('${item.id}')">
             <i class="fas fa-image"></i>
           </div>`;
    
    const timeAgo = getTimeAgo(item.timestamp);
    
    // 관리자 액션 버튼들
    const adminActions = () => {
        if (!isAdmin) return '';
        
        let actions = '';
        if (isSold) {
            actions += `<button onclick="deleteItem('${item.id}')" class="carrot-admin-btn carrot-admin-delete" title="삭제">
                           <i class="fas fa-trash"></i>
                       </button>`;
        } else {
            actions += `<button onclick="deleteItem('${item.id}')" class="carrot-admin-btn carrot-admin-delete" title="삭제">
                           <i class="fas fa-trash"></i>
                       </button>
                       <button onclick="openCompleteModal('${item.id}')" class="carrot-admin-btn carrot-admin-complete" title="거래완료">
                           <i class="fas fa-check"></i>
                       </button>`;
        }
        return `<div class="carrot-admin-actions">${actions}</div>`;
    };
    
    return `
        <div class="carrot-item ${isSold ? 'sold' : ''}" data-id="${item.id}" onclick="openItemDetail('${item.id}')">
            ${imageHtml}
            <div class="carrot-item-content">
                <h3 class="carrot-item-title">${item.name}${isSold ? ' (거래완료)' : ''}</h3>
                <div class="carrot-item-time">
                    <span>${timeAgo}</span>
                </div>
                <div class="carrot-item-price">${item.price.toLocaleString()}원</div>
                ${!isSold && !isAdmin ? `
                    <button onclick="event.stopPropagation(); openCompleteModal('${item.id}')" class="carrot-complete-btn" title="거래완료">
                        <i class="fas fa-check"></i> 거래완료
                    </button>
                ` : ''}
            </div>
            ${adminActions()}
        </div>
    `;
}

// 이미지 변경
function changeImage(itemId, imageIndex) {
    const card = document.querySelector(`[data-id="${itemId}"]`);
    const images = card.querySelectorAll('.item-image');
    const indicators = card.querySelectorAll('.indicator');
    
    images.forEach((img, index) => {
        img.classList.toggle('active', index === imageIndex);
    });
    
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === imageIndex);
    });
}

// 이미지 네비게이션
function navigateImage(itemId, direction) {
    const card = document.querySelector(`[data-id="${itemId}"]`);
    const images = card.querySelectorAll('.item-image');
    const currentIndex = Array.from(images).findIndex(img => img.classList.contains('active'));
    
    let newIndex;
    if (direction === 1) { // 다음
        newIndex = (currentIndex + 1) % images.length;
    } else { // 이전
        newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    }
    
    changeImage(itemId, newIndex);
}



// 상세보기 모달 열기
function openItemDetail(itemId) {
    const item = currentItems.find(i => i.id === itemId);
    if (!item) return;
    
    currentDetailItem = item;
    currentDetailImageIndex = 0;
    
    const modal = document.getElementById('itemDetailModal');
    const content = document.getElementById('itemDetailContent');
    
    // 상세보기 내용 생성
    content.innerHTML = createItemDetailContent(item);
    modal.style.display = 'block';
    
    // 애니메이션을 위해 잠시 후 show 클래스 추가
    setTimeout(() => {
        modal.querySelector('.modal-content').classList.add('show');
    }, 50);
}

// 상세보기 내용 생성
function createItemDetailContent(item) {
    const isSold = item.status === 'sold';
    
    const imagesHtml = item.images && item.images.length > 0 
        ? `<div class="carrot-detail-images">
             <div class="carrot-image-container">
                 <img src="${item.images[0]}" alt="${item.name}" class="carrot-main-image" id="detailMainImage">
                 ${item.images.length > 1 ? 
                     `<div class="carrot-image-pagination">${1}/${item.images.length}</div>
                      <div class="carrot-image-nav">
                          <button class="carrot-nav-btn prev" onclick="navigateDetailImage(-1)" ${item.images.length <= 1 ? 'style="display:none"' : ''}>
                              <i class="fas fa-chevron-left"></i>
                          </button>
                          <button class="carrot-nav-btn next" onclick="navigateDetailImage(1)" ${item.images.length <= 1 ? 'style="display:none"' : ''}>
                              <i class="fas fa-chevron-right"></i>
                          </button>
                      </div>` 
                     : ''
                 }
             </div>
           </div>`
        : '<div class="carrot-no-image"><i class="fas fa-camera"></i><span>사진 없음</span></div>';
    
    const statusBadge = () => {
        if (isSold) return '<span class="status-badge sold">거래완료</span>';
        return '<span class="status-badge available">판매중</span>';
    };
    
    const contactInfo = () => {
        let info = `<div class="seller-info">
                      <h4>📞 판매자 정보</h4>
                      <p><strong>이름:</strong> ${item.sellerName}</p>`;
        
        if (isAdmin) {
            info += `<p><strong>연락처:</strong> ${item.sellerContact}</p>`;
        } else {
            info += `<p class="contact-hidden">💡 연락처는 관리자만 볼 수 있습니다</p>`;
        }
        
        info += '</div>';
        
        return info;
    };
    
    const actionButtons = () => {
        let buttons = '';
        
        // 거래 완료된 물건에는 관리자 삭제 버튼만 표시
        if (isSold) {
            if (isAdmin) {
                buttons += `<button onclick="deleteItem('${item.id}')" class="btn btn-danger">
                               <i class="fas fa-trash"></i> 삭제
                           </button>`;
            }
            return buttons ? `<div class="detail-actions">${buttons}</div>` : '';
        }
        
        // 판매중인 물건에는 거래완료 버튼만 표시
        // 관리자는 모든 기능 사용 가능
        if (isAdmin) {
            buttons += `<button onclick="deleteItem('${item.id}')" class="btn btn-danger">
                           <i class="fas fa-trash"></i> 삭제
                       </button>`;
            
            // 관리자는 언제든 거래완료 가능
            buttons += `<button onclick="openCompleteModal('${item.id}')" class="btn btn-success">
                           <i class="fas fa-check"></i> 거래완료
                       </button>`;
        } else {
            // 일반 사용자(판매자)도 언제든 거래완료 가능 - 판매자 인증 필요
            buttons += `<button onclick="openCompleteModal('${item.id}')" class="btn btn-success" title="판매자 인증 후 거래 완료">
                           <i class="fas fa-check"></i> 거래완료
                       </button>`;
        }
        
        return buttons ? `<div class="detail-actions">${buttons}</div>` : '';
    };
    
    return `
        <div class="carrot-detail-content">
            <!-- 이미지 섹션 -->
            ${imagesHtml}
            
            <!-- 판매자 정보 -->
            <div class="carrot-seller-section">
                <div class="carrot-seller-info">
                    <div class="carrot-seller-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="carrot-seller-details">
                        <div class="carrot-seller-name">${item.sellerName}</div>
                    </div>
                </div>
            </div>
            
            <!-- 상품 정보 -->
            <div class="carrot-product-section">
                <h1 class="carrot-product-title">${item.name}</h1>
                <div class="carrot-product-meta">
                    <span class="carrot-category">${item.usagePeriod || '사용기간 정보 없음'}</span>
                    <span class="carrot-time">${getTimeAgo(item.timestamp)}</span>
                </div>
                <div class="carrot-product-price">${item.price.toLocaleString()}원</div>
                <div class="carrot-purchase-price">구매가: ${item.purchasePrice.toLocaleString()}원</div>
                
                <div class="carrot-product-description">
                    ${item.description}
                </div>
                
                <div class="carrot-product-stats">
                    <span>조회 ${Math.floor(Math.random() * 100) + 20}</span>
                </div>
                
                ${statusBadge()}
                
                ${contactInfo()}
            </div>
            

            
            ${actionButtons()}
        </div>
    `;
}

// 상세보기에서 이미지 변경
function changeDetailImage(imageIndex) {
    const mainImage = document.getElementById('detailMainImage');
    const thumbnails = document.querySelectorAll('.detail-thumbnail');
    const item = currentItems.find(i => i.images && i.images.length > imageIndex);
    
    if (item && mainImage) {
        mainImage.src = item.images[imageIndex];
        
        thumbnails.forEach((thumb, index) => {
            thumb.classList.toggle('active', index === imageIndex);
        });
    }
}

// 상세보기 이미지 네비게이션
let currentDetailImageIndex = 0;
let currentDetailItem = null;

function navigateDetailImage(direction) {
    const mainImage = document.getElementById('detailMainImage');
    const pagination = document.querySelector('.carrot-image-pagination');
    
    if (!currentDetailItem || !currentDetailItem.images || currentDetailItem.images.length <= 1) {
        return;
    }
    
    currentDetailImageIndex += direction;
    
    if (currentDetailImageIndex < 0) {
        currentDetailImageIndex = currentDetailItem.images.length - 1;
    } else if (currentDetailImageIndex >= currentDetailItem.images.length) {
        currentDetailImageIndex = 0;
    }
    
    if (mainImage) {
        mainImage.src = currentDetailItem.images[currentDetailImageIndex];
    }
    
    if (pagination) {
        pagination.textContent = `${currentDetailImageIndex + 1}/${currentDetailItem.images.length}`;
    }
}

// 시간 표시 함수
function getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    
    return new Date(timestamp).toLocaleDateString();
}

// 거래 완료 모달 열기 (판매자 인증 포함)
function openCompleteModal(itemId) {
    const item = currentItems.find(i => i.id === itemId);
    
    if (!item) {
        alert('오류: 해당 물건을 찾을 수 없습니다. 페이지를 새로고침해주세요.');
        return;
    }
    
    // 관리자는 바로 거래 완료 모달 열기
    if (isAdmin) {
        currentItemIdForComplete = itemId;
        
        const completeModal = document.getElementById('completeModal');
        if (completeModal) {
            completeModal.style.display = 'block';
        }
        return;
    }
    
    // 일반 사용자는 판매자 인증 필요
    currentItemForAuth = item;
    authAction = 'complete';
    
    // 모달 제목 변경
    const modalTitle = document.querySelector('#sellerAuthModal h2');
    if (modalTitle) {
        modalTitle.innerHTML = '<i class="fas fa-user-check"></i> 판매자 인증';
    }
    
    // 안내 문구 변경
    const authInfo = document.querySelector('#sellerAuthModal .auth-info p');
    if (authInfo) {
        authInfo.innerHTML = '<i class="fas fa-info-circle"></i> 거래 완료를 위해 판매자 정보를 확인해주세요.';
    }
    
    const authModal = document.getElementById('sellerAuthModal');
    if (authModal) {
        authModal.style.display = 'block';
    }
}

// 판매자 인증 모달 닫기
function closeSellerAuthModal() {
    document.getElementById('sellerAuthModal').style.display = 'none';
    currentItemForAuth = null;
    authAction = null;
    
    // 폼 초기화
    const form = document.getElementById('sellerAuthForm');
    if (form) {
        form.reset();
    }
}

// 판매자 인증 처리
async function handleSellerAuth(event) {
    event.preventDefault();
    
    try {
        if (!currentItemForAuth || !currentItemForAuth.id) {
            alert('인증할 물건 정보가 없습니다.');
            return;
        }
        
        const formData = new FormData(event.target);
        const inputName = formData.get('authSellerName')?.trim() || '';
        const inputContact = formData.get('authSellerContact')?.trim() || '';
        
        // 판매자 정보 null/undefined 체크
        if (!currentItemForAuth.sellerName || !currentItemForAuth.sellerContact) {
            alert('오류: 판매자 정보가 누락되었습니다.\n물건 등록 시 판매자명과 연락처가 제대로 저장되지 않았을 수 있습니다.');
            return;
        }
        
        // 판매자 정보 확인 (대소문자 무시, 연락처 숫자만 비교)
        const inputNameNormalized = inputName.toLowerCase().replace(/\s+/g, '');
        const sellerNameNormalized = currentItemForAuth.sellerName.toLowerCase().replace(/\s+/g, '');
        const inputContactNormalized = inputContact.replace(/[^\d]/g, '');
        const sellerContactNormalized = currentItemForAuth.sellerContact.replace(/[^\d]/g, '');
        
        if (inputNameNormalized === sellerNameNormalized && 
            inputContactNormalized === sellerContactNormalized) {
            
            // 인증 성공
            console.log('✅ 판매자 인증 성공!');
            console.log('📋 인증된 아이템:', currentItemForAuth);
            console.log('🎯 authAction:', authAction);
            
            const itemId = currentItemForAuth.id;
            const currentAuthAction = authAction; // authAction 값을 미리 저장
            
            // 모달 닫기 (하지만 변수 초기화는 나중에)
            document.getElementById('sellerAuthModal').style.display = 'none';
            const form = document.getElementById('sellerAuthForm');
            if (form) {
                form.reset();
            }
            
            if (currentAuthAction === 'complete') {
                console.log('🎯 거래완료 처리 분기 진입');
                // 거래 완료 처리
                currentItemIdForComplete = itemId;
                console.log('🔄 currentItemIdForComplete 설정:', currentItemIdForComplete);
                
                // 판매자 인증 성공시 바로 거래완료 처리
                console.log('📞 confirmCompleteTransaction 호출 시작');
                
                // Promise 방식으로 호출
                confirmCompleteTransaction()
                    .then(() => {
                        console.log('✅ confirmCompleteTransaction 완료');
                        // 거래완료 처리가 성공한 후에 변수 초기화
                        currentItemForAuth = null;
                        authAction = null;
                    })
                    .catch((error) => {
                        console.error('❌ 거래완료 처리 오류:', error);
                        alert('거래완료 처리 중 오류가 발생했습니다: ' + error.message);
                        // 오류 발생시에도 변수 초기화
                        currentItemForAuth = null;
                        authAction = null;
                    });
            } else {
                console.log('❓ authAction이 complete가 아님:', currentAuthAction);
                // 거래완료가 아닌 경우에도 변수 초기화
                currentItemForAuth = null;
                authAction = null;
            }
            
        } else {
            // 인증 실패 - 구체적인 오류 정보 제공
            let errorMessage = '판매자 정보가 일치하지 않습니다.\n\n';
            
            if (inputNameNormalized !== sellerNameNormalized) {
                errorMessage += `❌ 이름 불일치\n`;
                errorMessage += `입력: "${inputName}"\n`;
                errorMessage += `등록된 이름: "${currentItemForAuth.sellerName}"\n\n`;
            }
            
            if (inputContactNormalized !== sellerContactNormalized) {
                errorMessage += `❌ 연락처 불일치\n`;
                errorMessage += `입력: "${inputContact}" (숫자만: ${inputContactNormalized})\n`;
                errorMessage += `등록된 연락처: "${currentItemForAuth.sellerContact}" (숫자만: ${sellerContactNormalized})\n\n`;
            }
            
            errorMessage += '등록시 입력한 정보와 정확히 일치하게 입력해주세요.';
            
            alert(errorMessage);
            
            // 입력 필드 초기화
            const nameInput = document.getElementById('authSellerName');
            const contactInput = document.getElementById('authSellerContact');
            
            if (nameInput) nameInput.value = '';
            if (contactInput) contactInput.value = '';
            if (nameInput) nameInput.focus();
        }
        
    } catch (error) {
        console.error('판매자 인증 중 오류 발생:', error);
        alert('인증 처리 중 오류가 발생했습니다.');
    }
}

// 거래 완료 처리 확인
async function confirmCompleteTransaction() {
    console.log('🔄 거래완료 처리 시작:', currentItemIdForComplete);
    
    if (!currentItemIdForComplete) {
        alert('오류: 거래할 물건 정보가 없습니다.\n\n다시 시도해주세요.');
        throw new Error('currentItemIdForComplete가 없습니다');
    }
    
    try {
        const items = loadFromLocalStorage('items', []);
        console.log('📦 저장된 아이템 개수:', items.length);
        
        const itemIndex = items.findIndex(item => item.id === currentItemIdForComplete);
        console.log('🔍 찾은 아이템 인덱스:', itemIndex);
        
        if (itemIndex !== -1) {
            const itemName = items[itemIndex].name;
            console.log('📝 변경 전 상태:', items[itemIndex].status);
            
            // 상태를 sold로 변경
            items[itemIndex].status = 'sold';
            console.log('✅ 변경 후 상태:', items[itemIndex].status);
            
            // 저장 시도
            const saveResult = saveToLocalStorage('items', items);
            console.log('💾 저장 결과:', saveResult);
            
            if (saveResult) {
                alert(`"${itemName}" 거래가 완료되었습니다!`);
                
                // UI 업데이트
                currentItemIdForComplete = null;
                
                // 모달 닫기
                const detailModal = document.getElementById('itemDetailModal');
                if (detailModal) {
                    detailModal.style.display = 'none';
                }
                
                // 목록 새로고침 - 강제로 다시 로드
                console.log('🔄 UI 업데이트 시작');
                const updatedItems = loadFromLocalStorage('items', []);
                currentItems = updatedItems;
                console.log('📋 업데이트된 currentItems:', currentItems.length);
                displayItems();
                console.log('✅ UI 업데이트 완료');
                
                return true;
            } else {
                throw new Error('저장에 실패했습니다.');
            }
        } else {
            const errorMsg = '해당 물건을 찾을 수 없습니다. 페이지를 새로고침해주세요.';
            alert('오류: ' + errorMsg);
            throw new Error(errorMsg);
        }
        
    } catch (error) {
        console.error('❌ 거래완료 처리 오류:', error);
        alert('거래 완료 처리 중 오류가 발생했습니다: ' + error.message);
        throw error;
    }
}



// 물건 삭제
async function deleteItem(itemId) {
    if (!isAdmin) {
        alert('관리자만 삭제할 수 있습니다.');
        return;
    }
    
    if (confirm('정말로 이 물건을 삭제하시겠습니까?')) {
        try {
            const items = loadFromLocalStorage('items', []);
            const filteredItems = items.filter(item => item.id !== itemId);
            saveToLocalStorage('items', filteredItems);
            
            alert('물건이 삭제되었습니다.');
            
            // 목록 새로고침
            loadItems();
        } catch (error) {
            console.error('삭제 중 오류 발생:', error);
            alert('삭제 중 오류가 발생했습니다.');
        }
    }
}

// 정렬
function sortItems() {
    const sortBy = document.getElementById('sortSelect').value;
    
    currentItems.sort((a, b) => {
        switch (sortBy) {
            case 'latest':
                return b.timestamp - a.timestamp;
            case 'priceAsc':
                return a.price - b.price;
            case 'priceDesc':
                return b.price - a.price;
            case 'name':
                return a.name.localeCompare(b.name);
            default:
                return b.timestamp - a.timestamp;
        }
    });
    
    displayItems();
}

// 관리자 로그인
async function handleAdminLogin() {
    const password = document.getElementById('adminPassword').value;
    
    if (password === 'admin123') {
        isAdmin = true;
        localStorage.setItem('adminLoggedIn', 'true');
        
        updateAdminUI();
        closeModals();
        alert('🔒 관리자로 로그인되었습니다!\n\n📋 관리자 권한:\n• 모든 물건 삭제 가능\n• 모든 거래 완료 처리 가능\n• 모든 연락처 정보 조회 가능\n\n⚠️ 삭제 버튼이 각 물건에 표시됩니다.');
    } else {
        alert('❌ 비밀번호가 틀렸습니다.\n관리자 비밀번호를 확인해주세요.');
    }
}

// 관리자 로그아웃
async function handleAdminLogout() {
    isAdmin = false;
    localStorage.removeItem('adminLoggedIn');
    
    updateAdminUI();
    alert('👋 관리자에서 로그아웃되었습니다.\n삭제 버튼이 숨겨지고 일반 사용자 모드로 전환됩니다.');
}

// 관리자 UI 업데이트
function updateAdminUI() {
    const adminBtn = document.getElementById('adminBtn');
    const adminStatus = document.getElementById('adminStatus');
    
    if (isAdmin) {
        adminBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> 관리자 로그아웃';
        adminBtn.classList.remove('btn-secondary');
        adminBtn.classList.add('btn-danger');
        adminBtn.title = '관리자 로그아웃';
        
        // 관리자 상태 표시
        if (adminStatus) {
            adminStatus.style.display = 'flex';
        }
    } else {
        adminBtn.innerHTML = '<i class="fas fa-key"></i> 관리자 로그인';
        adminBtn.classList.remove('btn-danger');
        adminBtn.classList.add('btn-secondary');
        adminBtn.title = '관리자 로그인';
        
        // 관리자 상태 숨기기
        if (adminStatus) {
            adminStatus.style.display = 'none';
        }
    }
    
    // 관리자 버튼은 항상 표시
    adminBtn.style.display = 'inline-block';
    
    displayItems(); // 관리자 상태 변경 시 아이템 다시 표시
}





// 디버깅용 테스트 함수들 (개발자 도구에서 사용)
window.testComplete = {
    // 현재 상태 확인
    checkStatus: () => {
        console.log('=== 현재 상태 ===');
        console.log('관리자 모드:', isAdmin);
        console.log('저장된 아이템 수:', loadFromLocalStorage('items', []).length);
        console.log('현재 아이템 수:', currentItems.length);
        console.log('currentItemIdForComplete:', currentItemIdForComplete);
        console.log('currentItemForAuth:', currentItemForAuth);
        console.log('authAction:', authAction);
        
        const items = loadFromLocalStorage('items', []);
        console.log('저장된 아이템들:', items);
    },
    
    // 샘플 아이템 추가 (테스트용)
    addTestItem: () => {
        const testItem = {
            id: generateId(),
            name: '테스트 물건',
            images: [],
            usagePeriod: '1년',
            usageYears: 1,
            usageMonths: 0,
            purchasePrice: 100000,
            price: 50000,
            description: '거래완료 테스트용 물건입니다.',
            sellerName: '테스트',
            sellerContact: '010-1234-5678',
            timestamp: Date.now(),
            status: 'available'
        };
        
        const items = loadFromLocalStorage('items', []);
        items.push(testItem);
        saveToLocalStorage('items', items);
        loadItems();
        
        console.log('✅ 테스트 아이템 추가 완료');
        console.log('📋 아이템 정보:', testItem);
        console.log('💡 거래완료 테스트 방법:');
        console.log('1. 거래완료 버튼 클릭');
        console.log('2. 이름: 테스트');
        console.log('3. 연락처: 010-1234-5678');
    },
    
    // 모든 데이터 삭제
    clearAll: () => {
        localStorage.removeItem('items');
        loadItems();
        console.log('✅ 모든 데이터 삭제 완료');
    }
};



// 전역 함수로 내보내기 (HTML에서 onclick으로 사용)
window.changeImage = changeImage;
window.navigateImage = navigateImage;
window.navigateDetailImage = navigateDetailImage;
window.openCompleteModal = openCompleteModal;
window.deleteItem = deleteItem;
window.removeFile = removeFile;
window.openItemDetail = openItemDetail;
window.changeDetailImage = changeDetailImage;
window.closeSellerAuthModal = closeSellerAuthModal; 