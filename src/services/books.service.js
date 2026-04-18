const { GetCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { tableName } = require("../config/aws-config");
const { docClient } = require("../lib/dynamodb-client");
const {
  buildBookItem,
  buildBookKey,
  toBookResponse,
} = require("../models/book.model");

async function createBook({ isbn, title, author }) {
  const item = buildBookItem({ isbn, title, author });

  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
      ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
    })
  );

  return toBookResponse(item);
}

async function getBookByIsbn(isbn) {
  const result = await docClient.send(
    new GetCommand({
      TableName: tableName,
      Key: buildBookKey(isbn),
    })
  );

  if (!result.Item) {
    return null;
  }

  return toBookResponse(result.Item);
}

module.exports = {
  createBook,
  getBookByIsbn,
};
