const express = require('express');
const cors = require('cors');

const { v4: uuidv4, validate } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
    const { username } = request.headers;
    const user = users.find(user => user.username === username)

    if (!user) {
        return response.status(404).json({ error: "User not found." })
    }

    request.user = user;

    next();
}

function checksCreateTodosUserAvailability(request, response, next) {
    const { user } = request;
    const isFreePlan = !user.pro;
    const todosCount = user.todos.length;
    if (isFreePlan && todosCount >= 10) {
        return response.status(403).json({ error: "Limit of 10 todos reached. Upgrade to pro plan to continue." });
    }
    next();
}

function checksTodoExists(request, response, next) {
    const { username } = request.headers;
    const { id } = request.params;

    const user = users.find(user => user.username === username);

    if (!user) {
        return response.status(404).json({ error: "User not found." })
    }

    if(!validate(id)){
        return response.status(400).json({ error: "Todos id is invalid." })
    }

    const todo = user.todos.find(todo => todo.id === id);

    if (!todo) {
        return response.status(404).json({ error: "Todo not found." })
    }

    request.user = user;
    request.todo = todo;

    next();
}

function findUserById(request, response, next) {
    const { id } = request.params;
    const user = users.find(user => user.id === id)

    if (!user) {
        return response.status(404).json({ error: "User not found." })
    }

    request.user = user;

    next();
}

app.post('/users', (request, response) => {
    const { name, username } = request.body;
    const userAlreadyExists = users.some(user => user.username === username);

    if (userAlreadyExists) {
        response.status(400).json({ error: "User already exists." })
    }

    const newUser = {
        id: uuidv4(),
        name,
        username,
        pro: false,
        todos: []
    }
    users.push(newUser);

    return response.status(201).json(newUser)
});

app.get('/users/:id', findUserById, (request, response) => {
    const { user } = request;

    return response.json(user);
});

app.patch('/users/:id/pro', findUserById, (request, response) => {
    const { user } = request;

    if (user.pro) {
        return response.status(400).json({ error: 'Pro plan is already activated.' });
    }

    user.pro = true;

    return response.json(user);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
    const { user } = request;

    return response.status(200).json(user.todos);
});

app.post('/todos', checksExistsUserAccount, checksCreateTodosUserAvailability, (request, response) => {
    const { user } = request;
    const { title, deadline } = request.body;

    const newTodo = {
        id: uuidv4(),
        title,
        done: false,
        deadline: new Date(deadline),
        created_at: new Date()
    }
    user.todos.push(newTodo);

    return response.status(201).json(newTodo)
});

app.put('/todos/:id', checksTodoExists, (request, response) => {
    const { todo } = request;
    const { title, deadline } = request.body;

    todo.title = title;
    todo.deadline = new Date(deadline);

    return response.status(200).json(todo)
});

app.patch('/todos/:id/done', checksTodoExists, (request, response) => {
    const { todo } = request;

    todo.done = true;

    return response.status(200).json(todo)
});

app.delete('/todos/:id', checksTodoExists, (request, response) => {
    const { user, todo } = request;

    const todoIndex = user.todos.indexOf(todo);

    if (todoIndex === -1) {
        return response.status(404).json({ error: 'Todo not found' });
    }

    user.todos.splice(todoIndex);

    return response.status(204).send()
});

module.exports = {
    app,
    users,
    checksExistsUserAccount,
    checksCreateTodosUserAvailability,
    checksTodoExists,
    findUserById
};