const express = require("express");
const booksRouter = require("./routes/books.routes");

const app = express();
app.use(express.json());
app.use("/", booksRouter);

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ message: "Invalid JSON body" });
  }

  return next(err);
});

module.exports = app;
