const Base = require("./Base");
Base.init({ table: "files" });

module.exports = {
  ...Base,
};

/*
module.exports = {
  create({ filename, path, product_id }) {
    const query = `

    INSERT INTO files (
      product_id,
      name,
      path
    ) 
    VALUES ($1, $2, $3)

    RETURNING id

    `;

    const values = [product_id, filename, path];

    return db.query(query, values);
  },
  async delete(id) {
    try {
      const result = await db.query(`SELECT * FROM files WHERE id = $1`, [id]);
      const file = result.rows[0];

      fs.unlinkSync(file.path);

      return db.query(`DELETE FROM files WHERE id=$1`, [id]);
    } catch (err) {
      console.error(err);
    }
  },
};
*/
