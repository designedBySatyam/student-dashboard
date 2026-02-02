// ============================================
// DATA STORAGE & STATE MANAGEMENT
// ============================================

// Check if user is logged in
const currentUser = localStorage.getItem('userEmail');

if (!localStorage.getItem('isLoggedIn') || !currentUser) {
    window.location.href = '../index.html';
}

function userKey(key) {
    return currentUser + "_" + key;
}


// Initialize data structures
const data = {
    subjects: JSON.parse(localStorage.getItem(userKey('subjects'))) || [],
    todos: JSON.parse(localStorage.getItem(userKey('todos'))) || [],
    notes: JSON.parse(localStorage.getItem(userKey('notes'))) || [],
    events: JSON.parse(localStorage.getItem(userKey('events'))) || [],
    goals: JSON.parse(localStorage.getItem(userKey('goals'))) || [],
    pomodoroSessions: JSON.parse(localStorage.getItem(userKey('pomodoroSessions'))) || [],
    studySessions: JSON.parse(localStorage.getItem(userKey('studySessions'))) || [],
    settings: JSON.parse(localStorage.getItem(userKey('pomodoroSettings'))) || {
        pomodoro: 25,
        shortBreak: 5,
        longBreak: 15,
        autoStartBreaks: false,
        soundEnabled: true
    }
};


// Save data to localStorage
function saveData(key) {
    localStorage.setItem(userKey(key), JSON.stringify(data[key]));
}


// ============================================
// DOM ELEMENTS
// ============================================

// Sidebar
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const mobileToggle = document.getElementById('mobileToggle');
const navItems = document.querySelectorAll('.nav-item');
const logoutBtn = document.getElementById('logoutBtn');

// Sections
const sections = document.querySelectorAll('.section');
const pageTitle = document.getElementById('pageTitle');

// Theme
const themeToggle = document.getElementById('themeToggle');

// Modals
const modals = document.querySelectorAll('.modal');
const closeModalBtns = document.querySelectorAll('.close-modal');

// ============================================
// NAVIGATION & SIDEBAR
// ============================================

// Toggle sidebar
sidebarToggle?.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
});

mobileToggle?.addEventListener('click', () => {
    sidebar.classList.toggle('active');
});

// Navigation
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Update active nav item
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        // Show corresponding section
        const sectionName = item.dataset.section;
        sections.forEach(section => section.classList.remove('active'));
        document.getElementById(`${sectionName}-section`).classList.add('active');
        
        // Update page title
        pageTitle.textContent = item.querySelector('span').textContent;
        
        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('active');
        }
        
        // Initialize section-specific features
        if (sectionName === 'calendar') initCalendar();
        if (sectionName === 'dashboard') updateDashboard();
    });
});

// Logout
logoutBtn?.addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        window.location.href = '../index.html';
    }
});


// ============================================
// THEME TOGGLE
// ============================================

themeToggle?.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const icon = themeToggle.querySelector('i');
    icon.classList.toggle('fa-moon');
    icon.classList.toggle('fa-sun');
    
    // Save preference
    localStorage.setItem('darkTheme', document.body.classList.contains('dark-theme'));
});

// Load theme preference
if (localStorage.getItem('darkTheme') === 'true') {
    document.body.classList.add('dark-theme');
    const icon = themeToggle?.querySelector('i');
    if (icon) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    }
}

// ============================================
// MODAL MANAGEMENT
// ============================================

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modal) {
    modal.classList.remove('active');
}

closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        btn.closest('.modal').classList.remove('active');
    });
});

// Close modal on outside click
modals.forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
});

// ============================================
// DASHBOARD
// ============================================

function updateDashboard() {
    // Calculate stats
    const totalStudyTime = data.studySessions.reduce((acc, session) => acc + session.duration, 0);
    const completedTasks = data.todos.filter(todo => todo.completed).length;
    const goalsAchieved = data.goals.filter(goal => goal.progress === 100).length;
    
    // Update stat cards
    document.getElementById('totalStudyHours').textContent = `${Math.floor(totalStudyTime / 60)}h`;
    document.getElementById('completedTasks').textContent = completedTasks;
    document.getElementById('goalsAchieved').textContent = goalsAchieved;
    
    // Calculate streak (simplified)
    const today = new Date().toDateString();
    const hasStudiedToday = data.studySessions.some(session => 
        new Date(session.date).toDateString() === today
    );
    document.getElementById('currentStreak').textContent = hasStudiedToday ? '1' : '0';
    
    // Update recent activity
    updateRecentActivity();
}

function updateRecentActivity() {
    const activityList = document.getElementById('activityList');
    const recentActivities = [];
    
    // Get recent study sessions
    data.studySessions.slice(-3).forEach(session => {
        recentActivities.push({
            type: 'study',
            text: `Studied ${session.subject} for ${session.duration} minutes`,
            time: session.date,
            icon: 'fa-book',
            color: '#667eea'
        });
    });
    
    // Get recent completed tasks
    data.todos.filter(todo => todo.completed).slice(-2).forEach(todo => {
        recentActivities.push({
            type: 'task',
            text: `Completed: ${todo.text}`,
            time: todo.completedAt || Date.now(),
            icon: 'fa-check-circle',
            color: '#10b981'
        });
    });
    
    if (recentActivities.length === 0) {
        activityList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <p>No recent activity</p>
            </div>
        `;
        return;
    }
    
    // Sort by time
    recentActivities.sort((a, b) => b.time - a.time);
    
    activityList.innerHTML = recentActivities.slice(0, 5).map(activity => `
        <div class="activity-item">
            <div class="activity-icon" style="background: ${activity.color}">
                <i class="fas ${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <h4>${activity.text}</h4>
                <p>${new Date(activity.time).toLocaleDateString()}</p>
            </div>
            <span class="activity-time">${getTimeAgo(activity.time)}</span>
        </div>
    `).join('');
}

function getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

// ============================================
// STUDY TRACKER
// ============================================

let currentSubjectId = null;

document.getElementById('addSubjectBtn')?.addEventListener('click', () => {
    openModal('subjectModal');
});

document.getElementById('saveSubjectBtn')?.addEventListener('click', () => {
    const name = document.getElementById('subjectName').value.trim();
    const color = document.getElementById('subjectColor').value;
    const target = parseInt(document.getElementById('subjectTarget').value) || 10;
    
    if (!name) {
        alert('Please enter a subject name');
        return;
    }
    
    const subject = {
        id: Date.now(),
        name,
        color,
        target,
        totalHours: 0,
        sessions: 0
    };
    
    data.subjects.push(subject);
    saveData('subjects');
    renderSubjects();
    closeModal(document.getElementById('subjectModal'));
    
    // Reset form
    document.getElementById('subjectName').value = '';
    document.getElementById('subjectColor').value = '#667eea';
    document.getElementById('subjectTarget').value = '';
});

function renderSubjects() {
    const grid = document.getElementById('subjectsGrid');
    
    if (data.subjects.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-book"></i>
                <p>No subjects yet. Add your first subject to start tracking!</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = data.subjects.map(subject => {
        const progress = Math.min((subject.totalHours / subject.target) * 100, 100);
        
        return `
            <div class="subject-card" style="border-left-color: ${subject.color}">
                <div class="subject-header">
                    <h3 class="subject-name">${subject.name}</h3>
                    <button class="subject-menu" onclick="deleteSubject(${subject.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="subject-progress">
                    <div class="progress-info">
                        <span>${subject.totalHours.toFixed(1)}h / ${subject.target}h</span>
                        <span>${progress.toFixed(0)}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%; background: ${subject.color}"></div>
                    </div>
                </div>
                <div class="subject-stats">
                    <div class="subject-stat">
                        <span>${subject.sessions}</span>
                        <p>Sessions</p>
                    </div>
                    <div class="subject-stat">
                        <span>${subject.sessions > 0 ? (subject.totalHours / subject.sessions * 60).toFixed(0) : 0}m</span>
                        <p>Avg/Session</p>
                    </div>
                </div>
                <div class="subject-actions">
                    <button class="btn-small primary" onclick="logSession(${subject.id})">
                        <i class="fas fa-plus"></i> Log Session
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    updateStudyStats();
}

function logSession(subjectId) {
    currentSubjectId = subjectId;
    openModal('sessionModal');
}

document.getElementById('saveSessionBtn')?.addEventListener('click', () => {
    const duration = parseInt(document.getElementById('sessionDuration').value);
    const notes = document.getElementById('sessionNotes').value.trim();
    
    if (!duration || duration <= 0) {
        alert('Please enter a valid duration');
        return;
    }
    
    const subject = data.subjects.find(s => s.id === currentSubjectId);
    if (subject) {
        subject.totalHours += duration / 60;
        subject.sessions++;
        
        // Add to study sessions
        data.studySessions.push({
            subject: subject.name,
            duration,
            notes,
            date: Date.now()
        });
        
        saveData('subjects');
        saveData('studySessions');
        renderSubjects();
        closeModal(document.getElementById('sessionModal'));
        
        // Reset form
        document.getElementById('sessionDuration').value = '';
        document.getElementById('sessionNotes').value = '';
        
        showNotification('Study session logged successfully!');
    }
});

function deleteSubject(id) {
    if (confirm('Are you sure you want to delete this subject?')) {
        data.subjects = data.subjects.filter(s => s.id !== id);
        saveData('subjects');
        renderSubjects();
    }
}

function updateStudyStats() {
    const totalSessions = data.subjects.reduce((acc, s) => acc + s.sessions, 0);
    const totalHours = data.subjects.reduce((acc, s) => acc + s.totalHours, 0);
    const avgDuration = totalSessions > 0 ? (totalHours / totalSessions * 60).toFixed(0) : 0;
    
    document.getElementById('totalSessions').textContent = totalSessions;
    document.getElementById('avgDuration').textContent = `${avgDuration} min`;
    
    const topSubject = data.subjects.reduce((top, subject) => 
        subject.totalHours > (top?.totalHours || 0) ? subject : top, null
    );
    
    document.getElementById('topSubject').textContent = topSubject?.name || '-';
}

// ============================================
// TODO LIST
// ============================================

let currentFilter = 'all';

document.getElementById('addTodoBtn')?.addEventListener('click', addTodo);
document.getElementById('todoInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
});

function addTodo() {
    const input = document.getElementById('todoInput');
    const priority = document.getElementById('todoPriority').value;
    const text = input.value.trim();
    
    if (!text) return;
    
    const todo = {
        id: Date.now(),
        text,
        priority,
        completed: false,
        createdAt: Date.now()
    };
    
    data.todos.push(todo);
    saveData('todos');
    renderTodos();
    input.value = '';
    showNotification('Task added successfully!');
}

function renderTodos() {
    const list = document.getElementById('todoList');
    let filteredTodos = data.todos;
    
    if (currentFilter === 'active') {
        filteredTodos = data.todos.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        filteredTodos = data.todos.filter(t => t.completed);
    }
    
    if (filteredTodos.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tasks"></i>
                <p>No tasks ${currentFilter === 'all' ? 'yet' : currentFilter}</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = filteredTodos.map(todo => `
        <div class="todo-item ${todo.completed ? 'completed' : ''}">
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} 
                   onchange="toggleTodo(${todo.id})">
            <div class="todo-priority ${todo.priority}"></div>
            <span class="todo-text">${todo.text}</span>
            <div class="todo-actions">
                <button class="todo-action-btn" onclick="deleteTodo(${todo.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function toggleTodo(id) {
    const todo = data.todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        if (todo.completed) {
            todo.completedAt = Date.now();
        }
        saveData('todos');
        renderTodos();
    }
}

function deleteTodo(id) {
    data.todos = data.todos.filter(t => t.id !== id);
    saveData('todos');
    renderTodos();
}

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTodos();
    });
});

// ============================================
// POMODORO TIMER
// ============================================

let timerInterval = null;
let timeLeft = data.settings.pomodoro * 60;
let isRunning = false;
let currentMode = 'pomodoro';
let pomodoroCount = 0;

const timerDisplay = document.getElementById('timerDisplay');
const timerLabel = document.getElementById('timerLabel');
const timerStartBtn = document.getElementById('timerStartBtn');
const timerResetBtn = document.getElementById('timerResetBtn');
const timerRingProgress = document.getElementById('timerRingProgress');

// Mode buttons
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (isRunning) return;
        
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMode = btn.dataset.mode;
        resetTimer();
    });
});

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Update ring progress
    const totalTime = getModeTime() * 60;
    const progress = ((totalTime - timeLeft) / totalTime) * 880;
    timerRingProgress.style.strokeDashoffset = progress;
}

function getModeTime() {
    if (currentMode === 'pomodoro') return data.settings.pomodoro;
    if (currentMode === 'short') return data.settings.shortBreak;
    return data.settings.longBreak;
}

function startTimer() {
    if (isRunning) {
        pauseTimer();
        return;
    }
    
    isRunning = true;
    timerStartBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
    timerStartBtn.classList.add('pause');
    
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft === 0) {
            completeTimer();
        }
    }, 1000);
}

function pauseTimer() {
    isRunning = false;
    clearInterval(timerInterval);
    timerStartBtn.innerHTML = '<i class="fas fa-play"></i> Start';
    timerStartBtn.classList.remove('pause');
}

function resetTimer() {
    pauseTimer();
    timeLeft = getModeTime() * 60;
    updateTimerDisplay();
    timerRingProgress.style.strokeDashoffset = 0;
    
    if (currentMode === 'pomodoro') {
        timerLabel.textContent = 'Focus Time';
    } else if (currentMode === 'short') {
        timerLabel.textContent = 'Short Break';
    } else {
        timerLabel.textContent = 'Long Break';
    }
}

function completeTimer() {
    pauseTimer();
    
    if (data.settings.soundEnabled) {
        playNotificationSound();
    }
    
    if (currentMode === 'pomodoro') {
        pomodoroCount++;
        
        // Log session
        data.pomodoroSessions.push({
            type: 'pomodoro',
            duration: data.settings.pomodoro,
            date: Date.now()
        });
        saveData('pomodoroSessions');
        updatePomodoroStats();
        
        showNotification('Pomodoro completed! Time for a break.');
        
        // Auto-switch to break
        if (data.settings.autoStartBreaks) {
            setTimeout(() => {
                if (pomodoroCount % 4 === 0) {
                    switchMode('long');
                } else {
                    switchMode('short');
                }
                startTimer();
            }, 2000);
        }
    } else {
        showNotification('Break completed! Ready to focus?');
        
        if (data.settings.autoStartBreaks) {
            setTimeout(() => {
                switchMode('pomodoro');
                startTimer();
            }, 2000);
        }
    }
}

function switchMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
    resetTimer();
}

function playNotificationSound() {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZLQ8MU6vn77BbGgk+ltv0yHssCC1+zPLaizsIHWq77OScNxENVK7o87FeHAc+lt30yXosCC1+zPLaizsIHWq77OScNxENVK7o87FeHAc+lt30yXosCC1+zPLaizsIHWq77OScNxENVK7o87FeHAc+lt30yXosCC1+zPLaizsIHWq77OScNxENVK7o87FeHAc+lt30yXosCC1+zPLaizsIHWq77OScNxENVK7o87FeHAc+lt30yXosCC1+zPLaizsIHWq77OScNxENVK7o87FeHAc+lt30yXosCC1+zPLaizsIHWq77OScNxENVK7o87FeHAc+lt30yXosCC1+zPLaizsIHWq77OScNxENVK7o87FeHAc+lt30yXosCC1+zPLaizsIHWq77OScNxENVK7o87FeHAc+lt30yXosCC1+zPLaizsIHWq77OScNxENVK7o87FeHAc+lt30yXosCC1+zPLaizsIHWq77OScNxENVK7o87FeHAc+lt30yXosCC1+zPLaizsIHWq77OScNxENVK7o87FeHAc+lt30yXosCC1+zPLaizsIHWq77OScNxENVK7o87FeHAc+lt30yXosCC1+zPLaizsIHWq77OScNxENVK7o87FeHAc+lt30yXosCC1+zPLaizsIHWq77OScNxENVK7o87FeHAc+lt30yXosCC1+zPLaizsI');
    audio.play().catch(() => {});
}

function updatePomodoroStats() {
    const totalMinutes = data.pomodoroSessions.reduce((acc, s) => acc + s.duration, 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    document.getElementById('pomodoroCount').textContent = `${pomodoroCount} / 4`;
    document.getElementById('pomodoroTotalTime').textContent = `${hours}h ${minutes}m`;
    
    // Update history
    const historyList = document.getElementById('timerHistory');
    const recentSessions = data.pomodoroSessions.slice(-5).reverse();
    
    if (recentSessions.length === 0) {
        historyList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <p>No sessions yet</p>
            </div>
        `;
        return;
    }
    
    historyList.innerHTML = recentSessions.map(session => `
        <div class="history-item">
            <div class="history-info">
                <div class="history-icon">
                    <i class="fas fa-clock"></i>
                </div>
                <div class="history-details">
                    <h4>${session.type === 'pomodoro' ? 'Focus Session' : 'Break'}</h4>
                    <p>${new Date(session.date).toLocaleDateString()} at ${new Date(session.date).toLocaleTimeString()}</p>
                </div>
            </div>
            <span class="history-time">${session.duration}m</span>
        </div>
    `).join('');
}

timerStartBtn?.addEventListener('click', startTimer);
timerResetBtn?.addEventListener('click', resetTimer);

// Pomodoro settings
document.getElementById('pomodoroSettingsBtn')?.addEventListener('click', () => {
    document.getElementById('pomodoroDuration').value = data.settings.pomodoro;
    document.getElementById('shortBreakDuration').value = data.settings.shortBreak;
    document.getElementById('longBreakDuration').value = data.settings.longBreak;
    document.getElementById('autoStartBreaks').checked = data.settings.autoStartBreaks;
    document.getElementById('soundEnabled').checked = data.settings.soundEnabled;
    openModal('pomodoroSettingsModal');
});

document.getElementById('savePomodoroSettingsBtn')?.addEventListener('click', () => {
    data.settings.pomodoro = parseInt(document.getElementById('pomodoroDuration').value);
    data.settings.shortBreak = parseInt(document.getElementById('shortBreakDuration').value);
    data.settings.longBreak = parseInt(document.getElementById('longBreakDuration').value);
    data.settings.autoStartBreaks = document.getElementById('autoStartBreaks').checked;
    data.settings.soundEnabled = document.getElementById('soundEnabled').checked;
    
    saveData('settings');
    resetTimer();
    closeModal(document.getElementById('pomodoroSettingsModal'));
    showNotification('Settings saved successfully!');
});

// ============================================
// NOTES
// ============================================

let editingNoteId = null;

document.getElementById('addNoteBtn')?.addEventListener('click', () => {
    editingNoteId = null;
    document.getElementById('noteModalTitle').textContent = 'New Note';
    document.getElementById('noteTitle').value = '';
    document.getElementById('noteContent').value = '';
    openModal('noteModal');
});

document.getElementById('saveNoteBtn')?.addEventListener('click', () => {
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();
    
    if (!title || !content) {
        alert('Please fill in both title and content');
        return;
    }
    
    if (editingNoteId) {
        const note = data.notes.find(n => n.id === editingNoteId);
        if (note) {
            note.title = title;
            note.content = content;
            note.updatedAt = Date.now();
        }
    } else {
        const note = {
            id: Date.now(),
            title,
            content,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        data.notes.push(note);
    }
    
    saveData('notes');
    renderNotes();
    closeModal(document.getElementById('noteModal'));
    showNotification('Note saved successfully!');
});

function renderNotes() {
    const grid = document.getElementById('notesGrid');
    
    if (data.notes.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-sticky-note"></i>
                <p>No notes yet. Create your first note!</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = data.notes.map(note => `
        <div class="note-card" onclick="editNote(${note.id})">
            <div class="note-header">
                <h3 class="note-title">${note.title}</h3>
                <button class="note-menu" onclick="event.stopPropagation(); deleteNote(${note.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="note-content">${note.content}</div>
            <div class="note-footer">
                <span>${new Date(note.updatedAt).toLocaleDateString()}</span>
                <span>${note.content.length} characters</span>
            </div>
        </div>
    `).join('');
}

function editNote(id) {
    const note = data.notes.find(n => n.id === id);
    if (note) {
        editingNoteId = id;
        document.getElementById('noteModalTitle').textContent = 'Edit Note';
        document.getElementById('noteTitle').value = note.title;
        document.getElementById('noteContent').value = note.content;
        openModal('noteModal');
    }
}

function deleteNote(id) {
    if (confirm('Are you sure you want to delete this note?')) {
        data.notes = data.notes.filter(n => n.id !== id);
        saveData('notes');
        renderNotes();
    }
}

// ============================================
// CALENDAR
// ============================================

let currentDate = new Date();

function initCalendar() {
    renderCalendar();
    renderUpcomingEvents();
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    document.getElementById('currentMonth').textContent = 
        `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    
    // Day headers
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        grid.appendChild(header);
    });
    
    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.textContent = daysInPrevMonth - i;
        grid.appendChild(day);
    }
    
    // Current month days
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day';
        day.textContent = i;
        
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const hasEvent = data.events.some(e => e.date === dateStr);
        
        if (hasEvent) {
            day.classList.add('has-event');
        }
        
        if (today.getDate() === i && today.getMonth() === month && today.getFullYear() === year) {
            day.classList.add('today');
        }
        
        grid.appendChild(day);
    }
    
    // Next month days
    const remainingDays = 42 - (firstDay + daysInMonth);
    for (let i = 1; i <= remainingDays; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.textContent = i;
        grid.appendChild(day);
    }
}

document.getElementById('prevMonth')?.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

document.getElementById('nextMonth')?.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

document.getElementById('addEventBtn')?.addEventListener('click', () => {
    openModal('eventModal');
});

document.getElementById('saveEventBtn')?.addEventListener('click', () => {
    const title = document.getElementById('eventTitle').value.trim();
    const date = document.getElementById('eventDate').value;
    const time = document.getElementById('eventTime').value;
    const type = document.getElementById('eventType').value;
    
    if (!title || !date) {
        alert('Please fill in title and date');
        return;
    }
    
    const event = {
        id: Date.now(),
        title,
        date,
        time,
        type,
        createdAt: Date.now()
    };
    
    data.events.push(event);
    saveData('events');
    renderCalendar();
    renderUpcomingEvents();
    closeModal(document.getElementById('eventModal'));
    
    // Reset form
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventDate').value = '';
    document.getElementById('eventTime').value = '';
    
    showNotification('Event added successfully!');
});

function renderUpcomingEvents() {
    const container = document.getElementById('upcomingEvents');
    const upcoming = data.events
        .filter(e => new Date(e.date) >= new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);
    
    if (upcoming.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-alt"></i>
                <p>No upcoming events</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = upcoming.map(event => {
        const eventDate = new Date(event.date);
        const typeColors = {
            exam: '#ef4444',
            assignment: '#f59e0b',
            class: '#3b82f6',
            other: '#8b5cf6'
        };
        
        return `
            <div class="event-item" style="border-left-color: ${typeColors[event.type]}">
                <div class="event-date">
                    <div class="event-day">${eventDate.getDate()}</div>
                    <div class="event-month">${eventDate.toLocaleString('default', { month: 'short' })}</div>
                </div>
                <div class="event-details">
                    <h4>${event.title}</h4>
                    <p>${event.time || 'All day'}</p>
                </div>
                <span class="event-type" style="background: ${typeColors[event.type]}">${event.type}</span>
            </div>
        `;
    }).join('');
}

// ============================================
// GOALS
// ============================================

document.getElementById('addGoalBtn')?.addEventListener('click', () => {
    openModal('goalModal');
});

document.getElementById('goalProgress')?.addEventListener('input', (e) => {
    document.getElementById('goalProgressValue').textContent = `${e.target.value}%`;
});

document.getElementById('saveGoalBtn')?.addEventListener('click', () => {
    const title = document.getElementById('goalTitle').value.trim();
    const date = document.getElementById('goalDate').value;
    const progress = parseInt(document.getElementById('goalProgress').value);
    
    if (!title || !date) {
        alert('Please fill in title and target date');
        return;
    }
    
    const goal = {
        id: Date.now(),
        title,
        date,
        progress,
        createdAt: Date.now()
    };
    
    data.goals.push(goal);
    saveData('goals');
    renderGoals();
    closeModal(document.getElementById('goalModal'));
    
    // Reset form
    document.getElementById('goalTitle').value = '';
    document.getElementById('goalDate').value = '';
    document.getElementById('goalProgress').value = 0;
    document.getElementById('goalProgressValue').textContent = '0%';
    
    showNotification('Goal created successfully!');
});

function renderGoals() {
    const list = document.getElementById('goalsList');
    
    if (data.goals.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-trophy"></i>
                <p>No goals yet. Set your first goal!</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = data.goals.map(goal => `
        <div class="goal-card">
            <div class="goal-header">
                <h3 class="goal-title">${goal.title}</h3>
                <span class="goal-date">Target: ${new Date(goal.date).toLocaleDateString()}</span>
            </div>
            <div class="goal-progress-container">
                <div class="goal-progress-bar">
                    <div class="goal-progress-fill" style="width: ${goal.progress}%"></div>
                </div>
                <div class="goal-progress-text">${goal.progress}% Complete</div>
            </div>
            <div class="goal-actions">
                <button class="btn-small secondary" onclick="updateGoalProgress(${goal.id})">
                    Update Progress
                </button>
                <button class="btn-small secondary" onclick="deleteGoal(${goal.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function updateGoalProgress(id) {
    const goal = data.goals.find(g => g.id === id);
    if (goal) {
        const newProgress = prompt(`Update progress for "${goal.title}"
Current: ${goal.progress}%`, goal.progress);
        
        if (newProgress !== null) {
            const progress = parseInt(newProgress);
            if (progress >= 0 && progress <= 100) {
                goal.progress = progress;
                saveData('goals');
                renderGoals();
                
                if (progress === 100) {
                    showNotification('🎉 Congratulations! Goal completed!');
                }
            }
        }
    }
}

function deleteGoal(id) {
    if (confirm('Are you sure you want to delete this goal?')) {
        data.goals = data.goals.filter(g => g.id !== id);
        saveData('goals');
        renderGoals();
    }
}

// ============================================
// NOTIFICATIONS
// ============================================

function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification-toast';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Load user name if available
    const userName = localStorage.getItem('userName');
    if (userName) {
        document.getElementById('userName').textContent = userName;
    }
    
    // Initialize all sections
    renderSubjects();
    renderTodos();
    renderNotes();
    renderGoals();
    updateTimerDisplay();
    updatePomodoroStats();
    updateDashboard();
    
    // Add SVG gradient for timer
    const svg = document.querySelector('.timer-ring');
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
    `;
    svg.insertBefore(defs, svg.firstChild);
    
    console.log('Dashboard initialized successfully!');
});

// Make functions globally available
window.deleteSubject = deleteSubject;
window.logSession = logSession;
window.toggleTodo = toggleTodo;
window.deleteTodo = deleteTodo;
window.editNote = editNote;
window.deleteNote = deleteNote;
window.updateGoalProgress = updateGoalProgress;
window.deleteGoal = deleteGoal;
