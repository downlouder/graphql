const url = 'https://graphqlzero.almansi.me/api';

const addForm = document.forms.addTask;
const searchForm = document.forms.findTask;
const toDos = document.getElementById('todos');

addForm.addEventListener('submit', addTaskHandler);
searchForm.addEventListener('submit', findToDos)

const makeRequest = (query) => {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-type": 'application/json',
    },
    body: JSON.stringify({ query })
  }).then(res => res.json())
}

function printToDo({ title, completed = false, id = '', user = {} }) {
  const li = document.createElement('li');
  li.className = 'list-group-item';
  li.innerHTML = `&nbsp; ${title} | ID: ${id} | by <b>${user.name}</b>`;
  li.setAttribute('data-id', id);

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  if (completed) checkbox.setAttribute('checked', 'true');
  checkbox.addEventListener('change', handleTodoStatus);
  li.prepend(checkbox);

  const del = document.createElement('button');
  del.className = 'btn btn-link mb-1';
  del.innerHTML = '&times;';
  del.addEventListener('click', handleDeleteTodo);
  li.append(del);

  toDos.prepend(li);
}

makeRequest(`query Todos{
  todos{
    data {
      id
      title
      completed
      user {
        name
      }
    }
  }
}`).then(({data}) => data.todos.data.forEach(todo => printToDo(todo)))

async function addTaskHandler(e) {
  e.preventDefault();
  if (addForm.taskName.value) {
    const newTaskQuery = `mutation CreateTodo {
      createTodo(input: {title: "${addForm.taskName.value}", completed: false}) {
        title
        completed
        id
      }
    }`;

    const data = await makeRequest(newTaskQuery);
    printToDo(data.data.createTodo);
    addForm.reset();
  }
}

async function findToDos(e) {
  e.preventDefault();
  const searchText = searchForm.searchName.value;

  if (searchText) {
    const searchQuery = `query searchQuery {
      todos(options:{search:{q: "${searchText}"}, sort:{field: "id", order: ASC}}){
        data {
          id
          title
          completed
          user { name }
        }
      }
    }`;
    const {data} = await makeRequest(searchQuery);
    toDos.innerHTML = '';
    data.todos.data.forEach(todo => printToDo(todo));
  }
}

async function handleTodoStatus() {
  const todoId = this.parentElement.dataset.id;

  const changeStatusQuery = `mutation ChangeStatus {
    updateTodo(id: "${todoId}", input: {completed: ${this.checked}}) {
      completed
    }
  }`;

  const data = await makeRequest(changeStatusQuery);
  if (data.data.updateTodo.completed) {
    this.setAttribute('checked', 'true');
  } else {
    this.removeAttribute('checked');
  }
}

async function handleDeleteTodo() {
  const todoId = this.parentElement.dataset.id;
  const deleteQuery = `mutation DeleteTodo {
    deleteTodo(id: "${todoId}")
  }`;

  const data = await makeRequest(deleteQuery);

  if (data.data.deleteTodo) {
    this.parentElement.remove();
  }
}