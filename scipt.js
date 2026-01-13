// --- CẤU HÌNH ---
const progressBar = document.getElementById('progress-bar');
// Tính chu vi hình chữ nhật bo góc (Squircle)
// SVG Width=300, Radius=35.
// Chu vi gần đúng = (4 * 300) - (8 * 35) + (2 * PI * 35) ≈ 1140
const totalLength = progressBar.getTotalLength(); 

progressBar.style.strokeDasharray = totalLength;
progressBar.style.strokeDashoffset = 0;

// --- BIẾN ---
let timer;
let totalTime = 25 * 60; 
let timeLeft = totalTime;
let isRunning = false;
let wakeLock = null;

// --- 1. ĐỒNG HỒ ---
function updateUI() {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    document.getElementById('timer-text').innerText = `${m<10?'0':''}${m}:${s<10?'0':''}${s}`;
    document.title = `${m}:${s} - Studymode167`;

    // Tính toán thanh chạy hình vuông
    const offset = totalLength - (timeLeft / totalTime) * totalLength;
    progressBar.style.strokeDashoffset = offset;
}

function setMode(min) {
    clearInterval(timer);
    isRunning = false;
    totalTime = min * 60;
    timeLeft = totalTime;
    
    // Đổi màu chữ trạng thái
    const status = document.getElementById('timer-status');
    const bgStroke = document.querySelector('.stroke-run');
    
    if(min === 5 || min === 10) {
        status.innerText = "NGHỈ NGƠI";
        status.style.color = "#4ade80"; // Xanh lá
        // Đổi màu thanh chạy sang xanh lá (bằng CSS filter hoặc đổi stroke)
        progressBar.style.stroke = "#4ade80"; 
    } else {
        status.innerText = "TẬP TRUNG";
        status.style.color = "#38bdf8"; // Xanh dương
        progressBar.style.stroke = "url(#gradientColor)"; // Về lại màu gradient
    }

    resetBtnState();
    updateUI();
    progressBar.style.strokeDashoffset = 0; // Đầy cây
}

function setCustom() {
    const val = document.getElementById('custom-inp').value;
    if(val > 0) setMode(Number(val));
}

async function toggleTimer() {
    const btn = document.getElementById('btn-main');
    
    if(!isRunning) {
        // CHẠY
        isRunning = true;
        btn.innerText = "TẠM DỪNG";
        btn.style.backgroundColor = "#f43f5e"; // Đỏ
        
        // Giữ màn hình sáng
        try { if('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch(e){}

        timer = setInterval(() => {
            if(timeLeft > 0) {
                timeLeft--;
                updateUI();
            } else {
                finishTimer();
            }
        }, 1000);
    } else {
        // DỪNG
        clearInterval(timer);
        isRunning = false;
        resetBtnState();
        if(wakeLock) wakeLock.release();
    }
}

function resetBtnState() {
    const btn = document.getElementById('btn-main');
    btn.innerText = "BẮT ĐẦU";
    btn.style.backgroundColor = "#38bdf8";
}

function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    timeLeft = totalTime;
    resetBtnState();
    updateUI();
    progressBar.style.strokeDashoffset = 0;
}

function finishTimer() {
    clearInterval(timer);
    isRunning = false;
    document.getElementById('timer-status').innerText = "HOÀN THÀNH!";
    resetBtnState();
    new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play();
    if(wakeLock) wakeLock.release();
}

function toggleFullscreen() {
    if(!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        document.body.classList.add('fullscreen');
    } else {
        if(document.exitFullscreen) document.exitFullscreen();
        document.body.classList.remove('fullscreen');
    }
}

// --- 2. DỮ LIỆU (TỰ LƯU) ---
// Load Tên & Note
document.getElementById('username').value = localStorage.getItem('sm_user') || '';
document.getElementById('note-area').value = localStorage.getItem('sm_note') || '';

// Save Tên & Note
document.getElementById('username').addEventListener('input', (e) => localStorage.setItem('sm_user', e.target.value));
document.getElementById('note-area').addEventListener('input', (e) => localStorage.setItem('sm_note', e.target.value));

// Task List Logic
let tasks = JSON.parse(localStorage.getItem('sm_tasks')) || [];

function renderTasks() {
    const list = document.getElementById('task-list');
    list.innerHTML = '';
    document.getElementById('task-count').innerText = tasks.filter(t => !t.done).length;

    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        if(task.done) li.classList.add('done');
        li.innerHTML = `
            <span onclick="toggleTask(${index})">${task.text}</span>
            <button class="del-task" onclick="delTask(${index})">✕</button>
        `;
        list.appendChild(li);
    });
}

function addTask() {
    const inp = document.getElementById('task-inp');
    if(inp.value.trim()) {
        tasks.push({ text: inp.value, done: false });
        saveTasks();
        inp.value = '';
    }
}

function toggleTask(idx) {
    tasks[idx].done = !tasks[idx].done;
    saveTasks();
}

function delTask(idx) {
    tasks.splice(idx, 1);
    saveTasks();
}

function saveTasks() {
    localStorage.setItem('sm_tasks', JSON.stringify(tasks));
    renderTasks();
}

// Khởi chạy
renderTasks();
updateUI();
