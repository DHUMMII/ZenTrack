const SUPABASE_URL = 'https://jvjxqxwaixghvrztvmdf.supabase.co/';
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
    checkAuthState();
    loadTasks();
    updateDashboard();
    renderPrograms();
    loadTheme();
    loadUserPreferences();
    
    document.getElementById('signinForm').addEventListener('submit', handleSignIn);
    document.getElementById('signupForm').addEventListener('submit', handleSignUp);
    document.getElementById('contactForm').addEventListener('submit', handleContactForm);
    document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);
    document.getElementById('passwordForm').addEventListener('submit', handlePasswordChange);
    
    document.getElementById('alertCancel').addEventListener('click', closeAlert);
    document.getElementById('alertConfirm').addEventListener('click', handleAlertConfirm);
});

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobileOverlay');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
    if (overlay) {
        overlay.classList.toggle('active');
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

async function checkAuthState() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        currentUser = user;
        showDashboard();
        loadUserData();
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
    const email = document.getElementById('signinEmail').value;
    const password = document.getElementById('signinPassword').value;

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        showNotification('Sign in failed: ' + error.message, 'error');
    } else {
        currentUser = data.user;
        showNotification('Successfully signed in!', 'success');
        closeModal('signinModal');
        showDashboard();
        loadUserData();
    }
}

async function handleSignUp(e) {
    e.preventDefault();
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;

    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }

    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password
    });

    if (error) {
        showNotification('Sign up failed: ' + error.message, 'error');
    } else {
        showNotification('Account created successfully! Please check your email for verification.', 'success');
        closeModal('signupModal');
    }
}

async function logout() {
    const { error } = await supabase.auth.signOut();
    if (!error) {
        currentUser = null;
        tasks = [];
        enrolledPrograms = [];
        showLanding();
        showNotification('Successfully logged out', 'success');
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

    const newTask = {
        user_id: currentUser.id,
        title: title,
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
        showNotification('Error updating task: ' + error.message, 'error');
    }
}

async function deleteTask(taskId) {
    showAlert('deleteTask', 'Delete Task', 'Are you sure you want to delete this task?', taskId);
}

function renderTasks(filter = 'all') {
    const tasksList = document.getElementById('tasksList');
    if (!tasksList) return;
    
    let filteredTasks = tasks;

    switch (filter) {
        case 'pending':
            filteredTasks = tasks.filter(t => !t.completed);
            break;
        case 'completed':
            filteredTasks = tasks.filter(t => t.completed);
            break;
        case 'high':
            filteredTasks = tasks.filter(t => t.priority === 'high');
            break;
        case 'wellness':
        case 'work':
        case 'education':
        case 'personal':
            filteredTasks = tasks.filter(t => t.category === filter);
            break;
    }

    if (filteredTasks.length === 0) {
        tasksList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No tasks found for this filter.</p>';
        return;
    }

    tasksList.innerHTML = filteredTasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''} ${task.priority}">
            <button class="task-complete-btn ${task.completed ? 'completed' : ''}" onclick="toggleTask('${task.id}')">
                <i class="fas fa-check"></i>
            </button>
            <div class="task-content">
                <div class="task-title">${task.title}</div>
                <div class="task-meta">
                    <span class="task-badge ${task.priority}">${task.priority}</span>
                    <span>${task.category}</span>
                    ${task.due_date ? `<span>Due: ${new Date(task.due_date).toLocaleDateString()}</span>` : ''}
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
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    renderTasks(filter);
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
    if (!currentUser) {
        showNotification('Please sign in to enroll in programs', 'error');
        return;
    }

    const program = programTemplates[programId];
    if (!program) return;

    try {
        const { data: userData, error: userError } = await supabase
            .from('users')
            .upsert({
                id: currentUser.id,
                email: currentUser.email,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'id'
            });

        if (userError) throw userError;

        const existingEnrollment = enrolledPrograms.find(p => p.program_id === programId);
        if (existingEnrollment) {
            showNotification('You are already enrolled in this program', 'error');
            return;
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

        enrolledPrograms.push(enrollmentData[0]);

        const programTasks = program.tasks.map(task => ({
            user_id: currentUser.id,
            title: task.title,
            category: task.category,
            priority: task.priority,
            completed: false,
            created_at: new Date().toISOString(),
            program_id: programId
        }));

        const { data: tasksData, error: tasksError } = await supabase
            .from('tasks')
            .insert(programTasks)
            .select();

        if (tasksError) throw tasksError;

        tasks.push(...tasksData);
        
        updateDashboard();
        renderPrograms();
        showNotification(`Successfully enrolled in ${program.name}!`, 'success');
    } catch (error) {
        console.error('Error enrolling in program:', error);
        showNotification('Error enrolling in program: ' + error.message, 'error');
    }
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
                
                if (timerSeconds <= 0) {
                    pauseTimer();
                    showNotification('Timer finished!', 'success');
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
}

function resetTimer() {
    pauseTimer();
    timerSeconds = 0;
    updateTimerDisplay();
    document.getElementById('hoursInput').value = 0;
    document.getElementById('minutesInput').value = 0;
    document.getElementById('secondsInput').value = 0;
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
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let currentDate = new Date(today);
    
    while (streak < 365) {
        const dateString = currentDate.toISOString().split('T')[0];
        
        const hasCompletedTasks = tasks.some(task => {
            if (!task.completed) return false;
            
            const taskDateField = task.updated_at || task.created_at;
            if (!taskDateField) return false;
            
            const taskDate = new Date(taskDateField).toISOString().split('T')[0];
            return taskDate === dateString;
        });
        
        if (hasCompletedTasks) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
            currentDate.setHours(0, 0, 0, 0);
        } else {
            break;
        }
    }
    
    return streak;
}

function updateDashboard() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const activePrograms = enrolledPrograms.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const currentStreak = calculateStreak();
    const totalPoints = completedTasks * 10 + activePrograms * 50;

    const totalTasksEl = document.getElementById('totalTasks');
    const completedTasksEl = document.getElementById('completedTasks');
    const activeProgramsEl = document.getElementById('activePrograms');
    const completionRateEl = document.getElementById('completionRate');

    if (totalTasksEl) totalTasksEl.textContent = totalTasks;
    if (completedTasksEl) completedTasksEl.textContent = completedTasks;
    if (activeProgramsEl) activeProgramsEl.textContent = activePrograms;
    if (completionRateEl) completionRateEl.textContent = completionRate + '%';

    const progressTotalTasksEl = document.getElementById('progressTotalTasks');
    const progressCompletedTasksEl = document.getElementById('progressCompletedTasks');
    const progressActiveProgramsEl = document.getElementById('progressActivePrograms');
    const progressCompletionRateEl = document.getElementById('progressCompletionRate');
    const currentStreakEl = document.getElementById('currentStreak');
    const totalPointsEl = document.getElementById('totalPoints');

    if (progressTotalTasksEl) progressTotalTasksEl.textContent = totalTasks;
    if (progressCompletedTasksEl) progressCompletedTasksEl.textContent = completedTasks;
    if (progressActiveProgramsEl) progressActiveProgramsEl.textContent = activePrograms;
    if (progressCompletionRateEl) progressCompletionRateEl.textContent = completionRate + '%';
    if (currentStreakEl) currentStreakEl.textContent = currentStreak;
    if (totalPointsEl) totalPointsEl.textContent = totalPoints;

    const categories = ['wellness', 'work', 'education', 'personal'];
    categories.forEach(category => {
        const count = tasks.filter(t => t.category === category).length;
        const element = document.getElementById(category + 'Count');
        if (element) element.textContent = count;
    });

    updateWelcomeMessage();
    updateWellnessScore(completionRate, currentStreak, totalTasks);
    updateCharts();
    updateRecentActivities();

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
    `).join('') : '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No recent tasks. Start by adding your first wellness goal!</p>';
    
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
    `).join('') : '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Complete some tasks to see your achievements here!</p>';
    
    const progressRecentTasksEl = document.getElementById('progressRecentTasks');
    if (progressRecentTasksEl) progressRecentTasksEl.innerHTML = progressTasksHtml;

    updateBadges(completedTasks, currentStreak, totalTasks);
}

function updateWelcomeMessage() {
    const welcomeMessage = document.getElementById('welcomeMessage');
    const dailyTip = document.getElementById('dailyTip');
    
    if (!welcomeMessage || !dailyTip) return;
    
    const hour = new Date().getHours();
    let greeting = "Good evening";
    
    if (hour < 12) greeting = "Good morning";
    else if (hour < 18) greeting = "Good afternoon";
    
    const userName = localStorage.getItem('userName') || currentUser.email.split('@')[0];
    welcomeMessage.textContent = `${greeting}, ${userName}!`;
    
    const tips = [
        "Your daily wellness tip: Take a 5-minute break to stretch and breathe deeply.",
        "Tip: Stay hydrated! Drink a glass of water to boost your energy.",
        "Wellness reminder: Practice gratitude by writing down three things you're thankful for today.",
        "Health tip: Try to get at least 7-8 hours of quality sleep tonight.",
        "Mindfulness tip: Take a moment to focus on your breathing and clear your mind."
    ];
    
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    dailyTip.textContent = randomTip;
}

function updateWellnessScore(completionRate, streak, totalTasks) {
    const wellnessScoreEl = document.getElementById('wellnessScore');
    if (!wellnessScoreEl) return;
    
    let score = completionRate;
    
    if (streak >= 7) score += 10;
    else if (streak >= 3) score += 5;
    
    if (totalTasks >= 10) score += 10;
    else if (totalTasks >= 5) score += 5;
    
    score = Math.min(score, 100);
    
    wellnessScoreEl.textContent = score;
    
    const scoreCircle = document.querySelector('.score-circle');
    if (scoreCircle) {
        scoreCircle.style.background = `conic-gradient(var(--primary-color) 0% ${score}%, var(--border-color) ${score}% 100%)`;
    }
}

function updateCharts() {
    const weeklyChart = document.getElementById('weeklyProgressChart');
    if (weeklyChart) {
        const bars = weeklyChart.querySelectorAll('.chart-bar');
        bars.forEach(bar => {
            const randomHeight = Math.floor(Math.random() * 80) + 20;
            bar.style.height = `${randomHeight}%`;
        });
    }
    
    const categoryChart = document.getElementById('categoryChart');
    if (categoryChart) {
        const categories = ['wellness', 'work', 'education', 'personal'];
        const bars = categoryChart.querySelectorAll('.chart-bar');
        
        categories.forEach((category, index) => {
            if (bars[index]) {
                const count = tasks.filter(t => t.category === category).length;
                const maxCount = Math.max(...categories.map(cat => 
                    tasks.filter(t => t.category === cat).length
                )) || 1;
                
                const height = (count / maxCount) * 100;
                bars[index].style.height = `${height}%`;
            }
        });
    }
}

function updateRecentActivities() {
    const recentActivities = document.getElementById('recentActivities');
    if (!recentActivities) return;
    
    const recentCompleted = tasks
        .filter(t => t.completed)
        .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
        .slice(0, 5);
    
    const recentPrograms = enrolledPrograms
        .sort((a, b) => new Date(b.enrolled_at) - new Date(a.enrolled_at))
        .slice(0, 2);
    
    let activitiesHtml = '';
    
    recentCompleted.forEach(task => {
        const timeAgo = getTimeAgo(task.updated_at || task.created_at);
        activitiesHtml += `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">Completed ${task.title}</div>
                    <div class="activity-meta">
                        <span class="activity-category">${task.category.charAt(0).toUpperCase() + task.category.slice(1)}</span>
                        <span class="activity-time">${timeAgo}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    recentPrograms.forEach(program => {
        const timeAgo = getTimeAgo(program.enrolled_at);
        activitiesHtml += `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-graduation-cap"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">Started ${program.program_name}</div>
                    <div class="activity-meta">
                        <span class="activity-category">Program</span>
                        <span class="activity-time">${timeAgo}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    const streak = calculateStreak();
    if (streak >= 3) {
        activitiesHtml += `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-trophy"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">Earned ${streak}-Day Streak Badge</div>
                    <div class="activity-meta">
                        <span class="activity-category">Achievement</span>
                        <span class="activity-time">Today</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    if (!activitiesHtml) {
        activitiesHtml = `
            <div class="activity-item">
                <div class="activity-content">
                    <div class="activity-title">No recent activities</div>
                    <div class="activity-meta">
                        <span class="activity-category">Complete tasks to see activity here</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    recentActivities.innerHTML = activitiesHtml;
}

function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    
    return date.toLocaleDateString();
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
    
    if (file.size > 5 * 1024 * 1024) {
        showNotification('Image size must be less than 5MB', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const avatar = document.getElementById('settingsAvatar');
        const sidebarAvatar = document.getElementById('userAvatar');
        
        if (avatar) {
            avatar.style.backgroundImage = `url(${e.target.result})`;
            avatar.style.backgroundSize = 'cover';
            avatar.style.backgroundPosition = 'center';
            avatar.textContent = '';
        }
        
        if (sidebarAvatar) {
            sidebarAvatar.style.backgroundImage = `url(${e.target.result})`;
            sidebarAvatar.style.backgroundSize = 'cover';
            sidebarAvatar.style.backgroundPosition = 'center';
            sidebarAvatar.textContent = '';
        }
        
        localStorage.setItem(`userAvatar_${currentUser.id}`, e.target.result);
        showNotification('Profile picture updated!', 'success');
    };
    reader.readAsDataURL(file);
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
    if (!currentUser) return;
    
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
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zentrack-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Data exported successfully!', 'success');
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
        showNotification('Error deleting tasks: ' + error.message, 'error');
    }
}

async function deleteAccount() {
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        if (!session) throw new Error('No active session');

        const response = await fetch(`${SUPABASE_URL}/functions/v1/delete-user`, {
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

        localStorage.removeItem(`userAvatar_${currentUser.id}`);
        localStorage.removeItem('userName');
        localStorage.removeItem('userBio');
        localStorage.removeItem('defaultPriority');
        localStorage.removeItem('defaultCategory');
        localStorage.removeItem('emailNotifications');
        localStorage.removeItem('taskReminders');
        localStorage.removeItem('weeklyReports');

        showNotification('Account deleted successfully!', 'success');
        
        logout();
    } catch (error) {
        console.error('Error deleting account:', error);
        
        if (error.message.includes('Failed to delete account')) {
            showNotification('Account data deleted. Please contact support to complete account removal.', 'success');
            
            await supabase.from('tasks').delete().eq('user_id', currentUser.id);
            await supabase.from('user_programs').delete().eq('user_id', currentUser.id);
            
            localStorage.removeItem(`userAvatar_${currentUser.id}`);
            localStorage.removeItem('userName');
            localStorage.removeItem('userBio');
            localStorage.removeItem('defaultPriority');
            localStorage.removeItem('defaultCategory');
            localStorage.removeItem('emailNotifications');
            localStorage.removeItem('taskReminders');
            localStorage.removeItem('weeklyReports');
            
            logout();
        } else {
            showNotification('Error deleting account: ' + error.message, 'error');
        }
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const name = document.getElementById('settingsName').value;
    const bio = document.getElementById('settingsBio').value;
    
    localStorage.setItem('userName', name);
    localStorage.setItem('userBio', bio);
    
    const userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.textContent = name || currentUser.email.split('@')[0];
    
    showNotification('Profile updated successfully!', 'success');
}

async function handlePasswordChange(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;
    
    if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showNotification('Password must be at least 6 characters long', 'error');
        return;
    }
    
    try {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });
        
        if (error) throw error;
        
        showNotification('Password updated successfully!', 'success');
        document.getElementById('passwordForm').reset();
    } catch (error) {
        showNotification('Error updating password: ' + error.message, 'error');
    }
}

async function handleContactForm(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;
    
    try {
        const formData = new FormData(e.target);
        const templateParams = {
            from_name: formData.get('from_name'),
            from_email: formData.get('from_email'),
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
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

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

function showNotification(message, type) {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        ${message}
    `;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
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
