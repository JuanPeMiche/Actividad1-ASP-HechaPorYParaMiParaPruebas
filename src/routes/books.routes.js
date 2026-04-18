const express = require("express");
const { createBook, getBookByIsbn } = require("../services/books.service");
const {
  createReviewForBook,
  listReviewsByBook,
} = require("../services/reviews.service");

const router = express.Router();

router.post("/books", async (req, res) => {
  const { isbn, title, author } = req.body || {};

  if (!isbn || !title || !author) {
    return res.status(400).json({
      message: "isbn, title and author are required",
    });
  }

  try {
    const book = await createBook({ isbn, title, author });
    return res.status(201).json({
      message: "Book created",
      book,
    });
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      return res.status(409).json({ message: "Book already exists" });
    }

    return res.status(500).json({
      message: "Error creating book",
      error: error.message,
    });
  }
});

router.post("/books/:isbn/reviews", async (req, res) => {
  const { isbn } = req.params;
  const { reader, score, comment } = req.body || {};

  if (!reader || score === undefined || !comment) {
    return res.status(400).json({
      message: "reader, score and comment are required",
    });
  }

  const numericScore = Number(score);
  if (!Number.isInteger(numericScore) || numericScore < 1 || numericScore > 10) {
    return res.status(400).json({
      message: "score must be an integer between 1 and 10",
    });
  }

  try {
    const book = await getBookByIsbn(isbn);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const review = await createReviewForBook({
      isbn,
      reader,
      score: numericScore,
      comment,
    });

    return res.status(201).json({
      message: "Review created",
      review,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error creating review",
      error: error.message,
    });
  }
});

router.get("/books/:isbn/reviews", async (req, res) => {
  const { isbn } = req.params;

  try {
    const reviews = await listReviewsByBook(isbn);
    return res.status(200).json({ isbn, reviews });
  } catch (error) {
    return res.status(500).json({
      message: "Error listing reviews",
      error: error.message,
    });
  }
});

module.exports = router;
