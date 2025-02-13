// 初始化数据存储
let todos = JSON.parse(localStorage.getItem('todos')) || [];
let topics = JSON.parse(localStorage.getItem('topics')) || [];

// 初始化DOM元素
const todoForm = document.getElementById('todoForm');
const todoList = document.getElementById('todoList');
const topicSelect = document.getElementById('topic');
const newTopicInput = document.getElementById('newTopic');

// 表单提交处理
todoForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const title = document.getElementById('title').value;
    const priority = document.querySelector('input[name="priority"]:checked').value;
    const topic = newTopicInput.value || topicSelect.value;
    
    if (title && topic) {
        const newTodo = {
            id: Date.now(),
            title,
            topic,
            priority,
            completed: false
        };
        
        todos.push(newTodo);
        if (!topics.includes(topic)) {
            topics.push(topic);
            updateTopicSelect();
        }
        
        localStorage.setItem('todos', JSON.stringify(todos));
        localStorage.setItem('topics', JSON.stringify(topics));
        renderTodos();
        todoForm.reset();
    }
});

// 渲染待办事项
function renderTodos() {
    todoList.innerHTML = '';
    const currentView = localStorage.getItem('currentView') || 'global';
    
    // Set the correct radio button as checked
    document.querySelector(`input[name="view"][value="${currentView}"]`).checked = true;
    
    const showCompleted = document.getElementById('showCompleted').checked;
    let filteredTodos = showCompleted ? todos : todos.filter(todo => !todo.completed);
    
    // Sort todos so that completed ones are at the end
    filteredTodos = filteredTodos.sort((a, b) => a.completed - b.completed);
    
    if (currentView === 'global') {
        // Sort by priority in descending order for global view
        filteredTodos = filteredTodos.sort((a, b) => b.priority - a.priority);
    }
    
    const grouped = currentView === 'global' ? 
        groupByPriority(filteredTodos) : 
        groupByTopic(filteredTodos);
    
    // Ensure consistent order of categories
    const orderedGroups = currentView === 'topic' ? Object.keys(grouped).sort() : Object.keys(grouped);
    
    for (const group of orderedGroups) {
        const items = grouped[group];
        const groupElement = document.createElement('div');
        groupElement.innerHTML = `<h3>${group}</h3>`;
        
        items.forEach(todo => {
            const todoElement = document.createElement('div');
            todoElement.className = `todo-item priority-${todo.priority} ${todo.completed ? 'completed' : ''}`;
            todoElement.innerHTML = `
                <div>
                    <input type="checkbox" ${todo.completed ? 'checked' : ''} onclick="completeTodo(${todo.id})">
                    ${currentView === 'global' ? `<span class="topic-badge">${todo.topic}</span>` : ''}
                    ${todo.title}
                </div>
                <div>
                    <button onclick="editTodo(${todo.id})">编辑</button>
                    <button onclick="deleteTodo(${todo.id})">删除</button>
                </div>
            `;
            groupElement.appendChild(todoElement);
        });
        
        todoList.appendChild(groupElement);
    }
}

// 分组函数
function groupByPriority(items) {
    const priorityMap = {
        3: '重要紧急',
        2: '重要不紧急', 
        1: '紧急不重要',
        0: '不重要不紧急'
    };
    return items.reduce((acc, todo) => {
        const group = priorityMap[todo.priority];
        acc[group] = acc[group] || [];
        acc[group].push(todo);
        return acc;
    }, {});
}

function groupByTopic(items) {
    // 按主题分组，每个主题对应一个 todo 数组
    return items.reduce((acc, todo) => {
        acc[todo.topic] = acc[todo.topic] || [];
        acc[todo.topic].push(todo);
        return acc;
    }, {});
}

// 视图切换
function switchView(viewType) {
    localStorage.setItem('currentView', viewType);
    renderTodos();
}

// 删除事项
function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    localStorage.setItem('todos', JSON.stringify(todos));
    renderTodos();
}

// 编辑事项
function editTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        document.getElementById('title').value = todo.title;
        document.querySelector(`input[name="priority"][value="${todo.priority}"]`).checked = true;
        newTopicInput.value = todo.topic;

        // Temporarily override the form submission for editing
        todoForm.onsubmit = function(e) {
            e.preventDefault();
            updateTodo(todo);
            todoForm.onsubmit = defaultFormSubmit; // Reset to default form submission after update
        }
    }
}

function updateTodo(todo) {
    // Remove the old todo item
    todos = todos.filter(t => t.id !== todo.id);

    // Update the todo item with new values
    Object.assign(todo, {
        title: document.getElementById('title').value,
        priority: document.querySelector('input[name="priority"]:checked').value,
        topic: newTopicInput.value || topicSelect.value
    });

    // Add the updated todo back to the list
    todos.push(todo);

    localStorage.setItem('todos', JSON.stringify(todos));
    renderTodos();
    todoForm.reset();
    todoForm.onsubmit = defaultFormSubmit; // Reset to default form submission
}

// Default form submission handler
function defaultFormSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('title').value;
    const priority = document.querySelector('input[name="priority"]:checked').value;
    const topic = newTopicInput.value || topicSelect.value;
    
    if (title && topic) {
        const newTodo = {
            id: Date.now(),
            title,
            topic,
            priority,
            completed: false
        };
        
        todos.push(newTodo);
        if (!topics.includes(topic)) {
            topics.push(topic);
            updateTopicSelect();
        }
        
        localStorage.setItem('todos', JSON.stringify(todos));
        localStorage.setItem('topics', JSON.stringify(topics));
        renderTodos();
        todoForm.reset();
    }
}

// Initialize the form's default submission handler
todoForm.onsubmit = defaultFormSubmit;

// 完成事项
function completeTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        
        // Sort todos by priority in descending order, then by completion status
        todos.sort((a, b) => b.priority - a.priority || a.completed - b.completed);
        
        localStorage.setItem('todos', JSON.stringify(todos));
        renderTodos();
    }
}

// 更新分类选择
function updateTopicSelect() {
    topicSelect.innerHTML = '<option value="">选择或输入分类</option>';
    [...new Set(topics)].forEach(topic => {
        const option = document.createElement('option');
        option.value = topic;
        option.textContent = topic;
        topicSelect.appendChild(option);
    });
}

// Initialize the checkbox state from local storage
document.getElementById('showCompleted').checked = JSON.parse(localStorage.getItem('showCompleted')) || false;

// Add event listener to the checkbox to re-render todos on change and save state
document.getElementById('showCompleted').addEventListener('change', function() {
    localStorage.setItem('showCompleted', JSON.stringify(this.checked));
    renderTodos();
});

// 初始化
updateTopicSelect();
renderTodos();