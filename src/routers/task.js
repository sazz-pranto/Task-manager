const express = require('express');

const Task = require('../models/task');

const router = express.Router();

//creating a task
router.post('/tasks', async (req, res) => {
  const task = new Task(req.body);
  try {
    await task.save()
    res.status(201).send(task);
  } catch(error) {
    res.status(400).send(error);
  }
})

// read all tasks
router.get('/tasks', async (req, res) => {
  try {
    const tasks = await Task.find({});
    res.send(tasks);
  } catch(error) {
    res.status(500).send(error);
  }
})

// read one task by id
router.get('/tasks/:id', async (req, res) => {
  const _id = req.params.id;
  try {
    const task = await Task.findById(_id);
    if(!task) {
      return res.status(404).send('Task not found!')
    }
    res.send(task);
  } catch(error) {
    res.status(500).send(error);
  }
})

// update a task by id
router.patch('/tasks/:id', async (req, res) => {
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
    so update operation has been done in a traditional mongoose way from line 68 */
    // const task = await Task.findByIdAndUpdate(_id, req.body, { new: true, runValidators: true});
    /* in options object, new: true will return the task with the updates applied
    new: false is set by default and it returns the task before update took place
    runValidators: true will run validation checks like it does while creation
    */
    
    const task = await Task.findById(_id);
    // iterate through the updates that the user wants to make and assign the new value to task object
    requestedUpdates.forEach((requestedUpdate) => {
      task[requestedUpdate] = req.body[requestedUpdate];
    })
    await task.save();

    if(!task) {
      return res.status(404).send('Task not found!')
    }
    res.send(task);
  } catch(error) {
    res.status(500).send(error);
  }
})

// delete a task by id
router.delete('/tasks/:id', async (req, res) => {
  const _id = req.params.id;
  try {
    const task = await Task.findByIdAndDelete(_id);
    if(!task) {
      return res.status(404).send('Task not found!')
    }
    res.send(task);
  } catch(error) {
    res.status(500).send(error);
  }
})

module.exports = router;