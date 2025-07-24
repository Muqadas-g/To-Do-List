document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const taskCountSpan = document.getElementById('taskCount');
    const filterAllBtn = document.getElementById('filterAll');
    const filterPendingBtn = document.getElementById('filterPending');
    const filterCompletedBtn = document.getElementById('filterCompleted');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all'; // 'all', 'pending', 'completed'

    // --- Core Functions ---

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function renderTasks() {
        taskList.innerHTML = ''; // Clear existing tasks

        const filteredTasks = tasks.filter(task => {
            if (currentFilter === 'pending') {
                return !task.completed;
            } else if (currentFilter === 'completed') {
                return task.completed;
            }
            return true; // 'all' filter
        });

        // Display messages for empty states
        if (tasks.length === 0) {
            const noTasksMessage = document.createElement('li');
            noTasksMessage.className = 'task-item no-tasks';
            noTasksMessage.innerHTML = '<i class="far fa-clipboard"></i> Your To-Do list is empty! Add some tasks.';
            taskList.appendChild(noTasksMessage);
        } else if (filteredTasks.length === 0) {
            const noTasksMessage = document.createElement('li');
            noTasksMessage.className = 'task-item no-tasks';
            const filterText = currentFilter === 'pending' ? 'pending' : 'completed';
            noTasksMessage.innerHTML = `<i class="fas fa-search"></i> No ${filterText} tasks found.`;
            taskList.appendChild(noTasksMessage);
        }


        filteredTasks.forEach(task => {
            const listItem = document.createElement('li');
            listItem.className = `task-item ${task.completed ? 'completed' : ''}`;
            listItem.dataset.id = task.id; // Store task ID for easy reference

            // Using contenteditable for inline editing
            listItem.innerHTML = `
                <div class="task-content">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} aria-label="Mark task as complete">
                    <span class="task-text" contenteditable="false" data-placeholder="Click to edit">${task.text}</span>
                </div>
                <div class="task-actions">
                    <button class="edit-btn" title="Edit Task" aria-label="Edit Task"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" title="Delete Task" aria-label="Delete Task"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            taskList.appendChild(listItem);
        });

        updateTaskCount();
    }

    function addTask() {
        const taskText = taskInput.value.trim();
        if (taskText === '') {
            taskInput.focus();
            // Optional: Add a temporary visual feedback like shaking the input
            taskInput.classList.add('shake');
            setTimeout(() => taskInput.classList.remove('shake'), 500);
            return;
        }

        const newTask = {
            id: Date.now().toString(), // Unique ID
            text: taskText,
            completed: false
            // createdAt: new Date().toISOString() // Optional: Add timestamp
        };

        tasks.push(newTask);
        saveTasks();
        taskInput.value = ''; // Clear input
        renderTasks();
        taskInput.focus(); // Keep focus on input after adding
    }

    function markCompleted(id) {
        const taskIndex = tasks.findIndex(task => task.id === id);
        if (taskIndex > -1) {
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            saveTasks();
            renderTasks();
        }
    }

    function deleteTask(id) {
        // Confirmation dialog, professional look for this would be a custom modal
        if (confirm('Are you sure you want to delete this task?')) {
            tasks = tasks.filter(task => task.id !== id);
            saveTasks();
            renderTasks();
        }
    }

    function editTask(id, spanElement) {
        const taskIndex = tasks.findIndex(task => task.id === id);
        if (taskIndex > -1) {
            // Toggle contenteditable
            const isEditable = spanElement.contentEditable === 'true';
            spanElement.contentEditable = !isEditable;

            if (!isEditable) { // Just enabled editing
                spanElement.classList.add('editing');
                spanElement.focus(); // Focus on the span to allow editing
                // Select all text when starting to edit
                const range = document.createRange();
                range.selectNodeContents(spanElement);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            } else { // Just finished editing
                spanElement.classList.remove('editing');
                const newText = spanElement.textContent.trim();
                if (newText === '') {
                    alert('Task cannot be empty. Reverting to previous text.');
                    spanElement.textContent = tasks[taskIndex].text; // Revert if empty
                } else {
                    tasks[taskIndex].text = newText;
                    saveTasks();
                }
                // Remove selection after editing
                window.getSelection().removeAllRanges();
                renderTasks(); // Re-render to ensure UI reflects saved state and remove focus styling
            }
        }
    }

    function updateTaskCount() {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        taskCountSpan.textContent = `Total: ${totalTasks} | Completed: ${completedTasks}`;
    }

    function setFilter(filterType) {
        currentFilter = filterType;
        // Update active class on filter buttons
        document.querySelectorAll('.filter-section button').forEach(button => {
            button.classList.remove('active');
            button.setAttribute('aria-pressed', 'false');
        });

        const activeFilterBtn = document.getElementById(`filter${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`);
        if (activeFilterBtn) {
            activeFilterBtn.classList.add('active');
            activeFilterBtn.setAttribute('aria-pressed', 'true');
        }
        renderTasks();
    }

    // --- Event Listeners ---

    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    taskList.addEventListener('click', (e) => {
        const listItem = e.target.closest('.task-item');
        if (!listItem) return; // Not a task item

        const taskId = listItem.dataset.id;
        const taskTextSpan = listItem.querySelector('.task-text');

        if (e.target.classList.contains('task-checkbox')) {
            markCompleted(taskId);
        } else if (e.target.closest('.delete-btn')) { // Use closest for icon clicks
            deleteTask(taskId);
        } else if (e.target.closest('.edit-btn')) { // Use closest for icon clicks
            // Only allow editing if not already being edited
            if (taskTextSpan.contentEditable !== 'true') {
                editTask(taskId, taskTextSpan);
            }
        } else if (e.target.classList.contains('task-text') && taskTextSpan.contentEditable !== 'true') {
            // Allow clicking on text to start editing
            editTask(taskId, taskTextSpan);
        }
    });

    // Event listener for finishing inline editing on blur or Enter key
    taskList.addEventListener('blur', (e) => {
        if (e.target.classList.contains('task-text') && e.target.contentEditable === 'true') {
            const listItem = e.target.closest('.task-item');
            const taskId = listItem.dataset.id;
            editTask(taskId, e.target); // Call editTask to save changes
        }
    }, true); // Use capture phase for blur event

    taskList.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.target.classList.contains('task-text') && e.target.contentEditable === 'true') {
            e.preventDefault(); // Prevent new line
            e.target.blur(); // Trigger blur to save changes
        }
    });


    filterAllBtn.addEventListener('click', () => setFilter('all'));
    filterPendingBtn.addEventListener('click', () => setFilter('pending'));
    filterCompletedBtn.addEventListener('click', () => setFilter('completed'));

    // Initial render when the page loads
    renderTasks();
});