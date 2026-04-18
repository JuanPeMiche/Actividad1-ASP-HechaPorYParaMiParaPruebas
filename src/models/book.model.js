const BOOK_METADATA_SK = "METADATA";

function buildBookPk(isbn) {
  return `BOOK#${isbn}`;
}

function buildBookKey(isbn) {
  return {
    PK: buildBookPk(isbn),
    SK: BOOK_METADATA_SK,
  };
}

function buildBookItem({ isbn, title, author }) {
  return {
    ...buildBookKey(isbn),
    entityType: "BOOK",
    isbn,
    title,
    author,
    createdAt: new Date().toISOString(),
  };
}

function toBookResponse(item) {
  return {
    isbn: item.isbn,
    title: item.title,
    author: item.author,
    createdAt: item.createdAt,
  };
}

module.exports = {
  BOOK_METADATA_SK,
  buildBookPk,
  buildBookKey,
  buildBookItem,
  toBookResponse,
};
