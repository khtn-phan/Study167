// --- 1. XỬ LÝ ĐỒNG HỒ HÌNH VUÔNG ---
const rect = document.getElementById('progress-rect');
// Tính tổng độ dài viền hình vuông (để làm hiệu ứng chạy)
const rectLength = rect.getTotalLength(); 

rect.style.strokeDasharray = rectLength;
rect.style.strokeDashoffset = 0;

let timer;
let totalTime = 25 * 60;
let timeLeft = totalTime;
let isRunning = false;
let wakeLock = null;

function updateDisplay() {
    // 1. Cập nhật số
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    document.getElementById('time-text').innerText = `${m < 10 ? '0':''}${m}:${s < 10 ? '0':''}${s}`;
    document.title = `${m}:${s} - Studymode167`; // Hiện giờ trên tab trình duyệt

    // 2. Cập nhật viền vuông chạy
    // Công thức: Độ lệch = Độ dài tổng - (Phần trăm còn lại * Độ dài tổng)
    const offset = rectLength - (timeLeft / totalTime) * rectLength;
    rect.style.strokeDashoffset = offset;
}

function setMode(minutes) {
    if(isRunning) resetTimer();
    totalTime = minutes * 60;
    timeLeft = totalTime;
    
    // Đổi màu nếu là giờ nghỉ
    if(minutes === 5 || minutes === 10) {
        document.getElementById('status-text').innerText = "Nghỉ ngơi nào!";
        rect.style.stroke = "#90ee90"; // Màu xanh lá
    } else {
        document.getElementById('status-text').innerText = "Tập trung cao độ";
        rect.style.stroke = "#00d4ff"; // Màu xanh neon
    }
    updateDisplay();
}

function setCustom() {
    const val = document.getElementById('custom-min').value;
    if(val > 0) setMode(val);
}

async function toggleTimer() {
    const btn = document.getElementById('start-btn');
    if(!isRunning) {
        // Bắt đầu
        isRunning = true;
        btn.innerText = "DỪNG";
        btn.style.backgroundColor = "#ff4d4d"; // Đỏ
        
        // Giữ màn hình sáng
        try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch(e){}

        timer = setInterval(() => {
            if(timeLeft > 0) {
                timeLeft--;
                updateDisplay();
            } else {
                finishTimer();
            }
        }, 1000); // Đếm lùi mỗi giây (Đơn giản hóa)
    } else {
        // Tạm dừng
        clearInterval(timer);
        isRunning = false;
        btn.innerText = "TIẾP TỤC";
        btn.style.backgroundColor = "#00d4ff"; 
        if(wakeLock) wakeLock.release();
    }
}

function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    timeLeft = totalTime;
    updateDisplay();
    document.getElementById('start-btn').innerText = "BẮT ĐẦU";
    document.getElementById('start-btn').style.backgroundColor = "#00d4ff";
    rect.style.strokeDashoffset = 0; // Đầy viền lại
}

function finishTimer() {
    clearInterval(timer);
    isRunning = false;
    document.getElementById('status-text').innerText = "Hoàn thành!";
    new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play();
    if(wakeLock) wakeLock.release();
}

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        document.body.classList.add('fullscreen');
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        document.body.classList.remove('fullscreen');
    }
}

// --- 2. XỬ LÝ TÊN & GHI CHÚ (LƯU LOCALSTORAGE) ---
const nameInput = document.getElementById('user-name');
const noteArea = document.getElementById('note-area');

// Load dữ liệu cũ nếu có
nameInput.value = localStorage.getItem('sm_username') || '';
noteArea.value = localStorage.getItem('sm_notes') || '';

// Lưu tự động khi gõ
nameInput.addEventListener('input', () => localStorage.setItem('sm_username', nameInput.value));
noteArea.addEventListener('input', () => localStorage.setItem('sm_notes', noteArea.value));


// --- 3. XỬ LÝ NHIỆM VỤ (TODO LIST) ---
let tasks = JSON.parse(localStorage.getItem('sm_tasks')) || [];

function renderTasks() {
    const list = document.getElementById('task-list');
    list.innerHTML = ''; // Xóa list cũ
    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        if(task.done) li.classList.add('done');
        
        li.innerHTML = `
            <span onclick="toggleTask(${index})">${task.text}</span>
            <button class="del-btn" onclick="deleteTask(${index})">×</button>
        `;
        list.appendChild(li);
    });
}

function addTask() {
    const input = document.getElementById('task-input');
    if(input.value.trim()) {
        tasks.push({ text: input.value, done: false });
        saveTasks();
        input.value = '';
    }
}

function toggleTask(index) {
    tasks[index].done = !tasks[index].done;
    saveTasks();
}

function deleteTask(index) {
    tasks.splice(index, 1); // Xóa khỏi mảng
    saveTasks();
}

function saveTasks() {
    localStorage.setItem('sm_tasks', JSON.stringify(tasks));
    renderTasks();
}

// Khởi chạy
renderTasks();
updateDisplay();
