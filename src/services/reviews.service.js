const { PutCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");
const { tableName } = require("../config/aws-config");
const { docClient } = require("../lib/dynamodb-client");
const { buildBookPk } = require("../models/book.model");
const {
  REVIEW_SK_PREFIX,
  buildReviewItem,
  toReviewResponse,
} = require("../models/review.model");

async function createReviewForBook({ isbn, reader, score, comment }) {
  const reviewId = uuidv4();
  const item = buildReviewItem({
    isbn,
    reviewId,
    reader,
    score,
    comment,
  });

  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
    })
  );

  return toReviewResponse(item);
}

async function listReviewsByBook(isbn) {
  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :reviewPrefix)",
      ExpressionAttributeValues: {
        ":pk": buildBookPk(isbn),
        ":reviewPrefix": REVIEW_SK_PREFIX,
      },
    })
  );

  return (result.Items || []).map(toReviewResponse);
}

module.exports = {
  createReviewForBook,
  listReviewsByBook,
};
