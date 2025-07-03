// 전역 변수
let items = [];
let selectedFiles = []; // 선택된 파일들을 저장하는 배열
let isAdmin = false; // 관리자 상태

// Firebase 관련 함수들
async function loadItemsFromFirebase() {
    if (!window.firebase) {
        console.log('Firebase가 아직 로드되지 않았습니다. 재시도 중...');
        setTimeout(loadItemsFromFirebase, 100);
        return;
    }
    
    try {
        const { database, ref, get } = window.firebase;
        const itemsRef = ref(database, 'items');
        const snapshot = await get(itemsRef);
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            items = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
            console.log('Firebase에서 물건 목록 로드됨:', items.length, '개');
        } else {
            console.log('Firebase에 저장된 물건이 없습니다.');
            items = [];
        }
        
        renderItems();
    } catch (error) {
        console.error('Firebase에서 데이터 로드 실패:', error);
        items = [];
        renderItems();
    }
}

async function loadAdminStatusFromFirebase() {
    if (!window.firebase) {
        console.log('Firebase가 아직 로드되지 않았습니다.');
        return;
    }
    
    try {
        const { database, ref, get } = window.firebase;
        const adminRef = ref(database, 'admin/isLoggedIn');
        const snapshot = await get(adminRef);
        
        if (snapshot.exists()) {
            isAdmin = snapshot.val();
            console.log('Firebase에서 관리자 상태 로드됨:', isAdmin);
        } else {
            isAdmin = false;
        }
        
        updateAdminUI();
    } catch (error) {
        console.error('Firebase에서 관리자 상태 로드 실패:', error);
        isAdmin = false;
        updateAdminUI();
    }
}

// DOM 요소들
const addItemBtn = document.getElementById('addItemBtn');
const addItemModal = document.getElementById('addItemModal');
const adminModal = document.getElementById('adminModal');
const adminBtn = document.getElementById('adminBtn');
const addItemForm = document.getElementById('addItemForm');
const itemsList = document.getElementById('itemsList');
const emptyState = document.getElementById('emptyState');
const sortSelect = document.getElementById('sortSelect');
const imageInput = document.getElementById('itemImage');
const imagePreview = document.getElementById('imagePreview');

// 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    // Firebase에서 데이터 로드
    loadItemsFromFirebase();
    loadAdminStatusFromFirebase();
});

function setupEventListeners() {
    // DOM 요소들 확인
    console.log('DOM 요소들 확인:', {
        addItemBtn: !!addItemBtn,
        addItemModal: !!addItemModal,
        adminModal: !!adminModal,
        adminBtn: !!adminBtn,
        addItemForm: !!addItemForm,
        imageInput: !!imageInput,
        imagePreview: !!imagePreview,
        sortSelect: !!sortSelect
    });
    
    // 모달 열기/닫기
    if (addItemBtn) {
        addItemBtn.addEventListener('click', () => openModal(addItemModal));
    }
    if (adminBtn) {
        adminBtn.addEventListener('click', () => {
            if (isAdmin) {
                logout();
            } else {
                openModal(adminModal);
            }
        });
    }
    
    // 모달 닫기 (X 버튼 클릭)
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            closeModal(this.closest('.modal'));
        });
    });
    
    // 모달 닫기 (배경 클릭) - 입찰 모달은 제외
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal') && event.target.id !== 'bidModal') {
            closeModal(event.target);
        }
    });
    
    // 폼 제출
    if (addItemForm) {
        addItemForm.addEventListener('submit', handleAddItem);
    }
    
    // 다중 파일 업로드 및 드래그 앤 드롭
    setupFileUpload();
    
    // 정렬
    if (sortSelect) {
        sortSelect.addEventListener('change', filterItems);
    }
    
    // 관리자 로그인
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const adminPassword = document.getElementById('adminPassword');
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', handleAdminLogin);
    }
    if (adminPassword) {
        adminPassword.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleAdminLogin();
            }
        });
    }
}

// 모달 관리
function openModal(modal) {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // 관리자 모달인 경우 비밀번호 필드 초기화
    if (modal === adminModal) {
        const adminPassword = document.getElementById('adminPassword');
        if (adminPassword) {
            adminPassword.value = '';
            adminPassword.focus();
        }
    }
}

function closeModal(modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // 폼 리셋
    if (modal === addItemModal) {
        addItemForm.reset();
        
        // 파일 업로드 관련 초기화
        selectedFiles = []; // 선택된 파일 목록 초기화
        
        const selectedFilesList = document.getElementById('selectedFilesList');
        const imagePreview = document.getElementById('imagePreview');
        
        if (selectedFilesList) {
            selectedFilesList.innerHTML = '';
        }
        
        if (imagePreview) {
            imagePreview.innerHTML = '';
        }
        
        // 업로드 버튼 초기 상태로 리셋
        resetUploadButtonState();
    }
}

// 파일 업로드 시스템 초기화
function setupFileUpload() {
    const fileUploadBtn = document.getElementById('fileUploadBtn');
    const selectedFilesList = document.getElementById('selectedFilesList');
    const imagePreview = document.getElementById('imagePreview');
    
    if (!imageInput || !fileUploadBtn) {
        console.error('파일 업로드 요소들을 찾을 수 없습니다');
        return;
    }
    
    console.log('파일 업로드 시스템 초기화됨');
    console.log('직접 클릭 트리거 방식으로 파일 선택 구현됨');
    
    // 파일 입력 변경 이벤트
    imageInput.addEventListener('change', function(e) {
        console.log('파일 입력 change 이벤트 발생');
        console.log('선택된 파일들:', e.target.files);
        console.log('파일 개수:', e.target.files.length);
        
        if (e.target.files.length > 0) {
            console.log('파일 처리 시작...');
            handleFileSelection(e.target.files);
        } else {
            console.log('선택된 파일이 없습니다.');
        }
    });
    
    // 파일 업로드 버튼 클릭 이벤트 (여러 방법 시도)
    fileUploadBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('파일 업로드 버튼 클릭됨 - 파일 탐색기 열기 시도');
        
        // 드래그 오버 상태가 아닐 때만 파일 선택 트리거
        if (!fileUploadBtn.classList.contains('drag-over')) {
            console.log('파일 input 요소:', imageInput);
            console.log('input이 DOM에 있는가?', document.contains(imageInput));
            
            // 방법 1: 포커스 후 클릭
            try {
                console.log('방법 1: 포커스를 준 후 클릭');
                imageInput.focus();
                imageInput.click();
                console.log('방법 1 완료');
            } catch (error) {
                console.error('방법 1 실패:', error);
                
                // 방법 2: 약간의 지연 후 클릭
                try {
                    console.log('방법 2: 지연 후 클릭');
                    setTimeout(() => {
                        imageInput.click();
                        console.log('방법 2 완료');
                    }, 10);
                } catch (error2) {
                    console.error('방법 2 실패:', error2);
                    
                    // 방법 3: 이벤트 생성해서 클릭
                    try {
                        console.log('방법 3: 클릭 이벤트 생성');
                        const clickEvent = new MouseEvent('click', {
                            view: window,
                            bubbles: true,
                            cancelable: true
                        });
                        imageInput.dispatchEvent(clickEvent);
                        console.log('방법 3 완료');
                    } catch (error3) {
                        console.error('모든 방법 실패:', error3);
                        alert('파일 선택기가 작동하지 않습니다. 드래그 앤 드롭을 사용해주세요.');
                    }
                }
            }
        }
    });
    
    // 터치 이벤트 (모바일 대응)
    fileUploadBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        console.log('터치 이벤트 - 파일 선택 시도');
        imageInput.click();
    });
    
    // 드래그 앤 드롭 이벤트들
    setupDragAndDrop(fileUploadBtn);
}

// 드래그 앤 드롭 설정
function setupDragAndDrop(dropZone) {
    // 기본 드래그 동작 방지
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    // 드래그 오버 효과
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });
    
    // 파일 드롭 처리
    dropZone.addEventListener('drop', handleDrop, false);
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight(e) {
        dropZone.classList.add('drag-over');
    }
    
    function unhighlight(e) {
        dropZone.classList.remove('drag-over');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        console.log('=== 드래그 앤 드롭 이벤트 ===');
        console.log('드롭된 파일 개수:', files.length);
        console.log('드롭된 파일들:', files);
        handleFileSelection(files);
    }
}

// 파일 선택 처리
function handleFileSelection(files) {
    console.log('=== handleFileSelection 함수 호출됨 ===');
    console.log('전달받은 파일 수:', files.length);
    console.log('현재 selectedFiles 개수:', selectedFiles.length);
    
    const validFiles = [];
    
    // 파일 유효성 검사
    Array.from(files).forEach((file, index) => {
        console.log(`파일 ${index + 1} 검사 중:`, file.name, file.type, file.size);
        
        if (file.type.startsWith('image/')) {
            if (file.size > 10 * 1024 * 1024) { // 10MB 제한
                console.log(`파일 크기 초과: ${file.name}`);
                showNotification(`${file.name}은 10MB를 초과합니다.`, 'error');
            } else {
                console.log(`유효한 파일: ${file.name}`);
                validFiles.push(file);
            }
        } else {
            console.log(`이미지가 아닌 파일: ${file.name}`);
            showNotification(`${file.name}은 이미지 파일이 아닙니다.`, 'error');
        }
    });
    
    console.log('유효한 파일 수:', validFiles.length);
    
    // 선택된 파일들에 추가
    let addedFiles = 0;
    validFiles.forEach(file => {
        // 중복 파일 체크 (파일명과 크기로)
        const isDuplicate = selectedFiles.some(existingFile => 
            existingFile.name === file.name && existingFile.size === file.size
        );
        
        if (!isDuplicate) {
            selectedFiles.push(file);
            addedFiles++;
            console.log(`파일 추가됨: ${file.name}`);
        } else {
            console.log(`중복 파일 제외: ${file.name}`);
            showNotification(`${file.name}은 이미 선택된 파일입니다.`, 'info');
        }
    });
    
    console.log(`총 ${addedFiles}개 파일 추가됨`);
    console.log('현재 선택된 파일 총 개수:', selectedFiles.length);
    console.log('최종 selectedFiles 내용:', selectedFiles);
    
    updateFilesList();
    updateImagePreview();
    updateUploadButtonState();
    
    if (addedFiles > 0) {
        showNotification(`${addedFiles}개의 사진이 선택되었습니다.`, 'success');
    }
}

// 파일 목록 업데이트
function updateFilesList() {
    const selectedFilesList = document.getElementById('selectedFilesList');
    
    if (selectedFiles.length === 0) {
        selectedFilesList.innerHTML = '';
        return;
    }
    
    // 전체 삭제 버튼과 파일 목록 헤더
    let headerHTML = `
        <div class="files-list-header">
            <div class="files-count">
                <i class="fas fa-images"></i>
                선택된 사진: ${selectedFiles.length}장
            </div>
            <button class="clear-all-files" onclick="clearAllFiles()">
                <i class="fas fa-trash"></i>
                전체 삭제
            </button>
        </div>
    `;
    
    // 개별 파일 목록
    let filesHTML = selectedFiles.map((file, index) => `
        <div class="selected-file-item">
            <div class="file-info">
                <i class="fas fa-image"></i>
                <span class="file-name">${file.name}</span>
                <span class="file-size">(${formatFileSize(file.size)})</span>
            </div>
            <button class="remove-file" onclick="removeFile(${index})" title="이 사진 삭제">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
    
    selectedFilesList.innerHTML = headerHTML + filesHTML;
}

// 이미지 미리보기 업데이트
function updateImagePreview() {
    const imagePreview = document.getElementById('imagePreview');
    
    if (selectedFiles.length === 0) {
        imagePreview.innerHTML = '';
        return;
    }
    
    imagePreview.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.innerHTML = `
                <img src="${e.target.result}" alt="${file.name}">
                <button class="remove-preview" onclick="removeFile(${index})">
                    <i class="fas fa-times"></i>
                </button>
                <div class="image-name">${file.name}</div>
            `;
            imagePreview.appendChild(previewItem);
        };
        reader.readAsDataURL(file);
    });
}

// 업로드 버튼 상태 업데이트
function updateUploadButtonState() {
    const fileUploadBtn = document.getElementById('fileUploadBtn');
    const uploadContent = fileUploadBtn.querySelector('.upload-content');
    
    if (selectedFiles.length > 0) {
        fileUploadBtn.style.borderColor = '#28a745';
        fileUploadBtn.style.background = 'linear-gradient(135deg, rgba(40, 167, 69, 0.1), rgba(40, 167, 69, 0.05))';
        uploadContent.querySelector('i').style.color = '#28a745';
        uploadContent.querySelector('span').textContent = `${selectedFiles.length}개 사진 선택됨`;
        uploadContent.querySelector('small').textContent = '더 추가하려면 클릭하거나 드래그하세요';
    } else {
        resetUploadButtonState();
    }
}

// 업로드 버튼 초기 상태로 리셋
function resetUploadButtonState() {
    const fileUploadBtn = document.getElementById('fileUploadBtn');
    const uploadContent = fileUploadBtn.querySelector('.upload-content');
    
    if (fileUploadBtn && uploadContent) {
        fileUploadBtn.style.borderColor = '#667eea';
        fileUploadBtn.style.background = 'linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05))';
        uploadContent.querySelector('i').style.color = '#667eea';
        uploadContent.querySelector('span').textContent = '사진 선택하기';
        uploadContent.querySelector('small').textContent = '클릭하여 선택하거나 여기에 드래그해서 업로드하세요';
    }
}

// 개별 파일 제거
function removeFile(index) {
    const fileName = selectedFiles[index].name;
    selectedFiles.splice(index, 1);
    updateFilesList();
    updateImagePreview();
    updateUploadButtonState();
    
    showNotification(`${fileName}이(가) 제거되었습니다.`, 'info');
}

// 전체 파일 삭제
function clearAllFiles() {
    if (selectedFiles.length === 0) {
        return;
    }
    
    const fileCount = selectedFiles.length;
    
    // 확인 대화상자
    if (confirm(`선택된 ${fileCount}장의 사진을 모두 삭제하시겠습니까?`)) {
        selectedFiles = [];
        updateFilesList();
        updateImagePreview();
        updateUploadButtonState();
        
        // 파일 입력 요소도 초기화
        const imageInput = document.getElementById('itemImage');
        if (imageInput) {
            imageInput.value = '';
        }
        
        showNotification(`${fileCount}장의 사진이 모두 삭제되었습니다.`, 'success');
    }
}

// 파일 크기 포맷팅
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 이미지 압축 함수
function compressImage(file, callback, maxWidth = 1000, maxHeight = 750, quality = 0.9) {
    console.log(`이미지 압축 시작: ${file.name} (${formatFileSize(file.size)})`);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
        console.log(`원본 이미지 크기: ${img.width}x${img.height}`);
        
        // 비율을 유지하면서 크기 조정 계산
        let { width, height } = img;
        
        if (width > height) {
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
        } else {
            if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
            }
        }
        
        console.log(`압축된 이미지 크기: ${width}x${height}`);
        
        // 캔버스 크기 설정
        canvas.width = width;
        canvas.height = height;
        
        // 이미지를 캔버스에 그리기
        ctx.drawImage(img, 0, 0, width, height);
        
        // 압축된 이미지를 base64로 변환
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // 압축된 크기 계산 (대략적으로)
        const compressedSize = Math.round(compressedDataUrl.length * 0.75);
        console.log(`압축 완료: ${formatFileSize(compressedSize)} (압축률: ${Math.round((1 - compressedSize/file.size) * 100)}%)`);
        
        callback(compressedDataUrl);
    };
    
    img.onerror = function() {
        console.error('이미지 로드 실패:', file.name);
        // 압축 실패 시 원본 파일을 base64로 변환
        const reader = new FileReader();
        reader.onload = function(e) {
            callback(e.target.result);
        };
        reader.readAsDataURL(file);
    };
    
    // 이미지 로드
    const reader = new FileReader();
    reader.onload = function(e) {
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// 물건 추가
function handleAddItem(event) {
    event.preventDefault();
    
    console.log('=== 물건 등록 시작 ===');
    console.log('selectedFiles 개수:', selectedFiles.length);
    console.log('selectedFiles 내용:', selectedFiles);
    
    // form의 파일 input도 확인
    const formFiles = imageInput.files;
    console.log('form 파일 input 개수:', formFiles.length);
    console.log('form 파일 내용:', formFiles);
    
    // 파일이 선택되었는지 확인 (selectedFiles 또는 form 파일 중 하나라도 있으면 됨)
    const hasFiles = selectedFiles.length > 0 || formFiles.length > 0;
    if (!hasFiles) {
        console.log('파일이 선택되지 않음 - 에러 메시지 표시');
        showNotification('사진을 하나 이상 선택해주세요.', 'error');
        return;
    }
    
    console.log('파일 검사 통과 - 등록 진행');
    
    // selectedFiles가 비어있으면 form 파일을 사용
    const filesToProcess = selectedFiles.length > 0 ? selectedFiles : Array.from(formFiles);
    console.log('처리할 파일들:', filesToProcess);
    
    const formData = new FormData(addItemForm);
    const images = [];
    let processedImages = 0;
    
    // 모든 이미지를 압축하여 base64로 변환
    filesToProcess.forEach((file, index) => {
        // 이미지 압축 함수 호출
        compressImage(file, (compressedDataUrl) => {
            images[index] = {
                data: compressedDataUrl,
                name: file.name,
                size: file.size,
                compressed: true
            };
            
            processedImages++;
            
            // 모든 이미지 처리가 완료되면 아이템 생성
            if (processedImages === filesToProcess.length) {
                const newItem = {
                    id: Date.now(),
                    name: formData.get('itemName'),
                    price: parseInt(formData.get('itemPrice')),
                    purchaseDate: formData.get('purchaseDate'),
                    purchasePrice: parseInt(formData.get('purchasePrice')),
                    description: formData.get('itemDescription'),
                    seller: formData.get('sellerName'),
                    images: images,
                    mainImage: images[0].data, // 첫 번째 이미지를 메인 이미지로
                    date: new Date().toISOString(),
                    bids: [], // 입찰 목록
                    isLiveAuction: false // 현장경매 여부
                };
                
                items.unshift(newItem); // 최신 순으로 추가
                
                try {
                    saveItems();
                    renderItems();
                    
                    // 폼과 파일 목록 초기화
                    addItemForm.reset();
                    selectedFiles = [];
                    updateFilesList();
                    updateImagePreview();
                    resetUploadButtonState();
                    
                    closeModal(addItemModal);
                    
                    showNotification(`물건이 성공적으로 등록되었습니다! (${images.length}장의 사진)`, 'success');
                } catch (error) {
                    console.error('저장 중 오류 발생:', error);
                    if (error.name === 'QuotaExceededError') {
                        showNotification('저장 공간이 부족합니다. 이미지를 더 작게 해서 다시 시도해주세요.', 'error');
                    } else {
                        showNotification('물건 등록 중 오류가 발생했습니다.', 'error');
                    }
                    // 실패 시 아이템 목록에서 제거
                    items.shift();
                }
            }
        });
    });
}

// 데이터 저장
async function saveItems() {
    if (!window.firebase) {
        console.error('Firebase가 로드되지 않아 데이터를 저장할 수 없습니다.');
        return;
    }
    
    try {
        const { database, ref, set } = window.firebase;
        
        // items 배열을 객체로 변환 (Firebase는 배열보다 객체가 효율적)
        const itemsObject = {};
        items.forEach(item => {
            itemsObject[item.id] = item;
        });
        
        const itemsRef = ref(database, 'items');
        await set(itemsRef, itemsObject);
        
        console.log('Firebase에 물건 목록 저장 완료');
    } catch (error) {
        console.error('Firebase 저장 실패:', error);
        throw error; // 에러를 다시 던져서 호출하는 곳에서 처리할 수 있도록
    }
}

// 물건 목록 렌더링
function renderItems(itemsToRender = items) {
    if (itemsToRender.length === 0) {
        itemsList.style.display = 'none';
        emptyState.style.display = 'block';
    } else {
        itemsList.style.display = 'grid';
        emptyState.style.display = 'none';
        
        itemsList.innerHTML = itemsToRender.map(item => {
            // 이전 버전 호환성을 위해 mainImage가 없으면 image 사용
            const mainImage = item.mainImage || item.image;
            const imageCount = item.images ? item.images.length : 1;
            
            // 입찰 관련 정보 계산
            const bids = item.bids || [];
            const highestBid = bids.length > 0 ? Math.max(...bids.map(bid => bid.amount)) : 0;
            const currentPrice = Math.max(item.price, highestBid);
            const bidCount = bids.length;
            
            return `
                <div class="item-card fade-in" data-id="${item.id}">
                    <div class="item-image-container" onclick="showItemDetails(${item.id})">
                        <img src="${mainImage}" alt="${item.name}" class="item-image">
                        ${imageCount > 1 ? `
                            <div class="image-count-badge">
                                <i class="fas fa-images"></i>
                                ${imageCount}
                            </div>
                        ` : ''}
                        ${bidCount > 0 ? `
                            <div class="bid-count-badge">
                                <i class="fas fa-gavel"></i>
                                ${bidCount}
                            </div>
                        ` : ''}
                        ${item.isLiveAuction ? `
                            <div class="live-auction-badge">
                                <i class="fas fa-microphone"></i>
                                현장경매
                            </div>
                        ` : ''}
                    </div>
                    <div class="item-info" onclick="showItemDetails(${item.id})">
                        <div class="item-name">${escapeHtml(item.name)}</div>
                        <div class="item-price-info">
                            <div class="current-price">${formatPrice(currentPrice)}원</div>
                            ${highestBid > 0 ? `
                                <div class="start-price">시작가: ${formatPrice(item.price)}원</div>
                            ` : `
                                <div class="start-price">시작가</div>
                            `}
                        </div>
                        <div class="item-description">${escapeHtml(item.description)}</div>
                        <div class="item-purchase-info">
                            ${item.purchaseDate ? `
                                <div class="purchase-date">
                                    <i class="fas fa-calendar"></i> ${formatDate(item.purchaseDate)}
                                </div>
                            ` : ''}
                            ${item.purchasePrice ? `
                                <div class="purchase-price">
                                    <i class="fas fa-won-sign"></i> 구매가: ${formatPrice(item.purchasePrice)}원
                                </div>
                            ` : ''}
                        </div>
                        <div class="item-seller">
                            <i class="fas fa-user"></i> ${escapeHtml(item.seller)}
                            <div class="item-date">${formatDate(item.date)}</div>
                        </div>
                    </div>
                    <div class="item-actions">
                        ${!item.isLiveAuction ? `
                            <button class="bid-btn" onclick="openBidModal(${item.id})" title="입찰하기">
                                <i class="fas fa-gavel"></i> 입찰
                            </button>
                        ` : `
                            <button class="live-auction-btn" disabled title="현장경매 진행중">
                                <i class="fas fa-microphone"></i> 현장경매
                            </button>
                        `}
                        <button class="delete-item-btn" onclick="deleteItem(${item.id})" title="이 물건 삭제" 
                                style="display: ${isAdmin ? 'block' : 'none'};">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// 물건 상세보기 (다중 이미지 표시)
function showItemDetails(itemId) {
    const item = items.find(item => item.id === itemId);
    if (!item) return;
    
    // 이미지 갤러리 모달 생성
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    const images = item.images || [{ data: item.image, name: item.name }];
    
    modal.innerHTML = `
        <div class="modal-content item-detail-modal">
            <div class="modal-header">
                <h2><i class="fas fa-info-circle"></i> ${escapeHtml(item.name)}</h2>
                <span class="close">&times;</span>
            </div>
            <div class="item-detail-content">
                <div class="item-gallery">
                    <div class="main-image">
                        <img id="mainDisplayImage" src="${images[0].data}" alt="${item.name}">
                    </div>
                    ${images.length > 1 ? `
                        <div class="thumbnail-gallery">
                            ${images.map((img, index) => `
                                <img src="${img.data}" alt="${img.name}" 
                                     class="thumbnail ${index === 0 ? 'active' : ''}"
                                     onclick="changeMainImage('${img.data}', this)">
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="item-details">
                    <div class="detail-price">${formatPrice(item.price)}원</div>
                    <div class="detail-description">${escapeHtml(item.description)}</div>
                    <div class="detail-seller">
                        <i class="fas fa-user"></i> ${escapeHtml(item.seller)}
                    </div>
                    <div class="detail-date">
                        <i class="fas fa-clock"></i> ${formatDate(item.date)}
                    </div>
                    <div class="detail-images-info">
                        <i class="fas fa-images"></i> ${images.length}장의 사진
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // 모달 닫기 이벤트
    modal.querySelector('.close').addEventListener('click', () => {
        document.body.removeChild(modal);
        document.body.style.overflow = 'auto';
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
            document.body.style.overflow = 'auto';
        }
    });
}

// 메인 이미지 변경
function changeMainImage(imageSrc, thumbnail) {
    document.getElementById('mainDisplayImage').src = imageSrc;
    
    // 썸네일 활성화 상태 변경
    document.querySelectorAll('.thumbnail').forEach(thumb => {
        thumb.classList.remove('active');
    });
    thumbnail.classList.add('active');
}

// 정렬
function filterItems() {
    const sortBy = sortSelect.value;
    
    let sortedItems = [...items]; // 모든 아이템을 복사
    
    // 정렬
    switch (sortBy) {
        case 'latest':
            sortedItems.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'priceAsc':
            sortedItems.sort((a, b) => a.price - b.price);
            break;
        case 'priceDesc':
            sortedItems.sort((a, b) => b.price - a.price);
            break;
        case 'name':
            sortedItems.sort((a, b) => a.name.localeCompare(b.name));
            break;
    }
    
    renderItems(sortedItems);
}

// 관리자 로그인 처리
async function handleAdminLogin() {
    const adminPassword = document.getElementById('adminPassword');
    const password = adminPassword.value;
    
    // 간단한 비밀번호 (실제 운영에서는 더 안전한 방법 사용)
    if (password === 'admin123') {
        isAdmin = true;
        
        // Firebase에 관리자 상태 저장
        if (window.firebase) {
            try {
                const { database, ref, set } = window.firebase;
                const adminRef = ref(database, 'admin/isLoggedIn');
                await set(adminRef, true);
                console.log('Firebase에 관리자 상태 저장 완료');
            } catch (error) {
                console.error('Firebase에 관리자 상태 저장 실패:', error);
            }
        }
        
        closeModal(adminModal);
        updateAdminUI();
        showNotification('관리자로 로그인되었습니다.', 'success');
    } else {
        showNotification('비밀번호가 틀렸습니다.', 'error');
        adminPassword.value = '';
        adminPassword.focus();
    }
}

// 관리자 로그아웃
async function logout() {
    isAdmin = false;
    
    // Firebase에 관리자 상태 저장
    if (window.firebase) {
        try {
            const { database, ref, set } = window.firebase;
            const adminRef = ref(database, 'admin/isLoggedIn');
            await set(adminRef, false);
            console.log('Firebase에 관리자 로그아웃 상태 저장 완료');
        } catch (error) {
            console.error('Firebase에 관리자 상태 저장 실패:', error);
        }
    }
    
    updateAdminUI();
    showNotification('로그아웃되었습니다.', 'info');
}

// 관리자 UI 상태 업데이트
function updateAdminUI() {
    const adminBtn = document.getElementById('adminBtn');
    
    if (isAdmin) {
        adminBtn.style.display = 'inline-block';
        adminBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> 로그아웃';
        adminBtn.title = '관리자 로그아웃';
    } else {
        adminBtn.style.display = 'inline-block';
        adminBtn.innerHTML = '<i class="fas fa-key"></i> 관리자';
        adminBtn.title = '관리자 로그인';
    }
    
    // 삭제 버튼들 표시/숨기기
    const deleteButtons = document.querySelectorAll('.delete-item-btn');
    deleteButtons.forEach(btn => {
        btn.style.display = isAdmin ? 'block' : 'none';
    });
}

// 유틸리티 함수들
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function formatPrice(price) {
    return price.toLocaleString('ko-KR');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (days > 0) {
        return `${days}일 전`;
    } else if (hours > 0) {
        return `${hours}시간 전`;
    } else if (minutes > 0) {
        return `${minutes}분 전`;
    } else {
        return '방금 전';
    }
}

// 알림 시스템
function showNotification(message, type = 'info') {
    // 기존 알림 제거
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // 스타일 추가
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        font-weight: 500;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // 3초 후 자동 제거
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// 애니메이션 CSS 동적 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
`;
document.head.appendChild(style);

// PWA 지원 제거 (ServiceWorker 파일이 없으므로 비활성화)

// 터치 이벤트 지원 (모바일)
let touchStartY = 0;
let touchEndY = 0;

document.addEventListener('touchstart', function(event) {
    touchStartY = event.changedTouches[0].screenY;
});

document.addEventListener('touchend', function(event) {
    touchEndY = event.changedTouches[0].screenY;
    handleSwipe();
});

function handleSwipe() {
    // 스와이프 기능 비활성화 - 실수로 물건 등록이 되는 것을 방지
    // const swipeThreshold = 50;
    // const diff = touchStartY - touchEndY;
    
    // if (Math.abs(diff) > swipeThreshold) {
    //     if (diff > 0) {
    //         // 위로 스와이프 - 물건 등록 모달 열기
    //         const addItemBtn = document.getElementById('addItemBtn');
    //         if (addItemBtn) {
    //             addItemBtn.click();
    //         }
    //     }
    // }
}

// 키보드 단축키
document.addEventListener('keydown', function(event) {
    // Ctrl/Cmd + N: 새 물건 등록
    if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        openModal(addItemModal);
    }
    
    // Ctrl/Cmd + A: 관리자 로그인/로그아웃
    if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        event.preventDefault();
        if (isAdmin) {
            logout();
        } else {
            openModal(adminModal);
        }
    }
    
    // ESC: 모달 닫기
    if (event.key === 'Escape') {
        const openModal = document.querySelector('.modal[style*="block"]');
        if (openModal) {
            closeModal(openModal);
        }
    }
});

// 개발자 도구용 함수들 (선택사항)
window.bazaarApp = {
    items,
    addSampleData: function() {
        const sampleItems = [
            {
                id: Date.now() + 1,
                name: '아이폰 13',
                price: 800000,
                description: '거의 새 것 같은 상태입니다. 케이스와 충전기 포함.',
                seller: '김철수',
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7spYjtj7Ag7KSAIOydtOuvuOyngDwvdGV4dD48L3N2Zz4=',
                date: new Date().toISOString()
            },
            {
                id: Date.now() + 2,
                name: '책상',
                price: 50000,
                description: '원목 책상입니다. 약간의 사용감은 있지만 튼튼합니다.',
                seller: '박영희',
                image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7ssYXsg4E8L3RleHQ+PC9zdmc+',
                date: new Date(Date.now() - 86400000).toISOString()
            }
        ];
        
        items.push(...sampleItems);
        saveItems();
        renderItems();
        console.log('샘플 데이터가 추가되었습니다.');
    },
    clearData: function() {
        items.length = 0;
        saveItems();
        renderItems();
        console.log('모든 데이터가 삭제되었습니다.');
    }
};

// 물건 삭제 함수
async function deleteItem(itemId) {
    // 관리자 권한 확인
    if (!isAdmin) {
        showNotification('관리자만 물건을 삭제할 수 있습니다.', 'error');
        return;
    }
    
    // 확인 메시지
    if (!confirm('이 물건을 삭제하시겠습니까? 삭제된 물건은 복구할 수 없습니다.')) {
        return;
    }

    try {
        const itemIndex = items.findIndex(item => item.id === itemId);
        
        if (itemIndex === -1) {
            showNotification('삭제할 물건을 찾을 수 없습니다.', 'error');
            return;
        }

        const deletedItem = items[itemIndex];
        items.splice(itemIndex, 1);
        
        // Firebase에 저장
        await saveItems();
        
        // 화면 업데이트
        renderItems();
        
        showNotification(`"${deletedItem.name}" 물건이 삭제되었습니다.`, 'success');
        
        console.log('물건 삭제됨:', deletedItem);
        
    } catch (error) {
        console.error('물건 삭제 중 오류:', error);
        showNotification('물건 삭제 중 오류가 발생했습니다.', 'error');
    }
}

// 전역 함수로 노출
window.deleteItem = deleteItem;

// ==================== 입찰 관련 기능 ====================

// 입찰 모달 열기
function openBidModal(itemId) {
    const item = items.find(item => item.id === itemId);
    if (!item) return;
    
    // 현장경매 물건은 입찰 불가
    if (item.isLiveAuction) {
        showNotification('현장경매 진행중인 물건은 온라인 입찰이 불가능합니다.', 'error');
        return;
    }
    
    // 다른 모달들 먼저 닫기 (물건 상세보기 모달 등)
    const openModals = document.querySelectorAll('.modal[style*="block"]');
    openModals.forEach(modal => {
        if (modal.id !== 'bidModal') {
            closeModal(modal);
        }
    });
    
    // 동적으로 생성된 모달들 제거
    const dynamicModals = document.querySelectorAll('.modal:not([id])');
    dynamicModals.forEach(modal => {
        document.body.removeChild(modal);
    });
    
    const bidModal = document.getElementById('bidModal');
    const bidAmount = document.getElementById('bidAmount');
    const bidderName = document.getElementById('bidderName');
    const bidderContact = document.getElementById('bidderContact');
    const minBidAmount = document.getElementById('minBidAmount');
    
    // 최소 입찰 금액 계산
    const bids = item.bids || [];
    const highestBid = bids.length > 0 ? Math.max(...bids.map(bid => bid.amount)) : 0;
    const minBid = Math.max(item.price, highestBid) + 1000; // 최소 1000원 위
    
    // 모달 설정
    bidAmount.min = minBid;
    bidAmount.value = minBid;
    minBidAmount.textContent = formatPrice(minBid);
    
    // 가명 생성
    generateRandomName();
    
    // 연락처 초기화
    bidderContact.value = '';
    
    // 현재 입찰하는 아이템 ID 저장
    bidModal.dataset.itemId = itemId;
    
    openModal(bidModal);
}

// 가명 생성 함수
function generateRandomName() {
    const adjectives = ['멋진', '똑똑한', '친절한', '용감한', '신중한', '유쾌한', '성실한', '창의적인', '활발한', '겸손한'];
    const animals = ['고양이', '강아지', '토끼', '사자', '호랑이', '코끼리', '펭귄', '다람쥐', '여우', '부엉이'];
    const numbers = String(Math.floor(Math.random() * 1000));
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    
    const randomName = `${adjective}${animal}${numbers}`;
    
    const bidderName = document.getElementById('bidderName');
    if (bidderName) {
        bidderName.value = randomName;
    }
    
    return randomName;
}

// 입찰 처리 함수
async function handleBidSubmit(event) {
    event.preventDefault();
    
    const bidModal = document.getElementById('bidModal');
    const itemId = parseInt(bidModal.dataset.itemId);
    const bidAmount = parseInt(document.getElementById('bidAmount').value);
    const bidderName = document.getElementById('bidderName').value;
    const bidderContact = document.getElementById('bidderContact').value;
    
    // 입력값 검증
    if (!bidAmount || !bidderName || !bidderContact) {
        showNotification('모든 필드를 입력해주세요.', 'error');
        return;
    }
    
    // 연락처 형식 검증 (숫자만 추출해서 체크)
    const contactNumbers = bidderContact.replace(/\D/g, '');
    if (contactNumbers.length !== 11 || !contactNumbers.startsWith('010')) {
        showNotification('올바른 휴대폰 번호를 입력해주세요. (010으로 시작하는 11자리)', 'error');
        return;
    }
    
    // 아이템 찾기
    const item = items.find(item => item.id === itemId);
    if (!item) {
        showNotification('물건을 찾을 수 없습니다.', 'error');
        return;
    }
    
    // 최소 입찰 금액 확인
    const bids = item.bids || [];
    const highestBid = bids.length > 0 ? Math.max(...bids.map(bid => bid.amount)) : 0;
    const minBid = Math.max(item.price, highestBid) + 1000;
    
    if (bidAmount < minBid) {
        showNotification(`최소 입찰 금액은 ${formatPrice(minBid)}원입니다.`, 'error');
        return;
    }
    
    // 새로운 입찰 추가
    const newBid = {
        id: Date.now(),
        amount: bidAmount,
        bidderName: bidderName,
        bidderContact: bidderContact,
        timestamp: new Date().toISOString()
    };
    
    if (!item.bids) {
        item.bids = [];
    }
    item.bids.push(newBid);
    
    // 입찰을 금액 순으로 정렬 (높은 금액이 먼저)
    item.bids.sort((a, b) => b.amount - a.amount);
    
    try {
        // Firebase에 저장
        await saveItems();
        
        // 화면 업데이트
        renderItems();
        
        // 모달 닫기
        closeModal(bidModal);
        
        showNotification(`${formatPrice(bidAmount)}원으로 입찰되었습니다!`, 'success');
        
        console.log('새로운 입찰:', newBid);
        
    } catch (error) {
        console.error('입찰 저장 중 오류:', error);
        showNotification('입찰 처리 중 오류가 발생했습니다.', 'error');
        
        // 실패 시 입찰 목록에서 제거
        item.bids.pop();
    }
}

// 입찰 관련 이벤트 리스너 설정
function setupBidEventListeners() {
    const bidForm = document.getElementById('bidForm');
    const generateNameBtn = document.getElementById('generateNameBtn');
    const closeBidModalBtn = document.getElementById('closeBidModal');
    const bidderContact = document.getElementById('bidderContact');
    
    if (bidForm) {
        bidForm.addEventListener('submit', handleBidSubmit);
    }
    
    if (generateNameBtn) {
        generateNameBtn.addEventListener('click', generateRandomName);
    }
    
    if (closeBidModalBtn) {
        closeBidModalBtn.addEventListener('click', function() {
            const bidModal = document.getElementById('bidModal');
            closeModal(bidModal);
        });
    }
    
    // 연락처 자동 포맷팅
    if (bidderContact) {
        bidderContact.addEventListener('input', formatPhoneNumber);
        bidderContact.addEventListener('keydown', handlePhoneNumberKeydown);
    }
}

// 물건 상세보기 업데이트 (입찰 정보 포함)
function showItemDetailsWithBids(itemId) {
    const item = items.find(item => item.id === itemId);
    if (!item) return;
    
    // 이미지 갤러리 모달 생성
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    const images = item.images || [{ data: item.image, name: item.name }];
    const bids = item.bids || [];
    const highestBid = bids.length > 0 ? Math.max(...bids.map(bid => bid.amount)) : 0;
    const currentPrice = Math.max(item.price, highestBid);
    
    modal.innerHTML = `
        <div class="modal-content item-detail-modal">
            <div class="modal-header">
                <h2><i class="fas fa-info-circle"></i> ${escapeHtml(item.name)}</h2>
                <span class="close">&times;</span>
            </div>
            <div class="item-detail-content">
                <div class="item-gallery">
                    <div class="main-image">
                        <img id="mainDisplayImage" src="${images[0].data}" alt="${item.name}">
                    </div>
                    ${images.length > 1 ? `
                        <div class="thumbnail-gallery">
                            ${images.map((img, index) => `
                                <img src="${img.data}" alt="${img.name}" 
                                     class="thumbnail ${index === 0 ? 'active' : ''}"
                                     onclick="changeMainImage('${img.data}', this)">
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="item-details">
                    <div class="detail-price-info">
                        <div class="current-price">${formatPrice(currentPrice)}원</div>
                        <div class="start-price">시작가: ${formatPrice(item.price)}원</div>
                        ${item.purchasePrice ? `
                            <div class="purchase-price">구매가: ${formatPrice(item.purchasePrice)}원</div>
                        ` : ''}
                    </div>
                    <div class="detail-description">${escapeHtml(item.description)}</div>
                    <div class="detail-seller">
                        <i class="fas fa-user"></i> ${escapeHtml(item.seller)}
                    </div>
                    <div class="detail-date">
                        <i class="fas fa-clock"></i> 등록일: ${formatDate(item.date)}
                    </div>
                    ${item.purchaseDate ? `
                        <div class="detail-purchase-date">
                            <i class="fas fa-calendar"></i> 구매일: ${formatDate(item.purchaseDate)}
                        </div>
                    ` : ''}
                    <div class="detail-images-info">
                        <i class="fas fa-images"></i> ${images.length}장의 사진
                    </div>
                    
                    ${bids.length > 0 ? `
                        <div class="bid-history">
                            <h3><i class="fas fa-gavel"></i> 입찰 현황 (${bids.length}건)</h3>
                            <div class="bid-list">
                                ${bids.map((bid, index) => `
                                    <div class="bid-item ${index === 0 ? 'highest-bid' : ''}">
                                        <div class="bid-amount">${formatPrice(bid.amount)}원</div>
                                        <div class="bid-info">
                                            <div class="bid-name">${escapeHtml(bid.bidderName)}</div>
                                            <div class="bid-time">${formatDate(bid.timestamp)}</div>
                                            ${isAdmin ? `
                                                <div class="bid-contact">연락처: ${escapeHtml(bid.bidderContact)}</div>
                                            ` : ''}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="detail-actions">
                        ${isAdmin ? `
                            <button class="btn ${item.isLiveAuction ? 'btn-secondary' : 'btn-warning'}" 
                                    onclick="toggleLiveAuction(${item.id})">
                                <i class="fas fa-microphone"></i> 
                                ${item.isLiveAuction ? '현장경매 해제' : '현장경매 설정'}
                            </button>
                        ` : ''}
                        ${!item.isLiveAuction ? `
                            <button class="btn btn-primary" onclick="openBidModal(${item.id})">
                                <i class="fas fa-gavel"></i> 입찰하기
                            </button>
                        ` : `
                            <button class="btn btn-secondary" disabled>
                                <i class="fas fa-microphone"></i> 현장경매 진행중
                            </button>
                        `}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // 모달 닫기 이벤트
    modal.querySelector('.close').addEventListener('click', () => {
        document.body.removeChild(modal);
        document.body.style.overflow = 'auto';
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
            document.body.style.overflow = 'auto';
        }
    });
}

// 기존 showItemDetails 함수를 새로운 함수로 교체
window.showItemDetails = showItemDetailsWithBids;

// 연락처 자동 포맷팅 함수
function formatPhoneNumber(event) {
    const input = event.target;
    let value = input.value.replace(/\D/g, ''); // 숫자만 추출
    
    // 11자리 초과 입력 방지
    if (value.length > 11) {
        value = value.slice(0, 11);
    }
    
    // 포맷팅 적용
    if (value.length <= 3) {
        input.value = value;
    } else if (value.length <= 7) {
        input.value = `${value.slice(0, 3)}-${value.slice(3)}`;
    } else {
        input.value = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7)}`;
    }
}

// 연락처 입력 키다운 이벤트 처리
function handlePhoneNumberKeydown(event) {
    const allowedKeys = [
        'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'Home', 'End'
    ];
    
    // 허용된 키이거나 Ctrl/Cmd 조합키인 경우 허용
    if (allowedKeys.includes(event.key) || 
        event.ctrlKey || event.metaKey ||
        (event.key >= '0' && event.key <= '9')) {
        return;
    }
    
    // 그 외의 키는 입력 방지
    event.preventDefault();
}

// 현장경매 토글 함수
async function toggleLiveAuction(itemId) {
    if (!isAdmin) {
        showNotification('관리자만 현장경매를 설정할 수 있습니다.', 'error');
        return;
    }
    
    const item = items.find(item => item.id === itemId);
    if (!item) {
        showNotification('물건을 찾을 수 없습니다.', 'error');
        return;
    }
    
    // 현장경매 상태 토글
    item.isLiveAuction = !item.isLiveAuction;
    
    try {
        // Firebase에 저장
        await saveItems();
        
        // 화면 업데이트
        renderItems();
        
        // 상세보기 모달 닫기
        const openModals = document.querySelectorAll('.modal[style*="block"]');
        openModals.forEach(modal => {
            if (!modal.id) { // 동적으로 생성된 모달
                document.body.removeChild(modal);
            }
        });
        document.body.style.overflow = 'auto';
        
        const message = item.isLiveAuction ? 
            `"${item.name}" 현장경매가 설정되었습니다.` : 
            `"${item.name}" 현장경매가 해제되었습니다.`;
        showNotification(message, 'success');
        
        console.log('현장경매 상태 변경:', item.name, '→', item.isLiveAuction);
        
    } catch (error) {
        console.error('현장경매 설정 저장 중 오류:', error);
        showNotification('현장경매 설정 중 오류가 발생했습니다.', 'error');
        
        // 실패 시 상태 되돌리기
        item.isLiveAuction = !item.isLiveAuction;
    }
}

// 전역 함수로 노출
window.openBidModal = openBidModal;
window.generateRandomName = generateRandomName;
window.toggleLiveAuction = toggleLiveAuction;

// 초기화 시 입찰 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', function() {
    setupBidEventListeners();
}); 