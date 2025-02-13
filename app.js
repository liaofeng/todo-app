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
    const priority = document.getElementById('priority').value;
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
    
    const grouped = currentView === 'global' ? 
        groupByPriority(todos) : 
        groupByTopic(todos);
    
    for (const [group, items] of Object.entries(grouped)) {
        const groupElement = document.createElement('div');
        groupElement.innerHTML = `&lt;h3&gt;${group}&lt;/h3&gt;`;
        
        items.forEach(todo => {
            const todoElement = document.createElement('div');
            todoElement.className = `todo-item priority-${todo.priority}`;
            todoElement.innerHTML = `
                &lt;div&gt;
                    &lt;span class="topic-badge"&gt;${todo.topic}&lt;/span&gt;
                    ${todo.title}
                &lt;/div&gt;
                &lt;div&gt;
                    &lt;button onclick="editTodo(${todo.id})"&gt;编辑&lt;/button&gt;
                    &lt;button onclick="deleteTodo(${todo.id})"&gt;删除&lt;/button&gt;
                &lt;/div&gt;
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
    return items.reduce((acc, todo) => {
        acc[todo.topic] = acc[todo.topic] || groupByPriority([]);
        acc[todo.topic][priorityMap[todo.priority]] = acc[todo.topic][priorityMap[todo.priority]] || [];
        acc[todo.topic][priorityMap[todo.priority]].push(todo);
        return acc;
    }, {});
}

// 视图切换
function switchView(view) {
    localStorage.setItem('currentView', view);
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
        document.getElementById('priority').value = todo.priority;
        newTopicInput.value = todo.topic;
        
        todoForm.onsubmit = function(e) {
            e.preventDefault();
            Object.assign(todo, {
                title: document.getElementById('title').value,
                priority: document.getElementById('priority').value,
                topic: newTopicInput.value || topicSelect.value
            });
            localStorage.setItem('todos', JSON.stringify(todos));
            renderTodos();
            todoForm.reset();
            todoForm.onsubmit = null;
        }
    }
}

// 更新分类选择
function updateTopicSelect() {
    topicSelect.innerHTML = '&lt;option value=""&gt;选择或输入分类&lt;/option&gt;';
    [...new Set(topics)].forEach(topic => {
        const option = document.createElement('option');
        option.value = topic;
        option.textContent = topic;
        topicSelect.appendChild(option);
    });
}

// 初始化
updateTopicSelect();
renderTodos();