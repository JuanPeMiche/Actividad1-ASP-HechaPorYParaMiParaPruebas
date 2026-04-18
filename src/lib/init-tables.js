const { CreateTableCommand, DescribeTableCommand } = require("@aws-sdk/client-dynamodb");
const { autoInitTables, tableName } = require("../config/aws-config");
const { dynamoClient } = require("./dynamodb-client");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureTableExists() {
  try {
    await dynamoClient.send(
      new DescribeTableCommand({
        TableName: tableName,
      })
    );
    return;
  } catch (error) {
    if (error.name !== "ResourceNotFoundException") {
      throw error;
    }
  }

  try {
    await dynamoClient.send(
      new CreateTableCommand({
        TableName: tableName,
        AttributeDefinitions: [
          { AttributeName: "PK", AttributeType: "S" },
          { AttributeName: "SK", AttributeType: "S" },
        ],
        KeySchema: [
          { AttributeName: "PK", KeyType: "HASH" },
          { AttributeName: "SK", KeyType: "RANGE" },
        ],
        BillingMode: "PAY_PER_REQUEST",
      })
    );
  } catch (error) {
    if (error.name !== "ResourceInUseException") {
      throw error;
    }
  }
}

async function waitUntilTableIsActive(maxAttempts = 20, delayMs = 500) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const result = await dynamoClient.send(
        new DescribeTableCommand({
          TableName: tableName,
        })
      );

      if (result.Table && result.Table.TableStatus === "ACTIVE") {
        return;
      }
    } catch (error) {
      if (error.name !== "ResourceNotFoundException") {
        throw error;
      }
    }

    await sleep(delayMs);
  }

  throw new Error(`DynamoDB table '${tableName}' is not ACTIVE`);
}

async function maybeInitTables() {
  if (!autoInitTables) {
    return;
  }

  await ensureTableExists();
  await waitUntilTableIsActive();
  console.log(`DynamoDB table '${tableName}' ready`);
}

module.exports = {
  maybeInitTables,
};
