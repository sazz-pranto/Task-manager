const express = require('express');

require('./db/mongoose');
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

const app = express();
const port = process.env.PORT;

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