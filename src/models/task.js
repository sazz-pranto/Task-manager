const mongoose = require('mongoose');

// creating a Schema for tasks, this schema maps to the Task collection and defines the shape of the documents within that collection.
const taskSchema = new mongoose.Schema({
  description: {
      type: String,
      required: true,
      trim: true
  },
  completed: {
      type: Boolean,
      default: false
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User' // ref is used to keep reference to another model, here User model is kept for using populate method on any task 
  }
}, {
  timestamps: true
})

// model for Tasks
const Task = mongoose.model('Task', taskSchema);

module.exports = Task;