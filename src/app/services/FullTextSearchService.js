const { Ingest } = require("sonic-channel");
const { Search } = require("sonic-channel");

const sonicChannelIngest = new Ingest({
  host: "localhost",
  port: 1491,
  auth: "SecretPassword",
});

const sonicChannelSearch = new Search({
  host: "localhost",
  port: 1491,
  auth: "SecretPassword",
});

const LoadService = {
  async createIndex(productId, fullText) {
    try {
      sonicChannelIngest.connect();

      // Indexação no Sonic
      await sonicChannelIngest.push(
        "products", //colection - "tabela"
        "default", // bucket - "categorização"
        productId, // o que deve ser retornado nas buscas
        fullText, // texto a ser indexado
        {
          lang: "por",
        }
      );
    } catch (error) {
      console.error(error);
    }
  },
  async updateIndex(productId, fullText) {
    try {
      sonicChannelIngest.connect();

      // Limpa Indexação Anterior no Sonic
      await sonicChannelIngest.flusho("products", "default", productId);

      // Nova Indexação no Sonic
      await sonicChannelIngest.push(
        "products", //colection - "tabela"
        "default", // bucket - "categorização"
        productId, // o que deve ser retornado nas buscas
        fullText, // texto a ser indexado
        {
          lang: "por",
        }
      );
    } catch (error) {
      console.error(error);
    }
  },
  async deleteIndex(productId) {
    try {
      sonicChannelIngest.connect();

      // Limpa todos os índices da collection "products"
      //await sonicChannelIngest.flushc("products");

      // Limpa todos os índices da "default" da collection "products"
      //await sonicChannelIngest.flushb("products", "default");

      // Limpa todos os índices da "default" da collection "products" com Id tal
      await sonicChannelIngest.flusho("products", "default", productId);
    } catch (error) {
      console.error(error);
    }
  },
  async search({ filter }) {
    try {
      sonicChannelSearch.connect();

      let results = await sonicChannelSearch.query(
        "products",
        "default",
        filter,
        {
          lang: "por",
        }
      );

      results = results.map(Number);

      return results;
    } catch (error) {
      console.error(error);
    }
  },
};

module.exports = LoadService;
