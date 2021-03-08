const { Pool } = require("pg");

module.exports = new Pool({
  user: "brunoweber",
  password: "jz3ujj8f",
  host: "localhost",
  port: 5432,
  database: "launchstoredb",
});
