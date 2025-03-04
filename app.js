// 初始化数据存储
let todos = JSON.parse(localStorage.getItem('todos')) || [];
let topics = JSON.parse(localStorage.getItem('topics')) || [];

// 初始化DOM元素
const todoForm = document.getElementById('todoForm');
const todoList = document.getElementById('todoList');
const topicSelect = document.getElementById('topic');
const newTopicInput = document.getElementById('newTopic');
const submitButton = document.querySelector('#todoForm button[type="submit"]');

// 标记当前是否处于编辑模式
let editingTodoId = null;

// 表单提交处理
todoForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const title = document.getElementById('title').value;
    const priority = document.querySelector('input[name="priority"]:checked').value;
    const topic = newTopicInput.value || topicSelect.value;

    if (title && topic) {
        if (editingTodoId) {
            // 更新模式
            const editedTodo = todos.find(t => t.id === editingTodoId);
            if (editedTodo) {
                // 更新待办事项
                editedTodo.title = title;
                editedTodo.priority = priority;
                editedTodo.topic = topic;

                // 如果是新主题，添加到主题列表
                if (!topics.includes(topic)) {
                    topics.push(topic);
                    updateTopicSelect();
                }

                // 重置编辑模式
                editingTodoId = null;
                submitButton.textContent = '添加事项';
                document.querySelector('.cancel-button').style.display = 'none';
            }
        } else {
            // 添加模式
            addNewTodo(title, topic, priority);
        }

        localStorage.setItem('todos', JSON.stringify(todos));
        localStorage.setItem('topics', JSON.stringify(topics));
        renderTodos();
        todoForm.reset();
        newTopicInput.value = '';
    }
});

// 添加新待办事项
function addNewTodo(title, topic, priority) {
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
}

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
        groupElement.className = 'group-container';
        
        // 分类视图下，添加编辑按钮
        if (currentView === 'topic') {
            // 检查是否正在编辑当前分类
            if (editingTopicName === group) {
                // 编辑模式：显示编辑框和确认/取消按钮
                groupElement.innerHTML = `
                    <div class="topic-header">
                        <input type="text" class="topic-edit-input" value="${group}">
                        <div class="topic-edit-buttons">
                            <button class="confirm-topic-button" onclick="confirmTopicEdit('${group}')">确认</button>
                            <button class="cancel-topic-button" onclick="cancelTopicEdit()">取消</button>
                        </div>
                    </div>
                `;
            } else {
                // 非编辑模式：显示分类名和编辑按钮
                groupElement.innerHTML = `
                    <div class="topic-header">
                        <h3>${group}</h3>
                        <button class="edit-topic-button" onclick="editTopic('${group}')">修改</button>
                    </div>
                `;
            }
        } else {
            // 全局视图下保持原样
            groupElement.innerHTML = `<h3>${group}</h3>`;
        }

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

// 标记当前是否正在编辑分类
let editingTopicName = null;

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
        // 设置表单为编辑模式
        editingTodoId = todo.id;
        // 填充表单
        document.getElementById('title').value = todo.title;
        document.querySelector(`input[name="priority"][value="${todo.priority}"]`).checked = true;

        // 处理主题选择
        if (topics.includes(todo.topic)) {
            // 如果是已有主题，选中下拉列表对应选项
            topicSelect.value = todo.topic;
            newTopicInput.value = '';
        } else {
            // 如果是新主题，填入新主题输入框
            topicSelect.value = '';
            newTopicInput.value = todo.topic;
         }

        // 改变提交按钮文本
        submitButton.textContent = '更新事项';
        document.querySelector('.cancel-button').style.display = 'block';
        
        // 滚动到表单位置
        todoForm.scrollIntoView({ behavior: 'smooth' }); 
    }
}

// 取消编辑
function cancelEdit() {
    editingTodoId = null;
    submitButton.textContent = '添加事项';
    document.querySelector('.cancel-button').style.display = 'none';
    todoForm.reset();
    newTopicInput.value = '';
}


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
document.getElementById('showCompleted').addEventListener('change', function () {
    localStorage.setItem('showCompleted', JSON.stringify(this.checked));
    renderTodos();
});

// 开始编辑分类
function editTopic(topicName) {
    editingTopicName = topicName;
    renderTodos();
}

// 确认分类编辑
function confirmTopicEdit(oldTopicName) {
    const newTopicName = document.querySelector('.topic-edit-input').value.trim();
    
    // 确保输入不为空
    if (!newTopicName) {
        alert('分类名称不能为空');
        return;
    }
    
    // 确保新名称与旧名称不同
    if (newTopicName === oldTopicName) {
        editingTopicName = null;
        renderTodos();
        return;
    }
    
    // 更新todos中的topic
    todos.forEach(todo => {
        if (todo.topic === oldTopicName) {
            todo.topic = newTopicName;
        }
    });
    
    // 更新topics数组
    const index = topics.indexOf(oldTopicName);
    if (index !== -1) {
        topics.splice(index, 1);
        
        // 只有在topics中不存在新名称时才添加
        if (!topics.includes(newTopicName)) {
            topics.push(newTopicName);
        }
    }
    
    // 更新本地存储
    localStorage.setItem('todos', JSON.stringify(todos));
    localStorage.setItem('topics', JSON.stringify(topics));
    
    // 重置编辑模式
    editingTopicName = null;
    
    // 重新渲染界面并更新下拉菜单
    updateTopicSelect();
    renderTodos();
}

// 取消分类编辑
function cancelTopicEdit() {
    editingTopicName = null;
    renderTodos();
}

// 初始化
updateTopicSelect();
renderTodos();