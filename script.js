const SUPABASE_URL = 'https://jvjxqxwaixghvrztvmdf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2anhxeHdhaXhnaHZyenR2bWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MzYyMjAsImV4cCI6MjA3NjIxMjIyMH0.Az9snZvkTKuLn4J5_1EFvOVUtdUtTlIRSmPzpZtSwIk';
const EMAILJS_PUBLIC_KEY = 'kp5EB2ns-wnu8fWti';
const EMAILJS_SERVICE_ID = 'service_u91m769';
const EMAILJS_TEMPLATE_ID = 'template_f7o3lld';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

(function() {
    emailjs.init(EMAILJS_PUBLIC_KEY);
})();

let currentUser = null;
let tasks = [];
let enrolledPrograms = [];
let timerInterval = null;
let timerSeconds = 0;
let isTimerRunning = false;
let currentAlertAction = null;
let touchStartX = 0;
let touchEndX = 0;
let currentTaskFilter = 'all';
let currentTaskSort = 'newest';
let currentSearchQuery = '';
let searchTimeout = null;
let autoBackupInterval = null;

const programTemplates = {
    'fitness-30': {
        name: '30-Day Fitness Challenge',
        tasks: [
            { title: 'Complete 20 push-ups', category: 'wellness', priority: 'medium' },
            { title: '30-minute cardio workout', category: 'wellness', priority: 'high' },
            { title: 'Drink 8 glasses of water', category: 'wellness', priority: 'low' },
            { title: 'Track daily calories', category: 'wellness', priority: 'medium' },
            { title: 'Get 8 hours of sleep', category: 'wellness', priority: 'high' }
        ]
    },
    'meditation-21': {
        name: 'Meditation Journey',
        tasks: [
            { title: '10-minute morning meditation', category: 'wellness', priority: 'high' },
            { title: 'Practice deep breathing exercises', category: 'wellness', priority: 'medium' },
            { title: 'Mindful eating during lunch', category: 'wellness', priority: 'low' },
            { title: 'Evening gratitude journal', category: 'wellness', priority: 'medium' },
            { title: 'Body scan meditation', category: 'wellness', priority: 'medium' }
        ]
    },
    'nutrition-14': {
        name: 'Healthy Nutrition Reset',
        tasks: [
            { title: 'Eat 5 servings of fruits/vegetables', category: 'wellness', priority: 'high' },
            { title: 'Prepare healthy meal prep', category: 'wellness', priority: 'medium' },
            { title: 'Avoid processed foods', category: 'wellness', priority: 'high' },
            { title: 'Take daily vitamins', category: 'wellness', priority: 'low' },
            { title: 'Plan tomorrow\'s meals', category: 'wellness', priority: 'medium' }
        ]
    },
    'sleep-10': {
        name: 'Sleep Optimization',
        tasks: [
            { title: 'Set consistent bedtime', category: 'wellness', priority: 'high' },
            { title: 'No screens 1 hour before bed', category: 'wellness', priority: 'medium' },
            { title: 'Create relaxing bedtime routine', category: 'wellness', priority: 'medium' },
            { title: 'Keep bedroom cool and dark', category: 'wellness', priority: 'low' },
            { title: 'Track sleep quality', category: 'wellness', priority: 'low' }
        ]
    }
};

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        await checkAuthState();
        loadTasks();
        updateDashboard();
        renderPrograms();
        loadTheme();
        loadUserPreferences();
        loadTimerState();
        setupSwipeGestures();
        setupEventListeners();
        setupAutoBackup();
        setupCharacterCounters();
    } catch (error) {
        console.error('App initialization failed:', error);
        showNotification('Failed to initialize app', 'error');
    }
}

function setupEventListeners() {
    document.getElementById('signinForm').addEventListener('submit', handleSignIn);
    document.getElementById('signupForm').addEventListener('submit', handleSignUp);
    document.getElementById('contactForm').addEventListener('submit', handleContactForm);
    document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);
    document.getElementById('passwordForm').addEventListener('submit', handlePasswordChange);
    document.getElementById('alertCancel').addEventListener('click', closeAlert);
    document.getElementById('alertConfirm').addEventListener('click', handleAlertConfirm);
    document.getElementById('taskTitle').addEventListener('input', function() {
        updateCharacterCounter('taskTitle', 'taskTitleCounter', 255);
    });
    document.getElementById('settingsBio').addEventListener('input', function() {
        updateCharacterCounter('settingsBio', 'bioCounter', 500);
    });
}

function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

function sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeInput(value);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}

async function executeWithErrorHandling(operation, errorMessage, successCallback = null) {
    try {
        const result = await operation();
        if (successCallback) successCallback(result);
        return result;
    } catch (error) {
        console.error(`${errorMessage}:`, error);
        showNotification(`${errorMessage}: ${error.message}`, 'error');
        throw error;
    }
}

function validateForm(formData, rules) {
    const errors = [];
    for (const [field, rule] of Object.entries(rules)) {
        const value = formData[field];
        if (rule.required && (!value || value.trim() === '')) {
            errors.push(`${field} is required`);
            continue;
        }
        if (value && rule.minLength && value.length < rule.minLength) {
            errors.push(`${field} must be at least ${rule.minLength} characters`);
        }
        if (value && rule.maxLength && value.length > rule.maxLength) {
            errors.push(`${field} must be less than ${rule.maxLength} characters`);
        }
        if (value && rule.pattern && !rule.pattern.test(value)) {
            errors.push(`${field} format is invalid`);
        }
        if (value && rule.match && value !== formData[rule.match]) {
            errors.push(`${field} must match ${rule.match}`);
        }
    }
    return errors;
}

function setLoadingState(element, isLoading, originalText = null) {
    if (isLoading) {
        element.disabled = true;
        element.dataset.originalText = originalText || element.innerHTML;
        element.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    } else {
        element.disabled = false;
        element.innerHTML = element.dataset.originalText || originalText;
    }
}

function getEmptyStateMessage(filter, searchQuery = '') {
    const messages = {
        'all': searchQuery ? `No tasks found for "${searchQuery}"` : 'No tasks yet. Add your first wellness goal above!',
        'pending': searchQuery ? `No pending tasks found for "${searchQuery}"` : 'No pending tasks. Great job!',
        'completed': searchQuery ? `No completed tasks found for "${searchQuery}"` : 'No completed tasks yet.',
        'high': searchQuery ? `No high priority tasks found for "${searchQuery}"` : 'No high priority tasks.',
        'wellness': searchQuery ? `No wellness tasks found for "${searchQuery}"` : 'No wellness tasks.',
        'work': searchQuery ? `No work tasks found for "${searchQuery}"` : 'No work tasks.',
        'education': searchQuery ? `No education tasks found for "${searchQuery}"` : 'No education tasks.',
        'personal': searchQuery ? `No personal tasks found for "${searchQuery}"` : 'No personal tasks.'
    };
    return `<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">${messages[filter] || 'No tasks found for this filter.'}</p>`;
}

function loadTimerState() {
    try {
        const savedTimer = localStorage.getItem('timerState');
        if (savedTimer) {
            const timerState = JSON.parse(savedTimer);
            const elapsed = Math.floor((Date.now() - timerState.timestamp) / 1000);
            if (timerState.running && timerState.seconds > elapsed) {
                timerSeconds = timerState.seconds - elapsed;
                updateTimerDisplay();
                startTimer();
            } else if (timerState.seconds > 0) {
                timerSeconds = timerState.seconds;
                updateTimerDisplay();
            }
        }
    } catch (error) {
        console.error('Error loading timer state:', error);
    }
}

function saveTimerState() {
    try {
        const timerState = {
            seconds: timerSeconds,
            running: isTimerRunning,
            timestamp: Date.now()
        };
        localStorage.setItem('timerState', JSON.stringify(timerState));
    } catch (error) {
        console.error('Error saving timer state:', error);
    }
}

function setupSwipeGestures() {
    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    });

    document.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
}

function handleSwipe() {
    const swipeThreshold = 50;
    if (touchStartX - touchEndX > swipeThreshold && window.innerWidth <= 1024) {
        toggleSidebar();
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobileOverlay');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
    if (overlay) {
        overlay.classList.toggle('active');
    }
    if (window.innerWidth <= 768) {
        document.querySelectorAll('.btn, .nav-item, .filter-btn').forEach(element => {
            element.style.minHeight = '44px';
            element.style.minWidth = '44px';
            element.style.display = 'flex';
            element.style.alignItems = 'center';
            element.style.justifyContent = 'center';
        });
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    const themeIcons = document.querySelectorAll('.theme-toggle i');
    themeIcons.forEach(icon => {
        icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    });
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeIcons = document.querySelectorAll('.theme-toggle i');
    themeIcons.forEach(icon => {
        icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    });
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        themeSelect.value = savedTheme;
    }
}

function changeTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    const themeIcons = document.querySelectorAll('.theme-toggle i');
    themeIcons.forEach(icon => {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    });
}

function showNotification(message, type) {
    const notification = document.getElementById('notification');
    if (!notification) return;
    const icon = type === 'success' ? 'check-circle' : 
                type === 'error' ? 'exclamation-circle' :
                type === 'warning' ? 'exclamation-triangle' : 'info-circle';
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${sanitizeInput(message)}</span>
    `;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    if (window.innerWidth <= 768) {
        notification.style.top = '1rem';
        notification.style.right = '1rem';
        notification.style.left = '1rem';
        notification.style.width = 'calc(100% - 2rem)';
    } else {
        notification.style.top = '2rem';
        notification.style.right = '2rem';
        notification.style.left = 'auto';
        notification.style.width = 'auto';
    }
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

async function checkAuthState() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            currentUser = user;
            showDashboard();
            loadUserData();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        showNotification('Failed to check authentication status', 'error');
    }
}

function showDashboard() {
    document.getElementById('home').classList.remove('active');
    document.getElementById('about').classList.remove('active');
    document.getElementById('dashboardLayout').classList.add('active');
    const email = currentUser.email;
    document.getElementById('userEmail').textContent = email;
    document.getElementById('userName').textContent = email.split('@')[0];
    document.getElementById('userAvatar').textContent = email.charAt(0).toUpperCase();
    const savedAvatar = localStorage.getItem(`userAvatar_${currentUser.id}`);
    if (savedAvatar) {
        const userAvatar = document.getElementById('userAvatar');
        const settingsAvatar = document.getElementById('settingsAvatar');
        if (userAvatar) {
            userAvatar.style.backgroundImage = `url(${savedAvatar})`;
            userAvatar.style.backgroundSize = 'cover';
            userAvatar.style.backgroundPosition = 'center';
            userAvatar.textContent = '';
        }
        if (settingsAvatar) {
            settingsAvatar.style.backgroundImage = `url(${savedAvatar})`;
            settingsAvatar.style.backgroundSize = 'cover';
            settingsAvatar.style.backgroundPosition = 'center';
            settingsAvatar.textContent = '';
        }
    }
}

function showLanding() {
    document.getElementById('home').classList.add('active');
    document.getElementById('about').classList.remove('active');
    document.getElementById('dashboardLayout').classList.remove('active');
}

async function handleSignIn(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    try {
        setLoadingState(submitBtn, true);
        const email = document.getElementById('signinEmail').value;
        const password = document.getElementById('signinPassword').value;
        if (!email || !password) {
            showNotification('Please fill in all fields', 'error');
            return;
        }
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        if (error) throw error;
        currentUser = data.user;
        showNotification('Successfully signed in!', 'success');
        closeModal('signinModal');
        showDashboard();
        loadUserData();
    } catch (error) {
        console.error('Sign in error:', error);
        showNotification('Sign in failed: ' + error.message, 'error');
    } finally {
        setLoadingState(submitBtn, false, originalText);
    }
}

async function handleSignUp(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    try {
        setLoadingState(submitBtn, true);
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        if (!email || !password || !confirmPassword) {
            showNotification('Please fill in all fields', 'error');
            return;
        }
        if (password !== confirmPassword) {
            showNotification('Passwords do not match', 'error');
            return;
        }
        if (password.length < 6) {
            showNotification('Password must be at least 6 characters long', 'error');
            return;
        }
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password
        });
        if (error) throw error;
        showNotification('Account created successfully! Please check your email for verification.', 'success');
        closeModal('signupModal');
    } catch (error) {
        console.error('Sign up error:', error);
        showNotification('Sign up failed: ' + error.message, 'error');
    } finally {
        setLoadingState(submitBtn, false, originalText);
    }
}


async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (!error) {
            currentUser = null;
            tasks = [];
            enrolledPrograms = [];
            showLanding();
            showNotification('Successfully logged out', 'success');
        }
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Logout failed', 'error');
    }
}

async function loadUserData() {
    if (!currentUser) return;
    try {
        const { data: tasksData, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', currentUser.id);
        if (!tasksError && tasksData) {
            tasks = tasksData;
        }
        const { data: programsData, error: programsError } = await supabase
            .from('user_programs')
            .select('*')
            .eq('user_id', currentUser.id);
        if (!programsError && programsData) {
            enrolledPrograms = programsData;
        }
        updateDashboard();
        renderTasks();
        renderPrograms();
    } catch (error) {
        console.error('Error loading user data:', error);
        showNotification('Failed to load user data', 'error');
    }
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    if (window.innerWidth <= 1024) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobileOverlay');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
    }
}

function showDashboardPage(pageId) {
    document.querySelectorAll('.dashboard-page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const clickedNavItem = document.querySelector(`[onclick="showDashboardPage('${pageId}')"]`);
    if (clickedNavItem) {
        clickedNavItem.classList.add('active');
    }
    if (pageId === 'dashboard' || pageId === 'progress') {
        updateDashboard();
    }
    if (pageId === 'settings') {
        loadSettings();
    }
    if (pageId === 'programs') {
        renderPrograms();
    }
    if (pageId === 'tasks') {
        renderTasks();
    }
    if (window.innerWidth <= 1024) {
        toggleSidebar();
    }
}

async function addTask() {
    if (!currentUser) {
        showNotification('Please sign in to add tasks', 'error');
        return;
    }
    const title = document.getElementById('taskTitle').value.trim();
    const priority = document.getElementById('taskPriority').value;
    const category = document.getElementById('taskCategory').value;
    const dueDate = document.getElementById('taskDueDate').value;
    if (!title) {
        showNotification('Please enter a task title', 'error');
        return;
    }
    const sanitizedTitle = sanitizeInput(title);
    const newTask = {
        user_id: currentUser.id,
        title: sanitizedTitle,
        priority: priority,
        category: category,
        due_date: dueDate || null,
        completed: false,
        created_at: new Date().toISOString()
    };
    try {
        const { data, error } = await supabase
            .from('tasks')
            .insert([newTask])
            .select();
        if (error) throw error;
        tasks.push(data[0]);
        renderTasks();
        updateDashboard();
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskDueDate').value = '';
        showNotification('Task added successfully!', 'success');
    } catch (error) {
        console.error('Error adding task:', error);
        showNotification('Error adding task: ' + error.message, 'error');
    }
}

async function toggleTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updatedTask = { ...task, completed: !task.completed };
    try {
        const { error } = await supabase
            .from('tasks')
            .update({ 
                completed: updatedTask.completed,
                updated_at: new Date().toISOString()
            })
            .eq('id', taskId);
        if (error) throw error;
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        tasks[taskIndex] = updatedTask;
        renderTasks();
        updateDashboard();
        showNotification(updatedTask.completed ? 'Task completed!' : 'Task marked as pending', 'success');
    } catch (error) {
        console.error('Error updating task:', error);
        showNotification('Error updating task: ' + error.message, 'error');
    }
}

async function deleteTask(taskId) {
    showAlert('deleteTask', 'Delete Task', 'Are you sure you want to delete this task?', taskId);
}

function renderTasks() {
    const tasksList = document.getElementById('tasksList');
    if (!tasksList) return;
    let filteredTasks = tasks;
    if (currentSearchQuery) {
        filteredTasks = searchTasks(currentSearchQuery, filteredTasks);
    }
    switch (currentTaskFilter) {
        case 'pending':
            filteredTasks = filteredTasks.filter(t => !t.completed);
            break;
        case 'completed':
            filteredTasks = filteredTasks.filter(t => t.completed);
            break;
        case 'high':
            filteredTasks = filteredTasks.filter(t => t.priority === 'high');
            break;
        case 'wellness':
        case 'work':
        case 'education':
        case 'personal':
            filteredTasks = filteredTasks.filter(t => t.category === currentTaskFilter);
            break;
    }
    filteredTasks = getSortedTasks(filteredTasks);
    if (filteredTasks.length === 0) {
        tasksList.innerHTML = getEmptyStateMessage(currentTaskFilter, currentSearchQuery);
        return;
    }
    tasksList.innerHTML = filteredTasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''} ${task.priority}">
            <button class="task-complete-btn ${task.completed ? 'completed' : ''}" onclick="toggleTask('${task.id}')">
                <i class="fas fa-check"></i>
            </button>
            <div class="task-content">
                <div class="task-title">${sanitizeInput(task.title)}</div>
                <div class="task-meta">
                    <span class="task-badge ${task.priority}">${task.priority}</span>
                    <span>${task.category}</span>
                    ${task.due_date ? `<span>Due: ${new Date(task.due_date).toLocaleDateString()}</span>` : ''}
                    ${task.is_program_task ? `<span><i class="fas fa-graduation-cap"></i> Program</span>` : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="btn btn-danger btn-sm" onclick="deleteTask('${task.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function filterTasks(filter) {
    currentTaskFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    renderTasks();
}

function searchTasks(query, taskList) {
    if (!query.trim()) return taskList;
    const searchTerm = query.toLowerCase();
    return taskList.filter(task => 
        task.title.toLowerCase().includes(searchTerm) ||
        task.category.toLowerCase().includes(searchTerm) ||
        task.priority.toLowerCase().includes(searchTerm)
    );
}

function getSortedTasks(taskList) {
    const sortedTasks = [...taskList];
    switch (currentTaskSort) {
        case 'newest':
            return sortedTasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        case 'oldest':
            return sortedTasks.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        case 'priority':
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return sortedTasks.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
        case 'dueDate':
            return sortedTasks.sort((a, b) => {
                if (!a.due_date && !b.due_date) return 0;
                if (!a.due_date) return 1;
                if (!b.due_date) return -1;
                return new Date(a.due_date) - new Date(b.due_date);
            });
        case 'completed':
            return sortedTasks.sort((a, b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);
        default:
            return sortedTasks;
    }
}

function sortTasks(sortType) {
    currentTaskSort = sortType;
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    renderTasks();
}

function debouncedSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentSearchQuery = document.getElementById('taskSearch').value.trim();
        renderTasks();
    }, 300);
}

function renderPrograms() {
    const programsGrid = document.getElementById('programsGrid');
    if (!programsGrid) return;
    programsGrid.innerHTML = Object.entries(programTemplates).map(([programId, program]) => {
        const isEnrolled = enrolledPrograms.some(p => p.program_id === programId);
        return `
            <div class="program-card">
                <div class="program-header">
                    <div class="program-duration">${programId.includes('30') ? '30' : programId.includes('21') ? '21' : programId.includes('14') ? '14' : '10'} Days</div>
                    <h3 class="program-title">${program.name}</h3>
                </div>
                <div class="program-body">
                    <p class="program-description">${getProgramDescription(programId)}</p>
                    <ul class="program-features">
                        ${program.tasks.slice(0, 4).map(task => `<li>${task.title}</li>`).join('')}
                    </ul>
                    <div class="program-actions">
                        ${isEnrolled ? 
                            `<button class="btn btn-primary" onclick="showAlert('unenrollProgram', 'Unenroll Program', 'Are you sure you want to unenroll from this program? This will also remove all associated tasks.', '${programId}')">
                                <i class="fas fa-times"></i> Unenroll
                            </button>
                            <button class="btn btn-secondary" onclick="showDashboardPage('tasks')">
                                <i class="fas fa-tasks"></i> View Tasks
                            </button>` :
                            `<button class="btn btn-primary" onclick="enrollProgram('${programId}')">
                                <i class="fas fa-play"></i> Enroll Now
                            </button>`
                        }
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getProgramDescription(programId) {
    const descriptions = {
        'fitness-30': 'A comprehensive fitness program designed to build strength, endurance, and healthy habits over 30 days.',
        'meditation-21': 'Develop a consistent meditation practice with guided sessions and mindfulness exercises.',
        'nutrition-14': 'Reset your eating habits with a structured nutrition program focused on whole foods and balanced meals.',
        'sleep-10': 'Improve your sleep quality and establish healthy sleep habits for better overall wellness.'
    };
    return descriptions[programId] || 'A wellness program designed to help you achieve your goals.';
}

async function enrollProgram(programId) {
    return executeWithErrorHandling(
        async () => {
            if (!currentUser) throw new Error('Please sign in to enroll in programs');
            const program = programTemplates[programId];
            if (!program) throw new Error('Program not found');
            const existingEnrollment = enrolledPrograms.find(p => p.program_id === programId);
            if (existingEnrollment) {
                throw new Error('You are already enrolled in this program');
            }
            const { data: enrollmentData, error: enrollmentError } = await supabase
                .from('user_programs')
                .insert([{
                    user_id: currentUser.id,
                    program_id: programId,
                    program_name: program.name,
                    enrolled_at: new Date().toISOString()
                }])
                .select();
            if (enrollmentError) throw enrollmentError;
            const programTasks = program.tasks.map(task => ({
                user_id: currentUser.id,
                title: task.title,
                category: task.category,
                priority: task.priority,
                completed: false,
                created_at: new Date().toISOString(),
                program_id: programId,
                is_program_task: true
            }));
            const { data: tasksData, error: tasksError } = await supabase
                .from('tasks')
                .insert(programTasks)
                .select();
            if (tasksError) throw tasksError;
            enrolledPrograms.push(enrollmentData[0]);
            tasks.push(...tasksData);
            updateDashboard();
            renderPrograms();
            return program.name;
        },
        'Error enrolling in program',
        (programName) => {
            showNotification(`Successfully enrolled in ${programName}!`, 'success');
        }
    );
}

async function unenrollProgram(programId) {
    if (!currentUser) {
        showNotification('Please sign in to manage programs', 'error');
        return;
    }
    try {
        const { error: tasksError } = await supabase
            .from('tasks')
            .delete()
            .eq('user_id', currentUser.id)
            .eq('program_id', programId);
        if (tasksError) throw tasksError;
        const { error: programError } = await supabase
            .from('user_programs')
            .delete()
            .eq('user_id', currentUser.id)
            .eq('program_id', programId);
        if (programError) throw programError;
        enrolledPrograms = enrolledPrograms.filter(p => p.program_id !== programId);
        tasks = tasks.filter(t => t.program_id !== programId);
        updateDashboard();
        renderTasks();
        renderPrograms();
        showNotification('Successfully unenrolled from program!', 'success');
    } catch (error) {
        console.error('Error unenrolling from program:', error);
        showNotification('Error unenrolling from program: ' + error.message, 'error');
    }
}

function updateTimerDisplay() {
    const hours = Math.floor(timerSeconds / 3600);
    const minutes = Math.floor((timerSeconds % 3600) / 60);
    const seconds = timerSeconds % 60;
    document.getElementById('timerDisplay').textContent = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (!isTimerRunning) {
        if (timerSeconds === 0) {
            const hours = parseInt(document.getElementById('hoursInput').value) || 0;
            const minutes = parseInt(document.getElementById('minutesInput').value) || 0;
            const seconds = parseInt(document.getElementById('secondsInput').value) || 0;
            timerSeconds = hours * 3600 + minutes * 60 + seconds;
        }
        if (timerSeconds > 0) {
            isTimerRunning = true;
            timerInterval = setInterval(() => {
                timerSeconds--;
                updateTimerDisplay();
                saveTimerState();
                if (timerSeconds <= 0) {
                    pauseTimer();
                    showNotification('Timer finished!', 'success');
                    localStorage.removeItem('timerState');
                }
            }, 1000);
        }
    }
}

function pauseTimer() {
    isTimerRunning = false;
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    saveTimerState();
}

function resetTimer() {
    pauseTimer();
    timerSeconds = 0;
    updateTimerDisplay();
    document.getElementById('hoursInput').value = 0;
    document.getElementById('minutesInput').value = 0;
    document.getElementById('secondsInput').value = 0;
    localStorage.removeItem('timerState');
}

function setPresetTimer(hours, minutes, seconds) {
    resetTimer();
    document.getElementById('hoursInput').value = hours;
    document.getElementById('minutesInput').value = minutes;
    document.getElementById('secondsInput').value = seconds;
    timerSeconds = hours * 3600 + minutes * 60 + seconds;
    updateTimerDisplay();
}

function calculateStreak() {
    if (!tasks.length) return 0;
    const completedTasks = tasks.filter(task => task.completed);
    if (!completedTasks.length) return 0;
    const completionDates = [...new Set(
        completedTasks
            .filter(task => task.updated_at || task.created_at)
            .map(task => {
                const dateField = task.updated_at || task.created_at;
                return new Date(dateField).toISOString().split('T')[0];
            })
    )].sort().reverse();
    if (!completionDates.length) return 0;
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let currentDate = today;
    if (completionDates.includes(today)) {
        streak = 1;
        currentDate = getPreviousDay(today);
    }
    while (completionDates.includes(currentDate)) {
        streak++;
        currentDate = getPreviousDay(currentDate);
    }
    return streak;
}

function getPreviousDay(dateString) {
    const date = new Date(dateString);
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
}

function updateDashboard() {
    try {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.completed).length;
        const activePrograms = enrolledPrograms.length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const currentStreak = calculateStreak();
        const totalPoints = completedTasks * 10 + activePrograms * 50;
        updateElementText('totalTasks', totalTasks);
        updateElementText('completedTasks', completedTasks);
        updateElementText('activePrograms', activePrograms);
        updateElementText('completionRate', completionRate + '%');
        updateElementText('progressTotalTasks', totalTasks);
        updateElementText('progressCompletedTasks', completedTasks);
        updateElementText('progressActivePrograms', activePrograms);
        updateElementText('progressCompletionRate', completionRate + '%');
        updateElementText('currentStreak', currentStreak);
        updateElementText('totalPoints', totalPoints);
        updateCategoryBreakdown();
        updateRecentTasks();
        updateBadges(completedTasks, currentStreak, totalTasks);
        updateWeeklyChart();
    } catch (error) {
        console.error('Error updating dashboard:', error);
    }
}

function updateElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) element.textContent = text;
}

function updateCategoryBreakdown() {
    const categories = ['wellness', 'work', 'education', 'personal'];
    categories.forEach(category => {
        const count = tasks.filter(t => t.category === category).length;
        const element = document.getElementById(category + 'Count');
        if (element) element.textContent = count;
    });
}

function updateRecentTasks() {
    const recentTasks = tasks.slice(-5).reverse();
    const recentTasksHtml = recentTasks.length > 0 ? recentTasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''} ${task.priority}">
            <div class="task-content">
                <div class="task-title">${sanitizeInput(task.title)}</div>
                <div class="task-meta">
                    <span class="task-badge ${task.priority}">${task.priority}</span>
                    <span>${task.category}</span>
                </div>
            </div>
        </div>
    `).join('') : '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No recent tasks. Start by adding your first wellness goal!</p>';
    const recentTasksEl = document.getElementById('recentTasks');
    if (recentTasksEl) recentTasksEl.innerHTML = recentTasksHtml;
    const recentCompletedTasks = tasks.filter(t => t.completed).slice(-5).reverse();
    const progressTasksHtml = recentCompletedTasks.length > 0 ? recentCompletedTasks.map(task => `
        <div class="task-item completed ${task.priority}">
            <div class="task-content">
                <div class="task-title">${sanitizeInput(task.title)}</div>
                <div class="task-meta">
                    <span class="task-badge ${task.priority}">${task.priority}</span>
                    <span>${task.category}</span>
                </div>
            </div>
        </div>
    `).join('') : '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Complete some tasks to see your achievements here!</p>';
    const progressRecentTasksEl = document.getElementById('progressRecentTasks');
    if (progressRecentTasksEl) progressRecentTasksEl.innerHTML = progressTasksHtml;
}

function updateBadges(completedTasks, streak, totalTasks) {
    const badges = document.querySelectorAll('.badge-item');
    if (completedTasks > 0 && badges[0]) {
        badges[0].style.opacity = '1';
    }
    if (streak >= 7 && badges[1]) {
        badges[1].style.opacity = '1';
    }
    if (totalTasks >= 10 && badges[2]) {
        badges[2].style.opacity = '1';
    }
    const wellnessTasks = tasks.filter(t => t.category === 'wellness').length;
    if (wellnessTasks >= 5 && badges[3]) {
        badges[3].style.opacity = '1';
    }
}

function updateWeeklyChart() {
    const chartContainer = document.getElementById('weeklyChart');
    if (!chartContainer) return;
    const last7Days = getLast7Days();
    const dailyCompletions = getDailyCompletions(last7Days);
    const bars = chartContainer.querySelectorAll('.chart-bar');
    bars.forEach((bar, index) => {
        if (index < dailyCompletions.length) {
            const completionCount = dailyCompletions[index];
            const maxHeight = Math.max(...dailyCompletions) || 1;
            const heightPercentage = (completionCount / maxHeight) * 100;
            bar.style.height = `${Math.max(heightPercentage, 10)}%`;
            bar.title = `${completionCount} tasks completed`;
        }
    });
}

function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date.toISOString().split('T')[0]);
    }
    return days;
}

function getDailyCompletions(days) {
    return days.map(day => {
        return tasks.filter(task => {
            if (!task.completed) return false;
            const completionDate = task.updated_at || task.created_at;
            if (!completionDate) return false;
            return completionDate.split('T')[0] === day;
        }).length;
    });
}

function loadSettings() {
    if (!currentUser) return;
    const settingsEmail = document.getElementById('settingsEmail');
    const settingsName = document.getElementById('settingsName');
    const settingsBio = document.getElementById('settingsBio');
    if (settingsEmail) settingsEmail.value = currentUser.email;
    if (settingsName) settingsName.value = localStorage.getItem('userName') || '';
    if (settingsBio) settingsBio.value = localStorage.getItem('userBio') || '';
    const avatar = localStorage.getItem(`userAvatar_${currentUser.id}`);
    const settingsAvatar = document.getElementById('settingsAvatar');
    if (settingsAvatar && avatar) {
        settingsAvatar.style.backgroundImage = `url(${avatar})`;
        settingsAvatar.style.backgroundSize = 'cover';
        settingsAvatar.style.backgroundPosition = 'center';
        settingsAvatar.textContent = '';
    } else if (settingsAvatar) {
        settingsAvatar.textContent = currentUser.email.charAt(0).toUpperCase();
    }
    loadUserPreferences();
}

function loadUserPreferences() {
    if (!currentUser) return;
    const defaultPriority = document.getElementById('defaultPriority');
    const defaultCategory = document.getElementById('defaultCategory');
    const emailNotifications = document.getElementById('emailNotifications');
    const taskReminders = document.getElementById('taskReminders');
    const weeklyReports = document.getElementById('weeklyReports');
    if (defaultPriority) defaultPriority.value = localStorage.getItem('defaultPriority') || 'medium';
    if (defaultCategory) defaultCategory.value = localStorage.getItem('defaultCategory') || 'wellness';
    if (emailNotifications) emailNotifications.checked = localStorage.getItem('emailNotifications') !== 'false';
    if (taskReminders) taskReminders.checked = localStorage.getItem('taskReminders') !== 'false';
    if (weeklyReports) weeklyReports.checked = localStorage.getItem('weeklyReports') === 'true';
    const taskPriority = document.getElementById('taskPriority');
    const taskCategory = document.getElementById('taskCategory');
    if (taskPriority) taskPriority.value = localStorage.getItem('defaultPriority') || 'medium';
    if (taskCategory) taskCategory.value = localStorage.getItem('defaultCategory') || 'wellness';
}

function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        showNotification('Please select a valid image file (JPEG, PNG, GIF, WebP)', 'error');
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        showNotification('Image size must be less than 5MB', 'error');
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        updateAvatar(e.target.result);
        showNotification('Profile picture updated!', 'success');
    };
    reader.onerror = function() {
        showNotification('Error reading image file', 'error');
    };
    reader.readAsDataURL(file);
}

function updateAvatar(avatarData) {
    const avatars = [
        document.getElementById('settingsAvatar'),
        document.getElementById('userAvatar')
    ];
    avatars.forEach(avatar => {
        if (avatar) {
            avatar.style.backgroundImage = `url(${avatarData})`;
            avatar.style.backgroundSize = 'cover';
            avatar.style.backgroundPosition = 'center';
            avatar.textContent = '';
        }
    });
    if (currentUser) {
        localStorage.setItem(`userAvatar_${currentUser.id}`, avatarData);
    }
}

function savePreferences() {
    localStorage.setItem('defaultPriority', document.getElementById('defaultPriority').value);
    localStorage.setItem('defaultCategory', document.getElementById('defaultCategory').value);
    localStorage.setItem('emailNotifications', document.getElementById('emailNotifications').checked);
    localStorage.setItem('taskReminders', document.getElementById('taskReminders').checked);
    localStorage.setItem('weeklyReports', document.getElementById('weeklyReports').checked);
    const taskPriority = document.getElementById('taskPriority');
    const taskCategory = document.getElementById('taskCategory');
    if (taskPriority) taskPriority.value = localStorage.getItem('defaultPriority') || 'medium';
    if (taskCategory) taskCategory.value = localStorage.getItem('defaultCategory') || 'wellness';
    showNotification('Preferences saved successfully!', 'success');
}

async function exportData() {
    return executeWithErrorHandling(
        async () => {
            if (!currentUser) throw new Error('Please sign in to export data');
            const exportData = {
                user: {
                    email: currentUser.email,
                    name: localStorage.getItem('userName') || '',
                    bio: localStorage.getItem('userBio') || ''
                },
                tasks: tasks,
                programs: enrolledPrograms,
                preferences: {
                    defaultPriority: localStorage.getItem('defaultPriority'),
                    defaultCategory: localStorage.getItem('defaultCategory'),
                    emailNotifications: localStorage.getItem('emailNotifications'),
                    taskReminders: localStorage.getItem('taskReminders'),
                    weeklyReports: localStorage.getItem('weeklyReports')
                },
                exportDate: new Date().toISOString()
            };
            await exportAsJSON(exportData);
            await exportAsCSV(exportData);
            return true;
        },
        'Error exporting data',
        () => {
            showNotification('Data exported successfully as JSON and CSV!', 'success');
        }
    );
}

async function exportAsJSON(data) {
    const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(jsonBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zentrack-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function exportAsCSV(data) {
    let csv = 'Category,Title,Priority,Completed,Created,Due Date\n';
    data.tasks.forEach(task => {
        csv += `Tasks,"${task.title.replace(/"/g, '""')}",${task.priority},${task.completed},${task.created_at},${task.due_date || ''}\n`;
    });
    data.programs.forEach(program => {
        csv += `Programs,"${program.program_name.replace(/"/g, '""')}",N/A,N/A,${program.enrolled_at},N/A\n`;
    });
    const csvBlob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(csvBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zentrack-data-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function setupAutoBackup() {
    autoBackupInterval = setInterval(() => {
        if (currentUser && tasks.length > 0) {
            backupData();
        }
    }, 30 * 60 * 1000);
}

function backupData() {
    try {
        const backup = {
            tasks: tasks,
            programs: enrolledPrograms,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('zentrack_backup', JSON.stringify(backup));
    } catch (error) {
        console.error('Backup failed:', error);
    }
}

function cleanup() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    if (autoBackupInterval) {
        clearInterval(autoBackupInterval);
        autoBackupInterval = null;
    }
    if (searchTimeout) {
        clearTimeout(searchTimeout);
        searchTimeout = null;
    }
}

function setupCharacterCounters() {
    updateCharacterCounter('taskTitle', 'taskTitleCounter', 255);
    updateCharacterCounter('settingsBio', 'bioCounter', 500);
}

function updateCharacterCounter(inputId, counterId, maxLength) {
    const input = document.getElementById(inputId);
    const counter = document.getElementById(counterId);
    if (!input || !counter) return;
    const length = input.value.length;
    counter.textContent = `${length}/${maxLength}`;
    counter.className = 'character-counter';
    if (length > maxLength * 0.8) {
        counter.classList.add('warning');
    }
    if (length > maxLength * 0.95) {
        counter.classList.add('error');
    }
}

async function clearAllData() {
    try {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('user_id', currentUser.id);
        if (error) throw error;
        tasks = [];
        renderTasks();
        updateDashboard();
        showNotification('All tasks deleted successfully!', 'success');
    } catch (error) {
        console.error('Error clearing data:', error);
        showNotification('Error deleting tasks: ' + error.message, 'error');
    }
}

async function deleteAccount() {
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) throw new Error('No active session');
        const projectUrl = SUPABASE_URL.replace('https://', '');
        const response = await fetch(`https://${projectUrl}/functions/v1/delete-user`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
            },
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Failed to delete account');
        }
        const keysToRemove = [
            `userAvatar_${currentUser.id}`,
            'userName',
            'userBio',
            'defaultPriority', 
            'defaultCategory',
            'emailNotifications',
            'taskReminders',
            'weeklyReports',
            'theme'
        ];
        keysToRemove.forEach(key => localStorage.removeItem(key));
        if (result.warning) {
            showNotification(result.message, 'success');
        } else {
            showNotification('Account deleted successfully!', 'success');
        }
        setTimeout(() => {
            logout();
        }, 2000);
    } catch (error) {
        console.error('Error deleting account:', error);
        if (error.message.includes('Failed to fetch') || error.message.includes('Failed to delete account')) {
            showNotification('Using fallback method to delete your data...', 'success');
            await supabase.from('tasks').delete().eq('user_id', currentUser.id);
            await supabase.from('user_programs').delete().eq('user_id', currentUser.id);
            const keysToRemove = [
                `userAvatar_${currentUser.id}`,
                'userName',
                'userBio',
                'defaultPriority',
                'defaultCategory', 
                'emailNotifications',
                'taskReminders',
                'weeklyReports',
                'theme'
            ];
            keysToRemove.forEach(key => localStorage.removeItem(key));
            showNotification('All your data has been deleted successfully! For complete account removal, please contact support.', 'success');
            setTimeout(() => {
                logout();
            }, 2000);
        } else {
            showNotification('Error: ' + error.message, 'error');
        }
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    try {
        setLoadingState(submitBtn, true);
        const name = document.getElementById('settingsName').value;
        const bio = document.getElementById('settingsBio').value;
        const validationRules = {
            name: { maxLength: 50 },
            bio: { maxLength: 500 }
        };
        const errors = validateForm({ name, bio }, validationRules);
        if (errors.length > 0) {
            throw new Error(errors.join(', '));
        }
        const sanitizedName = sanitizeInput(name);
        const sanitizedBio = sanitizeInput(bio);
        localStorage.setItem('userName', sanitizedName);
        localStorage.setItem('userBio', sanitizedBio);
        const userNameEl = document.getElementById('userName');
        if (userNameEl) {
            userNameEl.textContent = sanitizedName || currentUser.email.split('@')[0];
        }
        showNotification('Profile updated successfully!', 'success');
    } catch (error) {
        console.error('Profile update error:', error);
        showNotification('Error updating profile: ' + error.message, 'error');
    } finally {
        setLoadingState(submitBtn, false, originalText);
    }
}

async function handlePasswordChange(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    try {
        setLoadingState(submitBtn, true);
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;
        if (!currentPassword || !newPassword || !confirmPassword) {
            showNotification('Please fill in all fields', 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            showNotification('New passwords do not match', 'error');
            return;
        }
        if (newPassword.length < 6) {
            showNotification('Password must be at least 6 characters long', 'error');
            return;
        }
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });
        if (error) throw error;
        showNotification('Password updated successfully!', 'success');
        document.getElementById('passwordForm').reset();
    } catch (error) {
        console.error('Password change error:', error);
        showNotification('Error updating password: ' + error.message, 'error');
    } finally {
        setLoadingState(submitBtn, false, originalText);
    }
}

async function handleContactForm(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    try {
        setLoadingState(submitBtn, true);
        const formData = new FormData(e.target);
        const templateParams = {
            from_name: sanitizeInput(formData.get('name')),
            from_email: formData.get('email'),
            subject: sanitizeInput(formData.get('subject')),
            message: sanitizeInput(formData.get('message')),
            to_email: 'support@zentrack.com'
        };
        const response = await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            templateParams
        );
        if (response.status === 200) {
            showNotification('Message sent successfully! We\'ll get back to you soon.', 'success');
            document.getElementById('contactForm').reset();
        } else {
            throw new Error('Failed to send message');
        }
    } catch (error) {
        console.error('EmailJS Error:', error);
        showNotification('Failed to send message. Please try again later.', 'error');
    } finally {
        setLoadingState(submitBtn, false, originalText);
    }
}

function showAlert(action, title, message, data = null) {
    currentAlertAction = { action, data };
    if (action === 'deleteAccount') {
        document.getElementById('alertTitle').textContent = 'Delete All Data';
        document.getElementById('alertMessage').textContent = 'This will permanently delete ALL your data including tasks, programs, and personal information. This action cannot be undone. Continue?';
    } else {
        document.getElementById('alertTitle').textContent = title;
        document.getElementById('alertMessage').textContent = message;
    }
    document.getElementById('alertModal').style.display = 'block';
}

function closeAlert() {
    document.getElementById('alertModal').style.display = 'none';
    currentAlertAction = null;
}

function handleAlertConfirm() {
    if (!currentAlertAction) return;
    const { action, data } = currentAlertAction;
    switch (action) {
        case 'deleteTask':
            performDeleteTask(data);
            break;
        case 'unenrollProgram':
            unenrollProgram(data);
            break;
        case 'clearData':
            clearAllData();
            break;
        case 'deleteAccount':
            deleteAccount();
            break;
    }
    closeAlert();
}

async function performDeleteTask(taskId) {
    try {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId);
        if (error) throw error;
        tasks = tasks.filter(t => t.id !== taskId);
        renderTasks();
        updateDashboard();
        showNotification('Task deleted successfully!', 'success');
    } catch (error) {
        console.error('Error deleting task:', error);
        showNotification('Error deleting task: ' + error.message, 'error');
    }
}

function openModal(modalType) {
    const modalId = modalType === 'signin' ? 'signinModal' : 'signupModal';
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function switchModal(currentModalId, targetModalId) {
    closeModal(currentModalId);
    document.getElementById(targetModalId).style.display = 'block';
}

function toggleFaq(element) {
    const answer = element.nextElementSibling;
    const icon = element.querySelector('.faq-icon');
    document.querySelectorAll('.faq-answer').forEach(ans => {
        if (ans !== answer) {
            ans.classList.remove('active');
        }
    });
    document.querySelectorAll('.faq-question').forEach(q => {
        if (q !== element) {
            q.classList.remove('active');
        }
    });
    answer.classList.toggle('active');
    element.classList.toggle('active');
}

function loadTasks() {
    if (currentUser) {
        loadUserData();
    } else {
        tasks = [];
        renderTasks();
    }
}

window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal, .alert-modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

window.addEventListener('beforeunload', cleanup);
window.addEventListener('pagehide', cleanup);

window.toggleSidebar = toggleSidebar;
window.toggleTheme = toggleTheme;
window.showPage = showPage;
window.showDashboardPage = showDashboardPage;   
window.openModal = openModal;
window.closeModal = closeModal;
window.switchModal = switchModal;
window.logout = logout;
window.addTask = addTask;
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.filterTasks = filterTasks;
window.enrollProgram = enrollProgram;
window.startTimer = startTimer;
window.pauseTimer = pauseTimer;
window.resetTimer = resetTimer;
window.setPresetTimer = setPresetTimer;
window.handleAvatarUpload = handleAvatarUpload;
window.savePreferences = savePreferences;
window.exportData = exportData;
window.clearAllData = clearAllData;
window.deleteAccount = deleteAccount;
window.toggleFaq = toggleFaq;
window.debouncedSearch = debouncedSearch;
window.sortTasks = sortTasks;
window.updateCharacterCounter = updateCharacterCounter;
window.showAlert = showAlert;