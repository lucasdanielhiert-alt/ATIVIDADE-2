const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());

// Permite servir o HTML
app.use(express.static(__dirname));

// =========================
// BANCO SQLITE
// =========================

const db = new Database('cinestream.db');

db.exec(`
CREATE TABLE IF NOT EXISTS filmes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT,
  genero TEXT,
  ano_lancamento INTEGER
);

CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT,
  email TEXT,
  plano TEXT
);

CREATE TABLE IF NOT EXISTS favoritos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_usuario INTEGER,
  id_filme INTEGER
);
`);

// =========================
// DADOS INICIAIS
// =========================

const countFilmes = db.prepare('SELECT COUNT(*) AS count FROM filmes').get().count;

if (countFilmes === 0) {
  const inserir = db.prepare(`
    INSERT INTO filmes (titulo, genero, ano_lancamento)
    VALUES (?, ?, ?)
  `);

  inserir.run('Matrix', 'Ficção', 1999);
  inserir.run('Toy Story', 'Animação', 1995);
  inserir.run('O Poderoso Chefão', 'Drama', 1972);
}

const countUsuarios = db.prepare('SELECT COUNT(*) AS count FROM usuarios').get().count;

if (countUsuarios === 0) {
  const inserir = db.prepare(`
    INSERT INTO usuarios (nome, email, plano)
    VALUES (?, ?, ?)
  `);

  inserir.run('João', 'joao@email.com', 'Premium');
  inserir.run('Maria', 'maria@email.com', 'Básico');
}

// =========================
// HTML
// =========================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// =========================
// FILMES
// =========================

app.get('/filmes', (req, res) => {
  const filmes = db.prepare('SELECT * FROM filmes').all();
  res.json(filmes);
});

app.post('/filmes', (req, res) => {
  const { titulo, genero, ano_lancamento } = req.body;

  const stmt = db.prepare(`
    INSERT INTO filmes (titulo, genero, ano_lancamento)
    VALUES (?, ?, ?)
  `);

  const info = stmt.run(titulo, genero, ano_lancamento);

  const novo = db.prepare(`
    SELECT * FROM filmes WHERE id = ?
  `).get(info.lastInsertRowid);

  res.json(novo);
});

app.put('/filmes/:id', (req, res) => {
  const id = req.params.id;

  const { titulo, genero, ano_lancamento } = req.body;

  db.prepare(`
    UPDATE filmes
    SET titulo = ?, genero = ?, ano_lancamento = ?
    WHERE id = ?
  `).run(titulo, genero, ano_lancamento, id);

  res.json({ mensagem: 'Filme atualizado' });
});

app.delete('/filmes/:id', (req, res) => {
  const id = req.params.id;

  db.prepare('DELETE FROM favoritos WHERE id_filme = ?').run(id);
  db.prepare('DELETE FROM filmes WHERE id = ?').run(id);

  res.json({ mensagem: 'Filme removido' });
});

// =========================
// USUÁRIOS
// =========================

app.get('/usuarios', (req, res) => {
  const usuarios = db.prepare('SELECT * FROM usuarios').all();
  res.json(usuarios);
});

app.post('/usuarios', (req, res) => {
  const { nome, email, plano } = req.body;

  const stmt = db.prepare(`
    INSERT INTO usuarios (nome, email, plano)
    VALUES (?, ?, ?)
  `);

  const info = stmt.run(nome, email, plano);

  const novo = db.prepare(`
    SELECT * FROM usuarios WHERE id = ?
  `).get(info.lastInsertRowid);

  res.json(novo);
});

app.put('/usuarios/:id', (req, res) => {
  const id = req.params.id;

  const { nome, email, plano } = req.body;

  db.prepare(`
    UPDATE usuarios
    SET nome = ?, email = ?, plano = ?
    WHERE id = ?
  `).run(nome, email, plano, id);

  res.json({ mensagem: 'Usuário atualizado' });
});

// =========================
// FAVORITOS
// =========================

app.get('/favoritos', (req, res) => {

  const favoritos = db.prepare(`
    SELECT
      f.id,
      u.nome AS usuario,
      fl.titulo AS filme
    FROM favoritos f
    JOIN usuarios u ON f.id_usuario = u.id
    JOIN filmes fl ON f.id_filme = fl.id
  `).all();

  res.json(favoritos);
});

app.post('/favoritos', (req, res) => {

  const { id_usuario, id_filme } = req.body;

  const stmt = db.prepare(`
    INSERT INTO favoritos (id_usuario, id_filme)
    VALUES (?, ?)
  `);

  stmt.run(id_usuario, id_filme);

  res.json({ mensagem: 'Favorito adicionado' });
});

app.delete('/favoritos/:id', (req, res) => {

  db.prepare(`
    DELETE FROM favoritos
    WHERE id = ?
  `).run(req.params.id);

  res.json({ mensagem: 'Favorito removido' });
});

// =========================
// SERVIDOR
// =========================

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});