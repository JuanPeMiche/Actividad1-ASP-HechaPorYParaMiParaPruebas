const dotenv = require("dotenv");

dotenv.config();

const app = require("./app");
const { maybeInitTables } = require("./lib/init-tables");

const port = Number(process.env.PORT) || 3000;

async function bootstrap() {
  await maybeInitTables();

  app.listen(port, () => {
    console.log(`Books API listening on port ${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Error starting app", error);
  process.exit(1);
});
