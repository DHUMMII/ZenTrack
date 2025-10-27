// Enhanced JavaScript with all requested functionality

// Constants and Initialization
const SUPABASE_URL = 'https://jvjxqxwaixghvrztvmdf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2anhxeHdhaXhnaHZyenR2bWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MzYyMjAsImV4cCI6MjA3NjIxMjIyMH0.Az9snZvkTKuLn4J5_1EFvOVUtdUtTlIRSmPzpZtSwIk';
const EMAILJS_PUBLIC_KEY = 'kp5EB2ns-wnu8fWti';
const EMAILJS_SERVICE_ID = 'service_u91m769';
const EMAILJS_TEMPLATE_ID = 'template_f7o3lld';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

(function() {
    emailjs.init(EMAILJS_PUBLIC_KEY);
})();

// Global Variables
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
let intervalTimerInterval = null;
let currentIntervalRound = 0;
let totalIntervalRounds = 0;
let isWorkInterval = true;
let timerHistory = [];
let draggedTask = null;

// Program Templates
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
    },
    'stress-management-7': {
        name: '7-Day Stress Relief',
        tasks: [
            { title: 'Practice deep breathing for 5 minutes', category: 'wellness', priority: 'high' },
            { title: 'Take a 15-minute walk in nature', category: 'wellness', priority: 'medium' },
            { title: 'Write in a gratitude journal', category: 'wellness', priority: 'medium' },
            { title: 'Listen to calming music', category: 'wellness', priority: 'low' },
            { title: 'Practice progressive muscle relaxation', category: 'wellness', priority: 'medium' }
        ]
    },
    'mindfulness-14': {
        name: '14-Day Mindfulness Challenge',
        tasks: [
            { title: 'Practice 10 minutes of mindful breathing', category: 'wellness', priority: 'high' },
            { title: 'Eat one meal mindfully', category: 'wellness', priority: 'medium' },
            { title: 'Take a mindful walk without distractions', category: 'wellness', priority: 'medium' },
            { title: 'Practice body scan meditation', category: 'wellness', priority: 'low' },
            { title: 'Reflect on three things you\'re grateful for', category: 'wellness', priority: 'medium' }
        ]
    }
};

// Motivational Quotes
const motivationalQuotes = [
    "The journey of a thousand miles begins with a single step.",
    "Your body can stand almost anything. It's your mind that you have to convince.",
    "The only bad workout is the one that didn't happen.",
    "Don't wish for it, work for it.",
    "Success is the sum of small efforts, repeated day in and day out.",
    "The hardest part is getting started. The rest is just persistence.",
    "Your future self will thank you for the effort you put in today.",
    "Wellness is not a destination, it's a way of life.",
    "Small progress is still progress.",
    "You are one workout away from a good mood."
];

// Initialize the application
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
        createParticles();
        setDailyQuote();
        setupDragAndDrop();
        
        // Show onboarding for new users
        if (!localStorage.getItem('onboardingCompleted') && currentUser) {
            setTimeout(() => {
                document.getElementById('onboardingWizard').style.display = 'flex';
            }, 1000);
        }
    } catch (error) {
        console.error('App initialization failed:', error);
        showNotification('Failed to initialize app', 'error');
    }
}

// Setup event listeners
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
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl+N for new task (when on tasks page)
        if (e.ctrlKey && e.key === 'n' && document.getElementById('tasks').classList.contains('active')) {
            e.preventDefault();
            document.getElementById('taskTitle').focus();
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            closeAllModals();
        }
        
        // Space to play/pause timer
        if (e.key === ' ' && document.getElementById('fitness').classList.contains('active')) {
            e.preventDefault();
            if (isTimerRunning) {
                pauseTimer();
            } else {
                startTimer();
            }
        }
    });

    // Mobile menu toggle
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768 && !e.target.closest('.nav-content') && !e.target.closest('.mobile-menu-btn')) {
            document.getElementById('mobileNav').style.display = 'none';
        }
    });
}

// Create particle effect
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random properties
        const size = Math.random() * 5 + 2;
        const left = Math.random() * 100;
        const animationDuration = Math.random() * 20 + 10;
        const animationDelay = Math.random() * 5;
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${left}%`;
        particle.style.animationDuration = `${animationDuration}s`;
        particle.style.animationDelay = `${animationDelay}s`;
        
        particlesContainer.appendChild(particle);
    }
}

// Set daily motivational quote
function setDailyQuote() {
    const quoteElement = document.getElementById('dailyQuote');
    if (!quoteElement) return;
    
    const today = new Date().getDate();
    const quoteIndex = today % motivationalQuotes.length;
    quoteElement.textContent = motivationalQuotes[quoteIndex];
}

// Setup drag and drop for tasks
function setupDragAndDrop() {
    const tasksList = document.getElementById('tasksList');
    if (!tasksList) return;

    tasksList.addEventListener('dragstart', function(e) {
        if (e.target.classList.contains('task-item')) {
            draggedTask = e.target;
            e.target.style.opacity = '0.5';
        }
    });

    tasksList.addEventListener('dragend', function(e) {
        if (e.target.classList.contains('task-item')) {
            e.target.style.opacity = '1';
            draggedTask = null;
        }
    });

    tasksList.addEventListener('dragover', function(e) {
        e.preventDefault();
        const afterElement = getDragAfterElement(tasksList, e.clientY);
        const draggable = draggedTask;
        if (afterElement == null) {
            tasksList.appendChild(draggable);
        } else {
            tasksList.insertBefore(draggable, afterElement);
        }
    });

    // Update task order in database after drop
    tasksList.addEventListener('drop', function(e) {
        e.preventDefault();
        updateTaskOrder();
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

async function updateTaskOrder() {
    if (!currentUser) return;
    
    const taskElements = document.querySelectorAll('.task-item');
    const updatedTasks = [];
    
    taskElements.forEach((element, index) => {
        const taskId = element.getAttribute('data-task-id');
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.order = index;
            updatedTasks.push(task);
        }
    });
    
    try {
        // Update tasks in database
        for (const task of updatedTasks) {
            const { error } = await supabase
                .from('tasks')
                .update({ order: task.order })
                .eq('id', task.id);
            
            if (error) throw error;
        }
        
        tasks = updatedTasks;
        showNotification('Task order updated', 'success');
    } catch (error) {
        console.error('Error updating task order:', error);
        // Don't show error notification for drag and drop
    }
}

// Toggle sidebar for mobile
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobileOverlay');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
    if (overlay) {
        overlay.classList.toggle('active');
    }
    
    // Toggle mobile nav visibility
    if (window.innerWidth <= 768) {
        const mobileNav = document.getElementById('mobileNav');
        mobileNav.style.display = mobileNav.style.display === 'none' ? 'flex' : 'none';
    }
}

// Toggle theme
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

// Change theme from select
function changeTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    const themeIcons = document.querySelectorAll('.theme-toggle i');
    themeIcons.forEach(icon => {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    });
}

// Load theme from localStorage
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

// Show notification
function showNotification(message, type) {
    const notification = document.getElementById('notification');
    if (!notification) return;
    const icon = type === 'success' ? 'check-circle' : 
                type === 'error' ? 'exclamation-circle' :
                type === 'warning' ? 'exclamation-triangle' : 'info-circle';
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    // Play sound for success notifications
    if (type === 'success') {
        playCompletionSound();
    }
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

// Play completion sound
function playCompletionSound() {
    const soundEnabled = localStorage.getItem('completionSound') !== 'false';
    if (!soundEnabled) return;
    
    const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
    audio.volume = 0.3;
    audio.play().catch(e => console.log('Audio play failed:', e));
}

// Show page
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    
    // Hide mobile nav if open
    if (window.innerWidth <= 768) {
        document.getElementById('mobileNav').style.display = 'none';
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Show dashboard page
function showDashboardPage(pageId) {
    document.querySelectorAll('.dashboard-page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const clickedNavItem = document.querySelector(`[onclick="showDashboardPage('${pageId}')"]`);
    if (clickedNavItem) {
        clickedNavItem.classList.add('active');
    }
    
    // Update mobile bottom nav
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const mobileNavItem = document.querySelector(`.mobile-nav-item[onclick*="${pageId}"]`);
    if (mobileNavItem) {
        mobileNavItem.classList.add('active');
    }
    
    // Update page-specific content
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
    if (pageId === 'fitness') {
        loadTimerHistory();
    }
    
    // Close sidebar on mobile
    if (window.innerWidth <= 1024) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobileOverlay');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
    }
}

// Open modal
function openModal(modalType) {
    const modalId = modalType === 'signin' ? 'signinModal' : 'signupModal';
    document.getElementById(modalId).style.display = 'block';
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close all modals
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    document.getElementById('alertModal').style.display = 'none';
    document.getElementById('onboardingWizard').style.display = 'none';
}

// Switch between modals
function switchModal(currentModalId, targetModalId) {
    closeModal(currentModalId);
    document.getElementById(targetModalId).style.display = 'block';
}

// Toggle FAQ answer
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

// Scroll to section
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

// Setup swipe gestures for mobile
function setupSwipeGestures() {
    let touchStartX = 0;
    let touchEndX = 0;
    
    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    });

    document.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        if (touchStartX - touchEndX > swipeThreshold && window.innerWidth <= 1024) {
            // Swipe left - close sidebar
            const sidebar = document.getElementById('sidebar');
            if (sidebar && sidebar.classList.contains('open')) {
                toggleSidebar();
            }
        } else if (touchEndX - touchStartX > swipeThreshold && window.innerWidth <= 1024) {
            // Swipe right - open sidebar
            const sidebar = document.getElementById('sidebar');
            if (sidebar && !sidebar.classList.contains('open')) {
                toggleSidebar();
            }
        }
    }
}

// Check authentication state
async function checkAuthState() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            currentUser = user;
            showDashboard();
            loadUserData();
        } else {
            showLanding();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
    }
}

// Show dashboard
function showDashboard() {
    document.getElementById('home').classList.remove('active');
    document.getElementById('about').classList.remove('active');
    document.getElementById('dashboardLayout').classList.add('active');
    
    if (currentUser) {
        const email = currentUser.email;
        document.getElementById('userEmail').textContent = email;
        document.getElementById('userName').textContent = email.split('@')[0];
        document.getElementById('userAvatar').textContent = email.charAt(0).toUpperCase();
        
        // Load saved avatar
        const savedAvatar = localStorage.getItem(`userAvatar_${currentUser.id}`);
        if (savedAvatar) {
            updateAvatar(savedAvatar);
        }
        
        // Load and display wellness goal
        const wellnessGoal = localStorage.getItem(`wellnessGoal_${currentUser.id}`);
        if (wellnessGoal) {
            displayWellnessGoal(wellnessGoal);
        }
    }
}

// Show landing page
function showLanding() {
    document.getElementById('home').classList.add('active');
    document.getElementById('about').classList.remove('active');
    document.getElementById('dashboardLayout').classList.remove('active');
}

// Handle sign in
async function handleSignIn(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        setLoadingState(submitBtn, true, originalText);
        
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

// Handle sign up
async function handleSignUp(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        setLoadingState(submitBtn, true, originalText);
        
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        const wellnessGoal = document.getElementById('signupWellnessGoal').value;
        
        if (!email || !password || !confirmPassword || !wellnessGoal) {
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
        
        if (error) {
            // Check if user already exists
            if (error.message.includes('already registered') || error.message.includes('User already exists')) {
                showNotification('An account with this email already exists. Please sign in instead.', 'error');
                return;
            }
            throw error;
        }
        
        // Save wellness goal for new user
        if (data.user) {
            localStorage.setItem(`wellnessGoal_${data.user.id}`, wellnessGoal);
        }
        
        showNotification('Account created successfully! Please check your email for verification.', 'success');
        closeModal('signupModal');
        
    } catch (error) {
        console.error('Sign up error:', error);
        showNotification('Sign up failed: ' + error.message, 'error');
    } finally {
        setLoadingState(submitBtn, false, originalText);
    }
}

// Logout
async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        currentUser = null;
        tasks = [];
        enrolledPrograms = [];
        showLanding();
        showNotification('Successfully logged out', 'success');
        
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Logout failed', 'error');
    }
}

// Load user data
async function loadUserData() {
    if (!currentUser) return;
    
    try {
        // Load tasks
        const { data: tasksData, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (!tasksError && tasksData) {
            tasks = tasksData;
        }
        
        // Load programs
        const { data: programsData, error: programsError } = await supabase
            .from('user_programs')
            .select('*')
            .eq('user_id', currentUser.id);
        
        if (!programsError && programsData) {
            enrolledPrograms = programsData;
        }
        
        // Load timer history
        const savedTimerHistory = localStorage.getItem(`timerHistory_${currentUser.id}`);
        if (savedTimerHistory) {
            timerHistory = JSON.parse(savedTimerHistory);
        }
        
        updateDashboard();
        renderTasks();
        renderPrograms();
        loadTimerHistory();
        
    } catch (error) {
        console.error('Error loading user data:', error);
        showNotification('Failed to load user data', 'error');
    }
}

// Add task
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
    
    const newTask = {
        user_id: currentUser.id,
        title: title,
        priority: priority,
        category: category,
        due_date: dueDate || null,
        completed: false,
        created_at: new Date().toISOString(),
        order: tasks.length
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
        
        // Clear form
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskDueDate').value = '';
        
        showNotification('Task added successfully!', 'success');
        
    } catch (error) {
        console.error('Error adding task:', error);
        showNotification('Error adding task: ' + error.message, 'error');
    }
}

// Toggle task completion
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

// Delete task
async function deleteTask(taskId) {
    showAlert('deleteTask', 'Delete Task', 'Are you sure you want to delete this task?', taskId);
}

// Perform task deletion
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

// Render tasks
function renderTasks() {
    const tasksList = document.getElementById('tasksList');
    if (!tasksList) return;
    
    let filteredTasks = tasks;
    
    // Apply search filter
    if (currentSearchQuery) {
        filteredTasks = searchTasks(currentSearchQuery, filteredTasks);
    }
    
    // Apply category filter
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
    
    // Apply sorting
    filteredTasks = getSortedTasks(filteredTasks);
    
    if (filteredTasks.length === 0) {
        tasksList.innerHTML = getEmptyStateMessage(currentTaskFilter, currentSearchQuery);
        return;
    }
    
    tasksList.innerHTML = filteredTasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''} ${task.priority}" 
            data-task-id="${task.id}" draggable="true">
            <button class="task-complete-btn ${task.completed ? 'completed' : ''}" 
                    onclick="toggleTask('${task.id}')">
                <i class="fas fa-check"></i>
            </button>
            <div class="task-content">
                <div class="task-title">${task.title}</div>
                <div class="task-meta">
                    <span class="task-badge ${task.priority}">${task.priority}</span>
                    <span>${task.category}</span>
                    ${task.due_date ? `<span>Due: ${new Date(task.due_date).toLocaleDateString()}</span>` : ''}
                    ${task.is_program_task ? `<span><i class="fas fa-graduation-cap"></i> Program</span>` : ''}
                </div>
                ${task.notes ? `
                    <div class="task-notes ${task.notesExpanded ? 'expanded' : ''}">
                        ${task.notes}
                    </div>
                    <button class="notes-toggle" onclick="toggleTaskNotes('${task.id}')">
                        ${task.notesExpanded ? 'Show less' : 'Show more'}
                    </button>
                ` : ''}
            </div>
            <div class="task-actions">
                <button class="btn btn-danger btn-sm" onclick="deleteTask('${task.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Search tasks
function searchTasks(query, taskList) {
    if (!query.trim()) return taskList;
    const searchTerm = query.toLowerCase();
    return taskList.filter(task => 
        task.title.toLowerCase().includes(searchTerm) ||
        task.category.toLowerCase().includes(searchTerm) ||
        task.priority.toLowerCase().includes(searchTerm)
    );
}

// Get sorted tasks
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

// Filter tasks
function filterTasks(filter) {
    currentTaskFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    renderTasks();
}

// Sort tasks
function sortTasks(sortType) {
    currentTaskSort = sortType;
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    renderTasks();
}

// Debounced search
function debouncedSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentSearchQuery = document.getElementById('taskSearch').value.trim();
        renderTasks();
    }, 300);
}

// Toggle task notes
function toggleTaskNotes(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.notesExpanded = !task.notesExpanded;
        renderTasks();
    }
}

// Get empty state message
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
    return `<div class="empty-state">
        <i class="fas fa-tasks"></i>
        <p>${messages[filter] || 'No tasks found for this filter.'}</p>
    </div>`;
}

// Render programs
function renderPrograms() {
    const programsGrid = document.getElementById('programsGrid');
    if (!programsGrid) return;
    
    programsGrid.innerHTML = Object.entries(programTemplates).map(([programId, program]) => {
        const isEnrolled = enrolledPrograms.some(p => p.program_id === programId);
        return `
            <div class="program-card">
                <div class="program-header">
                    <div class="program-duration">${programId.includes('30') ? '30' : programId.includes('21') ? '21' : programId.includes('14') ? '14' : programId.includes('7') ? '7' : '10'} Days</div>
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

// Get program description
function getProgramDescription(programId) {
    const descriptions = {
        'fitness-30': 'A comprehensive fitness program designed to build strength, endurance, and healthy habits over 30 days.',
        'meditation-21': 'Develop a consistent meditation practice with guided sessions and mindfulness exercises.',
        'nutrition-14': 'Reset your eating habits with a structured nutrition program focused on whole foods and balanced meals.',
        'sleep-10': 'Improve your sleep quality and establish healthy sleep habits for better overall wellness.',
        'stress-management-7': 'Learn effective techniques to manage daily stress and build resilience in just 7 days.',
        'mindfulness-14': 'Cultivate present-moment awareness and reduce anxiety with this 14-day mindfulness program.'
    };
    return descriptions[programId] || 'A wellness program designed to help you achieve your goals.';
}

// Enroll in program
async function enrollProgram(programId) {
    if (!currentUser) {
        showNotification('Please sign in to enroll in programs', 'error');
        return;
    }
    
    try {
        const program = programTemplates[programId];
        if (!program) {
            showNotification('Program not found', 'error');
            return;
        }
        
        const existingEnrollment = enrolledPrograms.find(p => p.program_id === programId);
        if (existingEnrollment) {
            showNotification('You are already enrolled in this program', 'error');
            return;
        }
        
        // Create enrollment
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
        
        // Create program tasks
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
        
        showNotification(`Successfully enrolled in ${program.name}!`, 'success');
        
    } catch (error) {
        console.error('Error enrolling in program:', error);
        showNotification('Error enrolling in program: ' + error.message, 'error');
    }
}

// Unenroll from program
async function unenrollProgram(programId) {
    if (!currentUser) {
        showNotification('Please sign in to manage programs', 'error');
        return;
    }
    
    try {
        // Delete program tasks
        const { error: tasksError } = await supabase
            .from('tasks')
            .delete()
            .eq('user_id', currentUser.id)
            .eq('program_id', programId);
        
        if (tasksError) throw tasksError;
        
        // Delete program enrollment
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

// Timer functions
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
                    playTimerCompletionSound();
                    saveTimerSession();
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

function saveTimerState() {
    const timerState = {
        seconds: timerSeconds,
        running: isTimerRunning,
        timestamp: Date.now()
    };
    localStorage.setItem('timerState', JSON.stringify(timerState));
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

function playTimerCompletionSound() {
    const soundEnabled = localStorage.getItem('timerSound') !== 'false';
    if (!soundEnabled) return;
    
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1);
}

function saveTimerSession() {
    if (!currentUser) return;
    
    const session = {
        duration: timerSeconds,
        completedAt: new Date().toISOString(),
        type: 'standard'
    };
    
    timerHistory.unshift(session);
    
    // Keep only last 50 sessions
    if (timerHistory.length > 50) {
        timerHistory = timerHistory.slice(0, 50);
    }
    
    localStorage.setItem(`timerHistory_${currentUser.id}`, JSON.stringify(timerHistory));
    loadTimerHistory();
}

function loadTimerHistory() {
    const historyList = document.getElementById('timerHistoryList');
    if (!historyList) return;
    
    if (timerHistory.length === 0) {
        historyList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 1rem;">No timer sessions recorded yet.</p>';
        return;
    }
    
    historyList.innerHTML = timerHistory.map(session => `
        <div class="timer-history-item">
            <span>${formatTime(session.duration)}</span>
            <span>${new Date(session.completedAt).toLocaleDateString()}</span>
            <span>${session.type === 'interval' ? 'Interval' : 'Standard'}</span>
        </div>
    `).join('');
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

// Interval timer functions
function startIntervalTimer() {
    const workMinutes = parseInt(document.getElementById('workInterval').value) || 5;
    const restMinutes = parseInt(document.getElementById('restInterval').value) || 1;
    const rounds = parseInt(document.getElementById('rounds').value) || 5;
    
    totalIntervalRounds = rounds;
    currentIntervalRound = 1;
    isWorkInterval = true;
    
    // Set timer for first work interval
    timerSeconds = workMinutes * 60;
    updateTimerDisplay();
    
    showNotification(`Starting interval timer: ${rounds} rounds of ${workMinutes}min work / ${restMinutes}min rest`, 'success');
    
    startTimer();
    
    // Override the timer completion to handle intervals
    const originalPauseTimer = pauseTimer;
    pauseTimer = function() {
        originalPauseTimer();
        
        if (timerSeconds <= 0) {
            if (isWorkInterval) {
                // Work interval completed, start rest
                if (currentIntervalRound <= totalIntervalRounds) {
                    timerSeconds = restMinutes * 60;
                    isWorkInterval = false;
                    showNotification(`Round ${currentIntervalRound}/${totalIntervalRounds}: Rest period started`, 'success');
                    startTimer();
                }
            } else {
                // Rest interval completed, start next work or finish
                if (currentIntervalRound < totalIntervalRounds) {
                    currentIntervalRound++;
                    timerSeconds = workMinutes * 60;
                    isWorkInterval = true;
                    showNotification(`Round ${currentIntervalRound}/${totalIntervalRounds}: Work period started`, 'success');
                    startTimer();
                } else {
                    // All rounds completed
                    showNotification('Interval timer completed! Great job!', 'success');
                    saveIntervalSession(workMinutes, restMinutes, rounds);
                    
                    // Restore original pauseTimer
                    pauseTimer = originalPauseTimer;
                }
            }
        }
    };
}

function saveIntervalSession(workMinutes, restMinutes, rounds) {
    if (!currentUser) return;
    
    const session = {
        type: 'interval',
        workDuration: workMinutes * 60,
        restDuration: restMinutes * 60,
        rounds: rounds,
        totalDuration: (workMinutes + restMinutes) * rounds * 60,
        completedAt: new Date().toISOString()
    };
    
    timerHistory.unshift(session);
    
    // Keep only last 50 sessions
    if (timerHistory.length > 50) {
        timerHistory = timerHistory.slice(0, 50);
    }
    
    localStorage.setItem(`timerHistory_${currentUser.id}`, JSON.stringify(timerHistory));
    loadTimerHistory();
}

// Update dashboard
function updateDashboard() {
    try {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.completed).length;
        const activePrograms = enrolledPrograms.length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const currentStreak = calculateStreak();
        const totalPoints = completedTasks * 10 + activePrograms * 50;
        
        // Update stats
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
        
        // Update progress bars
        updateProgressBar('totalTasksProgress', totalTasks > 0 ? 100 : 0);
        updateProgressBar('completedTasksProgress', totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0);
        updateProgressBar('activeProgramsProgress', activePrograms > 0 ? 100 : 0);
        updateProgressBar('completionRateProgress', completionRate);
        
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

function updateProgressBar(progressBarId, percentage) {
    const progressBar = document.getElementById(progressBarId);
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }
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
                <div class="task-title">${task.title}</div>
                <div class="task-meta">
                    <span class="task-badge ${task.priority}">${task.priority}</span>
                    <span>${task.category}</span>
                </div>
            </div>
        </div>
    `).join('') : '<div class="empty-state"><i class="fas fa-tasks"></i><p>No recent tasks. Start by adding your first wellness goal!</p></div>';
    
    const recentTasksEl = document.getElementById('recentTasks');
    if (recentTasksEl) recentTasksEl.innerHTML = recentTasksHtml;
    
    const recentCompletedTasks = tasks.filter(t => t.completed).slice(-5).reverse();
    const progressTasksHtml = recentCompletedTasks.length > 0 ? recentCompletedTasks.map(task => `
        <div class="task-item completed ${task.priority}">
            <div class="task-content">
                <div class="task-title">${task.title}</div>
                <div class="task-meta">
                    <span class="task-badge ${task.priority}">${task.priority}</span>
                    <span>${task.category}</span>
                </div>
            </div>
        </div>
    `).join('') : '<div class="empty-state"><i class="fas fa-trophy"></i><p>Complete some tasks to see your achievements here!</p></div>';
    
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

// Settings functions
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
    
    // Load wellness goal
    const wellnessGoal = localStorage.getItem(`wellnessGoal_${currentUser.id}`);
    const wellnessGoalSelect = document.getElementById('wellnessGoal');
    if (wellnessGoalSelect && wellnessGoal) {
        wellnessGoalSelect.value = wellnessGoal;
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

function updateWellnessGoal() {
    if (!currentUser) return;
    
    const wellnessGoal = document.getElementById('wellnessGoal').value;
    if (wellnessGoal) {
        localStorage.setItem(`wellnessGoal_${currentUser.id}`, wellnessGoal);
        displayWellnessGoal(wellnessGoal);
        showNotification('Wellness goal updated!', 'success');
    }
}

function displayWellnessGoal(goal) {
    const wellnessGoalDisplay = document.getElementById('wellnessGoalDisplay');
    const currentWellnessGoal = document.getElementById('currentWellnessGoal');
    
    if (wellnessGoalDisplay && currentWellnessGoal) {
        wellnessGoalDisplay.style.display = 'flex';
        
        const goalLabels = {
            'meditation': 'Meditation Practice',
            'fitness': 'Fitness & Exercise',
            'weight-gain': 'Healthy Weight Gain',
            'weight-loss': 'Weight Loss',
            'sleep': 'Sleep Improvement',
            'nutrition': 'Healthy Nutrition',
            'stress-management': 'Stress Management',
            'mindfulness': 'Mindfulness Practice'
        };
        
        currentWellnessGoal.textContent = goalLabels[goal] || goal;
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

async function handleProfileUpdate(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        setLoadingState(submitBtn, true, originalText);
        
        const name = document.getElementById('settingsName').value;
        const bio = document.getElementById('settingsBio').value;
        
        localStorage.setItem('userName', name);
        localStorage.setItem('userBio', bio);
        
        const userNameEl = document.getElementById('userName');
        if (userNameEl) {
            userNameEl.textContent = name || currentUser.email.split('@')[0];
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
        setLoadingState(submitBtn, true, originalText);
        
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

// Data management
async function exportData() {
    if (!currentUser) {
        showNotification('Please sign in to export data', 'error');
        return;
    }
    
    try {
        const exportData = {
            user: {
                email: currentUser.email,
                name: localStorage.getItem('userName') || '',
                bio: localStorage.getItem('userBio') || '',
                wellnessGoal: localStorage.getItem(`wellnessGoal_${currentUser.id}`) || ''
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
        
        showNotification('Data exported successfully as JSON and CSV!', 'success');
        
    } catch (error) {
        console.error('Error exporting data:', error);
        showNotification('Error exporting data: ' + error.message, 'error');
    }
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
        
        // Delete user data
        await supabase.from('tasks').delete().eq('user_id', currentUser.id);
        await supabase.from('user_programs').delete().eq('user_id', currentUser.id);
        
        // Clear local storage
        const keysToRemove = [
            `userAvatar_${currentUser.id}`,
            `wellnessGoal_${currentUser.id}`,
            'userName',
            'userBio',
            'defaultPriority',
            'defaultCategory',
            'emailNotifications',
            'taskReminders',
            'weeklyReports',
            'theme',
            'onboardingCompleted'
        ];
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        showNotification('All your data has been deleted successfully!', 'success');
        
        setTimeout(() => {
            logout();
        }, 2000);
        
    } catch (error) {
        console.error('Error deleting account:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

// Contact form
async function handleContactForm(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        setLoadingState(submitBtn, true, originalText);
        
        const formData = new FormData(e.target);
        const templateParams = {
            from_name: formData.get('name'),
            from_email: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message'),
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

// Alert system
function showAlert(action, title, message, data = null) {
    currentAlertAction = { action, data };
    
    document.getElementById('alertTitle').textContent = title;
    document.getElementById('alertMessage').textContent = message;
    
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

// Utility functions
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

function setupAutoBackup() {
    autoBackupInterval = setInterval(() => {
        if (currentUser && tasks.length > 0) {
            backupData();
        }
    }, 30 * 60 * 1000); // Every 30 minutes
}

function backupData() {
    try {
        const backup = {
            tasks: tasks,
            programs: enrolledPrograms,
            timerHistory: timerHistory,
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
    if (intervalTimerInterval) {
        clearInterval(intervalTimerInterval);
        intervalTimerInterval = null;
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

// Onboarding functions
function nextWizardStep() {
    document.querySelector('.wizard-step.active').classList.remove('active');
    document.getElementById('wizardStep2').classList.add('active');
}

function prevWizardStep() {
    document.querySelector('.wizard-step.active').classList.remove('active');
    document.getElementById('wizardStep1').classList.add('active');
}

function selectWellnessGoal(goal) {
    // Set the category based on selected goal
    const categorySelect = document.getElementById('onboardingTaskCategory');
    if (categorySelect) {
        categorySelect.value = 'wellness';
    }
    
    // Pre-fill task title based on goal
    const taskTitle = document.getElementById('onboardingTaskTitle');
    if (taskTitle) {
        const taskTitles = {
            'fitness': '30-minute workout session',
            'nutrition': 'Prepare a healthy meal',
            'meditation': '10-minute meditation',
            'sleep': 'Get 8 hours of quality sleep'
        };
        taskTitle.value = taskTitles[goal] || 'Set a wellness goal';
    }
}

function completeOnboarding() {
    const taskTitle = document.getElementById('onboardingTaskTitle').value;
    const category = document.getElementById('onboardingTaskCategory').value;
    
    if (taskTitle && currentUser) {
        // Add the task
        const newTask = {
            user_id: currentUser.id,
            title: taskTitle,
            priority: 'medium',
            category: category,
            completed: false,
            created_at: new Date().toISOString(),
            order: tasks.length
        };
        
        // In a real app, you would save this to the database
        tasks.push(newTask);
        renderTasks();
        updateDashboard();
        
        // Mark onboarding as completed
        localStorage.setItem('onboardingCompleted', 'true');
        
        // Close wizard
        document.getElementById('onboardingWizard').style.display = 'none';
        
        showNotification('Welcome to ZenTrack! Your first task has been created.', 'success');
    }
}

function skipOnboarding() {
    localStorage.setItem('onboardingCompleted', 'true');
    document.getElementById('onboardingWizard').style.display = 'none';
    showNotification('Welcome to ZenTrack! You can always find setup guides in the Help section.', 'success');
}

// Load tasks from localStorage (fallback)
function loadTasks() {
    if (currentUser) {
        loadUserData();
    } else {
        // Load demo tasks for landing page
        const savedTasks = localStorage.getItem('demoTasks');
        if (savedTasks) {
            tasks = JSON.parse(savedTasks);
        } else {
            // Create sample tasks for demo
            tasks = [
                {
                    id: '1',
                    title: '30-minute morning walk',
                    priority: 'medium',
                    category: 'wellness',
                    completed: true,
                    created_at: new Date().toISOString()
                },
                {
                    id: '2',
                    title: 'Drink 8 glasses of water',
                    priority: 'low',
                    category: 'wellness',
                    completed: false,
                    created_at: new Date().toISOString()
                },
                {
                    id: '3',
                    title: 'Complete work project',
                    priority: 'high',
                    category: 'work',
                    completed: false,
                    created_at: new Date().toISOString()
                }
            ];
            localStorage.setItem('demoTasks', JSON.stringify(tasks));
        }
        renderTasks();
    }
}

// Make functions globally available
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
window.startIntervalTimer = startIntervalTimer;
window.handleAvatarUpload = handleAvatarUpload;
window.updateWellnessGoal = updateWellnessGoal;
window.savePreferences = savePreferences;
window.exportData = exportData;
window.clearAllData = clearAllData;
window.deleteAccount = deleteAccount;
window.toggleFaq = toggleFaq;
window.debouncedSearch = debouncedSearch;
window.sortTasks = sortTasks;
window.updateCharacterCounter = updateCharacterCounter;
window.toggleTaskNotes = toggleTaskNotes;
window.nextWizardStep = nextWizardStep;
window.prevWizardStep = prevWizardStep;
window.selectWellnessGoal = selectWellnessGoal;
window.completeOnboarding = completeOnboarding;
window.skipOnboarding = skipOnboarding;
window.changeTheme = changeTheme;

// Cleanup on page unload
window.addEventListener('beforeunload', cleanup);
window.addEventListener('pagehide', cleanup);

// Click outside modals to close
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal, .alert-modal, .onboarding-wizard');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
};
