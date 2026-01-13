// --- 1. HỆ THỐNG GAMIFICATION & STORAGE ---
let userXP = parseInt(localStorage.getItem('userXP')) || 0;
let userStreak = parseInt(localStorage.getItem('userStreak')) || 0;
let lastLogin = localStorage.getItem('lastLogin');

// Cập nhật XP và Level
function addXP(amount) {
    userXP += amount;
    localStorage.setItem('userXP', userXP);
    updateUIStats();
    if(amount > 0) alert(`+${amount} XP! Bạn đang làm rất tốt!`);
}

function updateUIStats() {
    const level = Math.floor(userXP / 100) + 1; // 100 XP = 1 Level
    const nextLevelXP = level * 100;
    const progress = ((userXP % 100) / 100) * 100;

    document.getElementById('xp-display').innerText = userXP;
    document.getElementById('level-display').innerText = level;
    document.getElementById('xp-bar-fill').style.width = `${progress}%`;
}

// Tính Streak (Chuỗi ngày)
function checkStreak() {
    const today = new Date().toDateString();
    if (lastLogin !== today) {
        if (lastLogin === new Date(Date.now() - 86400000).toDateString()) {
            userStreak++; // Liên tiếp
        } else {
            userStreak = 1; // Mất chuỗi hoặc ngày đầu
        }
        localStorage.setItem('userStreak', userStreak);
        localStorage.setItem('lastLogin', today);
    }
    document.getElementById('streak-display').innerText = userStreak;
}

// Khởi chạy khi load web
checkStreak();
updateUIStats();

// --- 2. QUẢN LÝ TAB ---
function switchTab(tabId) {
    // Ẩn tất cả tab
    document.querySelectorAll('.tab-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.menu li').forEach(el => el.classList.remove('active'));
    
    // Hiện tab được chọn
    document.getElementById(tabId).classList.add('active');
    
    // Highlight menu
    // (Logic đơn giản: tìm li có onclick chứa tabId - bạn có thể cải tiến)
    event.currentTarget.classList.add('active');
    
    document.getElementById('page-title').innerText = 
        tabId === 'tab-dashboard' ? 'Tổng quan' : 
        tabId === 'tab-schedule' ? 'Lịch & Tài liệu' : 
        tabId === 'tab-todo' ? 'Nhiệm vụ' :
        tabId === 'tab-flashcard' ? 'Thẻ ghi nhớ' : 'Ghi chú nhanh';
}

// --- 3. POMODORO (Đã nâng cấp) ---
let timer;
let totalTime = 25 * 60;
let timeLeft = totalTime;
let isRunning = false;
let wakeLock = null;
const circle = document.getElementById('progress-circle');
const circumference = 2 * Math.PI * 110; // r=110 -> C ~ 690
circle.style.strokeDasharray = circumference;

function updateTimerUI() {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    document.getElementById('time-display').innerText = `${m < 10 ? '0':''}${m}:${s < 10 ? '0':''}${s}`;
    
    const offset = circumference - (timeLeft / totalTime) * circumference;
    circle.style.strokeDashoffset = offset;
}

function setMode(minutes) {
    if(isRunning) resetTimer();
    totalTime = minutes * 60;
    timeLeft = totalTime;
    document.getElementById('timer-status').innerText = minutes === 5 ? "Nghỉ ngơi" : "Đang tập trung";
    updateTimerUI();
}

async function toggleTimer() {
    if(!isRunning) {
        isRunning = true;
        document.getElementById('start-btn').innerText = "TẠM DỪNG";
        
        // Wake Lock: Giữ màn hình sáng
        try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch(e){}

        const endTime = Date.now() + timeLeft * 1000;
        timer = setInterval(() => {
            const secondsLeft = Math.ceil((endTime - Date.now()) / 1000);
            if(secondsLeft <= 0) {
                clearInterval(timer);
                timeLeft = 0;
                updateTimerUI();
                finishPomodoro();
            } else {
                timeLeft = secondsLeft;
                updateTimerUI();
            }
        }, 1000);
    } else {
        clearInterval(timer);
        isRunning = false;
        document.getElementById('start-btn').innerText = "TIẾP TỤC";
        if(wakeLock) wakeLock.release();
    }
}

function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    timeLeft = totalTime;
    updateTimerUI();
    document.getElementById('start-btn').innerText = "BẮT ĐẦU HỌC";
}

function finishPomodoro() {
    isRunning = false;
    document.getElementById('timer-status').innerText = "Hoàn thành!";
    new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play();
    addXP(50); // Thưởng 50 XP
    if(wakeLock) wakeLock.release();
}

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        document.body.classList.add('fullscreen-mode');
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        document.body.classList.remove('fullscreen-mode');
    }
}

// --- 4. TO-DO LIST (Lưu LocalStorage) ---
let todos = JSON.parse(localStorage.getItem('todos')) || [];

function renderTodos() {
    const list = document.getElementById('todo-list');
    list.innerHTML = '';
    todos.forEach((todo, index) => {
        const li = document.createElement('li');
        li.className = todo.completed ? 'completed' : '';
        li.innerHTML = `
            <span onclick="toggleTodo(${index})">${todo.text}</span>
            <button onclick="deleteTodo(${index})" style="color:red; background:none; border:none; cursor:pointer">✕</button>
        `;
        list.appendChild(li);
    });
}

function addTodo() {
    const input = document.getElementById('todo-input');
    if(input.value.trim()) {
        todos.push({ text: input.value, completed: false });
        localStorage.setItem('todos', JSON.stringify(todos));
        input.value = '';
        renderTodos();
    }
}

function toggleTodo(index) {
    todos[index].completed = !todos[index].completed;
    if(todos[index].completed) addXP(10); // Thưởng 10 XP
    localStorage.setItem('todos', JSON.stringify(todos));
    renderTodos();
}

function deleteTodo(index) {
    todos.splice(index, 1);
    localStorage.setItem('todos', JSON.stringify(todos));
    renderTodos();
}

renderTodos();

// --- 5. FLASHCARDS ---
let flashcards = JSON.parse(localStorage.getItem('flashcards')) || [
    {front: "Hello", back: "Xin chào"},
    {front: "Apple", back: "Quả táo"}
];
let currentCardIndex = 0;

function renderCard() {
    if(flashcards.length === 0) return;
    const card = flashcards[currentCardIndex];
    document.getElementById('fc-front').innerText = card.front;
    document.getElementById('fc-back').innerText = card.back;
    document.querySelector('.flashcard').classList.remove('flipped');
}

function flipCard(el) {
    el.classList.toggle('flipped');
}

function nextCard() {
    currentCardIndex = (currentCardIndex + 1) % flashcards.length;
    renderCard();
}

function prevCard() {
    currentCardIndex = (currentCardIndex - 1 + flashcards.length) % flashcards.length;
    renderCard();
}

function addFlashcard() {
    const f = document.getElementById('new-fc-front').value;
    const b = document.getElementById('new-fc-back').value;
    if(f && b) {
        flashcards.push({front: f, back: b});
        localStorage.setItem('flashcards', JSON.stringify(flashcards));
        alert('Đã thêm thẻ!');
        document.getElementById('new-fc-front').value = '';
        document.getElementById('new-fc-back').value = '';
    }
}
renderCard();

// --- 6. GHI CHÚ NHANH (Auto Save) ---
const noteArea = document.getElementById('quick-note');
noteArea.value = localStorage.getItem('quickNote') || '';
noteArea.addEventListener('input', () => {
    localStorage.setItem('quickNote', noteArea.value);
});

// --- 7. SCHEDULE (Đơn giản) ---
function addSchedule() {
    const sub = document.getElementById('sch-subject').value;
    const time = document.getElementById('sch-time').value;
    if(sub && time) {
        const ul = document.getElementById('schedule-list');
        const li = document.createElement('li');
        li.innerText = `${time}: ${sub}`;
        li.className = 'list-item'; // Bạn có thể thêm css cho class này
        ul.appendChild(li);
        // Lưu ý: Phần này bạn tự thêm code lưu vào LocalStorage tương tự To-do nhé!
    }
}

// --- 8. THEME (Dark Mode) ---
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const btn = document.getElementById('theme-btn');
    if(document.body.classList.contains('dark-mode')) {
        btn.innerHTML = '<i class="fas fa-sun"></i> Chế độ sáng';
    } else {
        btn.innerHTML = '<i class="fas fa-moon"></i> Chế độ tối';
    }
}
