const express = require('express');

const Task = require('../models/task');
const auth = require('../middlewares/auth');  // authenticates user

const router = express.Router();

//creating a task
router.post('/tasks', auth, async (req, res) => {
  const task = new Task({
    ...req.body,  // getting all the properties for a task passed in the body
    owner: req.user._id  // getting user's id from user object attached to req object in auth middleware
  });
  try {
    await task.save()
    res.status(201).send(task);
  } catch(error) {
    res.status(400).send(error);
  }
})

// read all tasks
// GET /tasks/
// read completed or incompleted tasks
// GET /tasks?completed=true/false
// paginating with limitation
// GET /tasks?limit=2&skip=2
// sorting in ascending or descending order
// GET /tasks?sortBy=createdAt:desc/asc
router.get('/tasks', auth, async (req, res) => {
  /* match keeps the query string with three possible values
    match = { completed: true } to filter out all completed tasks
    match = { completed: false } to filter out all incomplete tasks
    match = {} no filter to get all the tasks  */ 
    const match = {};

    /* sort keeps the query string for sorting the results in ascending or descending order of creation time
    also, keeps sorting parameter to sort completed tasks first or last */
    const sort = {};
    
    // check if completed query exists in the url
    if(req.query.completed) {
      match.completed = req.query.completed === 'true';
      /* in query string, true or false will come as a string not boolean so to make sure 
        completed gets a boolean value, req.query.completed is being checked with === operator
        so that only boolean true or false gets returned and assigned to match.completed */
    }

    // if sort query exists in the url
    if(req.query.sortBy) {
      const parts = req.query.sortBy.split(':'); // sorting parameters are seperated with ':' like, sortBy=createdAt:desc
       // options object should get sorting parameters in numbers, so for descending its -1 and ascending is 1
      sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    }
  
  try {
    await req.user.populate({
      path: 'tasks',
      match: match,
      options: {
        // limiting how many task should show as search result
        limit: parseInt(req.query.limit),
        // skipping specific number of tasks and show the next ones
        skip: parseInt(req.query.skip),
        // sorting
        sort: sort
      }
    }).execPopulate();
    res.send(req.user.tasks);
  } catch(error) {
    res.status(500).send(error);
  }
})

// read one task by id
router.get('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id;  
  try {
    const task = await Task.findOne({ _id: _id, owner: req.user._id }); // user object is linked to req object in auth middleware
    if(!task) {
      return res.status(404).send('Task not found!')
    }
    res.send(task);
  } catch(error) {
    res.status(500).send(error);
  }
})

// update a task by id
router.patch('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id;

  // check if requested updates are allowed
  const requestedUpdates = Object.keys(req.body); // returns the properties of the user object as an array
  const allowedUpdates = ['completed', 'description'];
  const isValidUpdateRequest = requestedUpdates.every((requestedUpdate) => {
    return allowedUpdates.includes(requestedUpdate);
  });

  if(!isValidUpdateRequest) {
    return res.status(400).send({ error: 'Invalid Updates!'});
  }

  // if requested updates are allowed, proceed with the given task id
  try {
    /* findByIdAndUpdate() bypasses mongoose and performs a direct operation on the database, so to make
    middlewares work on updates as well, different approach is taken to update data 
    so update operation has been done in a traditional mongoose way */
    // const task = await Task.findByIdAndUpdate(_id, req.body, { new: true, runValidators: true});
    /* in options object, new: true will return the task with the updates applied
    new: false is set by default and it returns the task before update took place
    runValidators: true will run validation checks like it does while creation
    */
    
    const task = await Task.findOne({ _id: _id, owner: req.user._id }); // user object is linked to req object in auth middleware
    if(!task) {
      return res.status(404).send('Task not found!')
    }

    // iterate through the updates that the user wants to make and assign the new value to task object
    requestedUpdates.forEach((requestedUpdate) => {
      task[requestedUpdate] = req.body[requestedUpdate];
    })

    await task.save();
    res.send(task);
  } catch(error) {
    res.status(500).send(error);
  }
})

// delete a task by id
router.delete('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id;
  try {
    const task = await Task.findOneAndDelete({ _id: _id, owner: req.user._id }); // user object is linked to req object in auth middleware
    if(!task) {
      return res.status(404).send('Task not found!')
    }
    res.send(task);
  } catch(error) {
    res.status(500).send(error);
  }
})

module.exports = router;