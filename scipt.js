// --- CẤU HÌNH ---
const progressBar = document.getElementById('progress-bar');
// Tính độ dài viền hình vuông để chạy hiệu ứng
const totalLength = progressBar.getTotalLength(); 

progressBar.style.strokeDasharray = totalLength;
progressBar.style.strokeDashoffset = 0;

// --- BIẾN TOÀN CỤC ---
let timerInterval;
let totalTime = 25 * 60; // Mặc định 25 phút
let timeLeft = totalTime;
let isRunning = false;
let wakeLock = null; // Khóa màn hình

// --- 1. XỬ LÝ ĐỒNG HỒ ---
function updateDisplay() {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    // Hiển thị số 00:00
    document.getElementById('time-display').innerText = 
        `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    
    // Hiển thị viền chạy
    // Offset càng lớn -> viền càng ngắn
    const offset = totalLength - (timeLeft / totalTime) * totalLength;
    progressBar.style.strokeDashoffset = offset;
    
    // Đổi tiêu đề tab trình duyệt
    document.title = isRunning ? `(${m}:${s}) Tập trung` : "Studymode167";
}

function setMode(minutes) {
    pauseTimer(); // Dừng nếu đang chạy
    totalTime = minutes * 60;
    timeLeft = totalTime;
    
    // Đổi màu xanh lá nếu là giờ nghỉ
    if (minutes === 5 || minutes === 10) {
        document.getElementById('status-display').innerText = "Giờ nghỉ ngơi";
        progressBar.style.stroke = "#00ff88"; 
    } else {
        document.getElementById('status-display').innerText = "Đang học bài";
        progressBar.style.stroke = "#00d4ff";
    }
    
    updateDisplay();
    progressBar.style.strokeDashoffset = 0; // Đầy lại vòng
}

function setCustom() {
    const val = document.getElementById('custom-min').value;
    if (val && val > 0) setMode(parseInt(val));
}

async function toggleTimer() {
    const btnStart = document.getElementById('btn-start');
    
    if (!isRunning) {
        // --- BẮT ĐẦU ---
        isRunning = true;
        btnStart.innerText = "DỪNG";
        btnStart.style.backgroundColor = "#ff4d4d"; // Đỏ
        
        // Kích hoạt Wake Lock (Giữ màn hình sáng)
        try {
            if ('wakeLock' in navigator) {
                wakeLock = await navigator.wakeLock.request('screen');
            }
        } catch (err) {
            console.log("Không thể giữ màn hình sáng (có thể do lỗi bảo mật trình duyệt)");
        }

        timerInterval = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateDisplay();
            } else {
                finishTimer();
            }
        }, 1000);

    } else {
        // --- TẠM DỪNG ---
        pauseTimer();
    }
}

function pauseTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    const btnStart = document.getElementById('btn-start');
    btnStart.innerText = "TIẾP TỤC";
    btnStart.style.backgroundColor = "#00d4ff"; // Xanh
    if (wakeLock) {
        wakeLock.release();
        wakeLock = null;
    }
}

function resetTimer() {
    pauseTimer();
    timeLeft = totalTime;
    updateDisplay();
    document.getElementById('btn-start').innerText = "BẮT ĐẦU";
    progressBar.style.strokeDashoffset = 0;
}

function finishTimer() {
    pauseTimer();
    document.getElementById('status-display').innerText = "Hoàn thành!";
    document.getElementById('btn-start').innerText = "BẮT ĐẦU";
    // Âm thanh báo hiệu
    new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play();
}

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(e => {
            alert("Trình duyệt không cho phép toàn màn hình: " + e.message);
        });
        document.body.classList.add('fullscreen');
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        document.body.classList.remove('fullscreen');
    }
}

// --- 2. XỬ LÝ DỮ LIỆU (LƯU VÀO MÁY) ---
// Tên người dùng
const nameInput = document.getElementById('username');
nameInput.value = localStorage.getItem('sm_name') || '';
nameInput.addEventListener('input', () => localStorage.setItem('sm_name', nameInput.value));

// Ghi chú
const noteInput = document.getElementById('note-area');
noteInput.value = localStorage.getItem('sm_note') || '';
noteInput.addEventListener('input', () => localStorage.setItem('sm_note', noteInput.value));

// Danh sách nhiệm vụ (Todo List)
let tasks = JSON.parse(localStorage.getItem('sm_tasks')) || [];
const taskList = document.getElementById('task-list');

function renderTasks() {
    taskList.innerHTML = '';
    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        if (task.done) li.classList.add('done');
        
        li.innerHTML = `
            <span onclick="toggleTask(${index})">${task.text}</span>
            <button class="del-btn" onclick="deleteTask(${index})">×</button>
        `;
        taskList.appendChild(li);
    });
}

function addTask() {
    const input = document.getElementById('task-input');
    const text = input.value.trim();
    if (text) {
        tasks.push({ text: text, done: false });
        saveTasks();
        input.value = '';
    }
}

function toggleTask(index) {
    tasks[index].done = !tasks[index].done;
    saveTasks();
}

function deleteTask(index) {
    tasks.splice(index, 1);
    saveTasks();
}

function saveTasks() {
    localStorage.setItem('sm_tasks', JSON.stringify(tasks));
    renderTasks();
}

// Khởi động lần đầu
updateDisplay();
renderTasks();
