function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function toBoolean(value) {
  return String(value).toLowerCase() === "true";
}

const awsRegion = process.env.AWS_REGION || "us-east-1";
const tableName = getRequiredEnv("DYNAMODB_TABLE");
const dynamodbEndpoint = process.env.DYNAMODB_ENDPOINT;
const autoInitTables = toBoolean(process.env.AUTO_INIT_TABLES);

const dynamoClientConfig = {
  region: awsRegion,
};

if (dynamodbEndpoint) {
  dynamoClientConfig.endpoint = dynamodbEndpoint;
  dynamoClientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "local",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "local",
  };
}

module.exports = {
  awsRegion,
  tableName,
  dynamodbEndpoint,
  autoInitTables,
  dynamoClientConfig,
};
