const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
    const { username } = request.headers;
    const user = users.find(user => user.username === username)

    if (!user) {
        response.status(404).json({ error: "User not found." })
    }

    request.local = { user };

    next();
}

function checksExistsUserTodo(request, response, next) {
    const { user } = request.local;
    const { id } = request.params;
    const todo = user.todos.find(todo => todo.id === id);

    if (!todo) {
        response.status(404).json({ error: "Todo not found." })
    }

    request.local.todo = todo;

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
        todos: []
    }
    users.push(newUser);

    response.status(201).json(newUser)
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
    const { user } = request.local;

    response.status(200).json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
    const { user } = request.local;
    const { title, deadline } = request.body;

    const newTodo = {
        id: uuidv4(),
        title,
        done: false,
        deadline: new Date(deadline),
        created_at: new Date()
    }
    user.todos.push(newTodo);

    response.status(201).json(newTodo)
});

app.put('/todos/:id', checksExistsUserAccount, checksExistsUserTodo, (request, response) => {
    const { todo } = request.local;
    const { title, deadline } = request.body;

    todo.title = title;
    todo.deadline = new Date(deadline);

    response.status(200).json(todo)
});

app.patch('/todos/:id/done', checksExistsUserAccount, checksExistsUserTodo, (request, response) => {
    const { todo } = request.local;

    todo.done = true;

    response.status(200).json(todo)
});

app.delete('/todos/:id', checksExistsUserAccount, checksExistsUserTodo, (request, response) => {
    const { user, todo } = request.local;

    const todoIndex = user.todos.indexOf(todo);
    user.todos.splice(todoIndex);

    response.status(204).json()
});

module.exports = app;