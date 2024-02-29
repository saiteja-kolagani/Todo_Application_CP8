const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
const dbPath = path.join(__dirname, 'todoApplication.db')
app.use(express.json())
let db = null

//Initializing Database And Server
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Is Running')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
  }
}

initializeDBAndServer()

//API 1
app.get('/todos/', async (request, response) => {
  const {priority, status, search_q = ''} = request.query
  let getDataQuery = ``
  let data = null

  //Priority And Status Function
  const hasPriorityAndStatus = (priority, status) => {
    return priority !== undefined && status !== undefined
  }

  //has Priority Function
  const hasPriority = priority => {
    return priority !== undefined
  }

  //has Status Function
  const hasStatus = status => {
    return status !== undefined
  }

  try {
    switch (true) {
      case hasPriorityAndStatus(priority, status):
        getDataQuery = `
            SELECT 
            *
            FROM 
            todo
            WHERE 
            todo LIKE '%' || ? || '%'
            AND priority = ?
            AND status = ?;
        `
        data = await db.all(getDataQuery, [search_q, priority, status])
        break
      case hasPriority(priority):
        getDataQuery = `
            SELECT 
            *
            FROM 
            todo
            WHERE 
            todo LIKE '%' || ? || '%'
            AND priority = ?;
        `
        data = await db.all(getDataQuery, [search_q, priority])
        break
      case hasStatus(status):
        getDataQuery = `
            SELECT 
            *
            FROM 
            todo
            WHERE 
            todo LIKE '%' || ? || '%'
            AND status = ?;
        `
        data = await db.all(getDataQuery, [search_q, status])
        break
      default:
        getDataQuery = `
            SELECT 
            * 
            FROM 
            todo 
            WHERE 
            todo LIKE '%' || ? || '%';
        `
        data = await db.all(getDataQuery, [search_q])
    }
    response.send(data)
  } catch (e) {
    console.log(e.message)
    response.status(500).send('Internal Server Error')
  }
})

/*app.get('/todos/', async (request, response) => {
  try {
    const {search_q = '', priority, status} = request.query

    let getTodosQuery = `
            SELECT
                *
            FROM
                todo 
            WHERE
                todo LIKE ?
        `
    const queryParams = [`%${search_q}%`]

    switch (true) {
      case priority !== undefined && status !== undefined:
        getTodosQuery += ` AND status = ? AND priority = ?`
        queryParams.push(status, priority)
        break
      case priority !== undefined:
        getTodosQuery += ` AND priority = ?`
        queryParams.push(priority)
        break
      case status !== undefined:
        getTodosQuery += ` AND status = ?`
        queryParams.push(status)
        break
    }

    const data = await db.all(getTodosQuery, queryParams)
    response.send(data)
  } catch (error) {
    console.error('Error fetching todos:', error)
    response.status(500).send('Internal Server Error')
  }
})*/

//API 2 Returns a specific todo based on the todo ID
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  try {
    const getDataQuery = `
      SELECT 
      *
      FROM 
      todo
      WHERE 
      id = ?;
    `
    const dbResponse = await db.get(getDataQuery, [todoId])
    response.send(dbResponse)
  } catch (e) {
    console.log(e.message)
    response.status(500).send('Internal Server Error')
  }
})

//API 3 Create a todo in the todo table
app.post('/todos/', async (request, response) => {
  const bodyDetails = request.body
  const {id, todo, priority, status} = bodyDetails
  try {
    const postTodoQuery = `
      INSERT INTO 
      todo(id, todo, priority, status)
      VALUES(?, ?, ?, ?);
    `
    const dbResponse = await db.run(postTodoQuery, [id, todo, priority, status])
    response.send('Todo Successfully Added')
  } catch (e) {
    console.log(e.message)
    response.status(500).send('Internal Server Error')
  }
})

//API 4 Updates the details of a specific todo based on the todo ID
app.put('/todos/:todoId/', async (request, response) => {
  const bodyDetails = request.body
  const {todoId} = request.params
  const {todo, priority, status} = bodyDetails
  try {
    let updateTodoQuery = `
      UPDATE 
      todo 
      SET 
    `
    if (todo !== undefined) {
      updateTodoQuery += 'todo = ? WHERE id = ?'
      await db.run(updateTodoQuery, [todo, todoId])
      response.send('Todo Updated')
    } else if (priority !== undefined) {
      updateTodoQuery += 'priority = ? WHERE id = ?'
      await db.run(updateTodoQuery, [priority, todoId])
      response.send('Priority Updated')
    } else if (status !== undefined) {
      updateTodoQuery += 'status = ? WHERE id = ?'
      await db.run(updateTodoQuery, [status, todoId])
      response.send('Status Updated')
    }
  } catch (e) {
    console.log(e.message)
    response.status(500).send('Internal Server Error')
  }
})

//API 5 Deletes a todo from the todo table based on the todo ID
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  try {
    const deleteTodoQuery = `
      DELETE FROM 
      todo 
      WHERE 
      id = ?
    `
    await db.run(deleteTodoQuery, [todoId])
    response.send('Todo Deleted')
  } catch (e) {
    console.log(e.message)
    response.status(500).send('Internal Server Error')
  }
})

module.exports = app
