const express = require('express');

require('./db/mongoose');
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

const app = express();
const port = process.env.PORT || 3000;

// middleware for maintenance mode
// app.use((req, res, next) => {
//   res.status(503).send('Maintenance going on, please try again after some time!');
// })

app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})

// const Task = require('./models/task');
// const User = require('./models/user');

// const test = async function() {
//   // const task = await Task.findById('60ddb6956f9a6013205873ca');
//   // await task.populate('owner').execPopulate();
//   // console.log(task.owner);

//   const user = await User.findById('60ddb63e6f9a6013205873c7');
//   await user.populate('tasks').execPopulate();
//   console.log(user.tasks);
// }

// test();