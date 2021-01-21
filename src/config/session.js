const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const db = require("./db");

module.exports = session({
  store: new pgSession({
    pool: db,
  }),
  secret: "iabadabaduuu",
  resave: false,
  saveUninitialized: false,
  cookie: {
    // Para entrar sem precisar logar novamente durante 30dd, eis o cálculo:
    // MaxAge: 30dd X 24hrs X 60min X 60s * 1000 pra retornar milisegundos
    maxAge: 30 * 24 * 60 * 60 * 1000,
  },
});
