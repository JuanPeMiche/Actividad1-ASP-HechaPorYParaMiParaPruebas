const REVIEW_SK_PREFIX = "REVIEW#";

function buildReviewItem({ isbn, reviewId, reader, score, comment }) {
  return {
    PK: `BOOK#${isbn}`,
    SK: `${REVIEW_SK_PREFIX}${reviewId}`,
    entityType: "REVIEW",
    reviewId,
    isbn,
    reader,
    score,
    comment,
    createdAt: new Date().toISOString(),
  };
}

function toReviewResponse(item) {
  return {
    reviewId: item.reviewId,
    reader: item.reader,
    score: item.score,
    comment: item.comment,
    createdAt: item.createdAt,
  };
}

module.exports = {
  REVIEW_SK_PREFIX,
  buildReviewItem,
  toReviewResponse,
};
