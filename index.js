
require("dotenv").config()

const express = require("express")
const cors = require("cors")
const path = require("path")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const db = require("./db")

const PORT = 3001
const JWT_SECRET = process.env.JWT_SECRET || "godoy-dev-secret-troque-no-env"
const SALT_ROUNDS = 10
const LIMITE_POR_PAGINA = 10

if (!process.env.JWT_SECRET) {
    console.warn("Aviso: JWT_SECRET não definido no .env. Usando segredo de desenvolvimento.")
}

const app = express()
app.use(cors())
app.use(express.json())

// Arquivos estáticos: http://localhost:3000/img/oleo.jpg
app.use("/img", express.static(path.join(__dirname, "img")))
// Site: http://localhost:3000/  (index.html, login.html, carrinho.html, ...)
app.use(express.static(path.join(__dirname, "site")))

function erro_validacao(msg, status = 400) {
    const erro = new Error(msg)
    erro.status = status
    return erro
}

function texto(valor) {
    return typeof valor === "string" ? valor.trim() : ""
}

function validar_cliente(dados) {
    const cliente = {
        nome: texto(dados.nome),
        cpf: texto(dados.cpf),
        celular: texto(dados.celular),
        email: texto(dados.email).toLowerCase(),
        senha: typeof dados.senha === "string" ? dados.senha : ""
    }

    if (!cliente.nome || !cliente.cpf || !cliente.celular || !cliente.email || !cliente.senha) {
        throw erro_validacao("Preencha nome, cpf, celular, email e senha")
    }
    if (cliente.senha.length < 6) {
        throw erro_validacao("A senha deve ter pelo menos 6 caracteres")
    }
    return cliente
}

function tratar_erro_bd(error, res) {
    if (error.code === "ER_DUP_ENTRY") {
        const campo = error.sqlMessage && error.sqlMessage.includes("cpf") ? "CPF" : "E-mail"
        return res.status(409).json({ msg: `${campo} já cadastrado` })
    }
    return res.status(500).json({ erro: error.message })
}

function autenticar(req, res, next) {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]

    if (!token) {
        return res.status(401).json({ erro: "Token não enviado. Use: Authorization: Bearer <token>" })
    }

    jwt.verify(token, JWT_SECRET, (err, usuario) => {
        if (err) return res.status(403).json({ erro: "Token inválido ou expirado" })
        req.usuario = usuario
        next()
    })
}
// POST /cliente - cadastrar cliente
app.post("/cliente", async (req, res) => {
    try {
        const cliente = validar_cliente(req.body)
        const senhaCript = await bcrypt.hash(cliente.senha, SALT_ROUNDS)

        const [resultado] = await db.pool.query(
            `INSERT INTO cliente (nome, cpf, celular, email, senha)
             VALUES (?, ?, ?, ?, ?)`,
            [cliente.nome, cliente.cpf, cliente.celular, cliente.email, senhaCript]
        )

        res.status(201).json({
            msg: "Cliente cadastrado, ID = " + resultado.insertId,
            id: resultado.insertId
        })
    } catch (error) {
        if (error.status) return res.status(error.status).json({ msg: error.message })
        tratar_erro_bd(error, res)
    }
})

// POST /login - autenticar cliente
app.post("/login", async (req, res) => {
    try {
        const email = texto(req.body.email).toLowerCase()
        const senha = typeof req.body.senha === "string" ? req.body.senha : ""

        if (!email || !senha) {
            throw erro_validacao("Informe e-mail e senha")
        }

        const [rows] = await db.pool.query(
            "SELECT id, nome, email, senha FROM cliente WHERE email = ?",
            [email]
        )
        const cliente = rows[0]

        if (!cliente) {
            return res.status(401).json({ msg: "E-mail não cadastrado!" })
        }

        const senha_valida = await bcrypt.compare(senha, cliente.senha)
        if (!senha_valida) {
            return res.status(401).json({ msg: "Credenciais inválidas!" })
        }

        const token = jwt.sign(
            { id: cliente.id, email: cliente.email },
            JWT_SECRET,
            { expiresIn: "2h" }
        )

        res.status(200).json({ id: cliente.id, nome: cliente.nome, token })
    } catch (error) {
        if (error.status) return res.status(error.status).json({ msg: error.message })
        res.status(500).json({ erro: error.message })
    }
})

// GET /cliente - listar clientes (sem expor a senha)
app.get("/cliente", async (req, res) => {
    try {
        const [rows] = await db.pool.query(
            "SELECT id, nome, cpf, celular, email FROM cliente ORDER BY id"
        )
        res.status(200).json(rows)
    } catch (error) {
        res.status(500).json({ erro: error.message })
    }
})

// GET /cliente/perfil - perfil do cliente logado
app.get("/cliente/perfil", autenticar, async (req, res) => {
    try {
        const [rows] = await db.pool.query(
            "SELECT id, nome, cpf, celular, email FROM cliente WHERE id = ?",
            [req.usuario.id]
        )

        if (rows.length === 0) {
            return res.status(404).json({ msg: "Cliente não encontrado" })
        }
        res.status(200).json(rows[0])
    } catch (error) {
        res.status(500).json({ erro: error.message })
    }
})

// PUT /cliente/:id - alterar o próprio cadastro
app.put("/cliente/:id", autenticar, async (req, res) => {
    try {
        const id = Number(req.params.id)
        if (id !== req.usuario.id) {
            throw erro_validacao("Você só pode alterar o próprio cadastro", 403)
        }

        const cliente = validar_cliente(req.body)
        const senhaCript = await bcrypt.hash(cliente.senha, SALT_ROUNDS)

        const [resultado] = await db.pool.query(
            `UPDATE cliente SET nome = ?, cpf = ?, celular = ?, email = ?, senha = ?
             WHERE id = ?`,
            [cliente.nome, cliente.cpf, cliente.celular, cliente.email, senhaCript, id]
        )

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ msg: "Cliente não encontrado" })
        }
        res.status(200).json({ msg: "Cliente alterado com sucesso" })
    } catch (error) {
        if (error.status) return res.status(error.status).json({ msg: error.message })
        tratar_erro_bd(error, res)
    }
})

// DELETE /cliente/:id - excluir o próprio cadastro
app.delete("/cliente/:id", autenticar, async (req, res) => {
    try {
        const id = Number(req.params.id)
        if (id !== req.usuario.id) {
            throw erro_validacao("Você só pode excluir o próprio cadastro", 403)
        }

        const [resultado] = await db.pool.query("DELETE FROM cliente WHERE id = ?", [id])
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ msg: "Cliente não encontrado" })
        }
        res.status(200).json({ msg: "Cliente excluído com sucesso" })
    } catch (error) {
        if (error.status) return res.status(error.status).json({ msg: error.message })
        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({ msg: "Não é possível excluir: existem compras vinculadas" })
        }
        res.status(500).json({ erro: error.message })
    }
})

// =============================================================
// AV2 - CONSULTA DE PRODUTOS COM FILTRO
// GET /produto?busca=&categoria=&preco_min=&preco_max=&ordenacao=&pagina=
// =============================================================
app.get("/produto", async (req, res) => {
    try {
        const { busca, categoria, preco_min, preco_max, ordenacao, pagina } = req.query

        let sql = `SELECT id, nome, descricao, categoria, preco, caminho_img, quantidade
                   FROM produto WHERE 1 = 1`
        const params = []

        if (texto(busca)) {
            sql += " AND (nome LIKE ? OR descricao LIKE ?)"
            const termo = `%${texto(busca)}%`
            params.push(termo, termo)
        }

        if (texto(categoria)) {
            sql += " AND categoria = ?"
            params.push(texto(categoria))
        }

        for (const [campo, operador, valor] of [
            ["preco_min", ">=", preco_min],
            ["preco_max", "<=", preco_max]
        ]) {
            if (texto(valor) !== "") {
                const numero = Number(valor)
                if (isNaN(numero) || numero < 0) {
                    throw erro_validacao(`${campo} deve ser um número válido`)
                }
                sql += ` AND preco ${operador} ?`
                params.push(numero)
            }
        }

        const ordem = texto(ordenacao).toLowerCase()
        if (["desc", "maior preco", "maior_preco"].includes(ordem)) {
            sql += " ORDER BY preco DESC, id ASC"
        } else if (["asc", "menor preco", "menor_preco"].includes(ordem)) {
            sql += " ORDER BY preco ASC, id ASC"
        } else {
            sql += " ORDER BY id ASC"
        }

        let paginaAtual = parseInt(pagina, 10)
        if (isNaN(paginaAtual) || paginaAtual < 1) paginaAtual = 1
        params.push(LIMITE_POR_PAGINA, (paginaAtual - 1) * LIMITE_POR_PAGINA)
        sql += " LIMIT ? OFFSET ?"

        const [rows] = await db.pool.query(sql, params)
        res.status(200).json(rows)
    } catch (error) {
        if (error.status) return res.status(error.status).json({ msg: error.message })
        res.status(500).json({ erro: error.message })
    }
})

// GET /produto/:id - detalhes de um produto
app.get("/produto/:id", async (req, res) => {
    try {
        const [rows] = await db.pool.query("SELECT * FROM produto WHERE id = ?", [req.params.id])
        if (rows.length === 0) {
            return res.status(404).json({ msg: "Produto não encontrado" })
        }
        res.status(200).json(rows[0])
    } catch (error) {
        res.status(500).json({ erro: error.message })
    }
})

// POST /compra - cadastrar compra no banco (transação)
app.post("/compra", autenticar, async (req, res) => {
    let connection
    try {
        const { produtos, endereco, idEndereco, forma_pagamento } = req.body

        if (!Array.isArray(produtos) || produtos.length === 0) {
            throw erro_validacao("Informe ao menos um produto na compra")
        }
        if (!texto(forma_pagamento)) {
            throw erro_validacao("Informe a forma de pagamento")
        }

        const itens = produtos.map(item => ({
            id: Number(item.id),
            quantidade: Number(item.quantidade)
        }))

        if (itens.some(item => !Number.isInteger(item.id) || item.id < 1)) {
            throw erro_validacao("ID de produto inválido")
        }
        if (itens.some(item => !Number.isInteger(item.quantidade) || item.quantidade < 1)) {
            throw erro_validacao("Quantidade inválida para um dos produtos")
        }
        if (new Set(itens.map(item => item.id)).size !== itens.length) {
            throw erro_validacao("Não é possível repetir produtos na mesma compra")
        }

        connection = await db.pool.getConnection()
        await connection.beginTransaction()

        // Endereço: informa um já cadastrado (do próprio cliente) ou os dados de um novo.
        let id_endereco = null
        if (idEndereco) {
            id_endereco = Number(idEndereco)
            const [rows] = await connection.query(
                "SELECT id FROM endereco WHERE id = ? AND idCliente = ?",
                [id_endereco, req.usuario.id]
            )
            if (rows.length === 0) {
                throw erro_validacao("Endereço não encontrado para este cliente", 404)
            }
        } else if (endereco) {
            const campos = ["numero", "rua", "bairro", "cidade", "estado"]
            if (campos.some(campo => texto(endereco[campo]) === "")) {
                throw erro_validacao("Dados de endereço incompletos")
            }
            const [resultado] = await connection.query(
                `INSERT INTO endereco (idCliente, numero, rua, bairro, cidade, estado)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    req.usuario.id,
                    endereco.numero,
                    texto(endereco.rua),
                    texto(endereco.bairro),
                    texto(endereco.cidade),
                    texto(endereco.estado)
                ]
            )
            id_endereco = resultado.insertId
        } else {
            throw erro_validacao("Informe idEndereco ou os dados de endereco")
        }

        // Busca os produtos e valida estoque antes de gravar a compra.
        const [produtos_bd] = await connection.query(
            "SELECT id, preco, quantidade FROM produto WHERE id IN (?)",
            [itens.map(item => item.id)]
        )
        if (produtos_bd.length !== itens.length) {
            throw erro_validacao("Um dos produtos da compra não foi encontrado", 404)
        }

        const mapa_produtos = new Map(produtos_bd.map(produto => [produto.id, produto]))
        let valor_total = 0

        for (const item of itens) {
            const produto = mapa_produtos.get(item.id)
            if (produto.quantidade < item.quantidade) {
                throw erro_validacao(`Estoque insuficiente para o produto ${item.id}`)
            }
            valor_total += Number(produto.preco) * item.quantidade
        }
        valor_total = Number(valor_total.toFixed(2))

        const data = new Date().toLocaleDateString("sv-SE") // YYYY-MM-DD (hora local)
        const [resultado_compra] = await connection.query(
            `INSERT INTO compra (idCliente, idEndereco, data, forma_pagamento, valor_total)
             VALUES (?, ?, ?, ?, ?)`,
            [req.usuario.id, id_endereco, data, texto(forma_pagamento), valor_total]
        )
        const id_compra = resultado_compra.insertId

        for (const item of itens) {
            const produto = mapa_produtos.get(item.id)

            await connection.query(
                `INSERT INTO produtocompra (idproduto, idcompra, quantidade, valor_unitario)
                 VALUES (?, ?, ?, ?)`,
                [produto.id, id_compra, item.quantidade, produto.preco]
            )

            const [atualizacao] = await connection.query(
                `UPDATE produto SET quantidade = quantidade - ?
                 WHERE id = ? AND quantidade >= ?`,
                [item.quantidade, produto.id, item.quantidade]
            )
            if (atualizacao.affectedRows === 0) {
                throw erro_validacao(`Estoque insuficiente para o produto ${produto.id}`)
            }
        }

        await connection.commit()

        res.status(201).json({
            msg: "Compra cadastrada, ID = " + id_compra,
            id: id_compra,
            valor_total
        })
    } catch (error) {
        if (connection) {
            try { await connection.rollback() } catch (rollbackError) { /* ignora */ }
        }
        if (error.status) return res.status(error.status).json({ msg: error.message })
        res.status(500).json({ erro: error.message })
    } finally {
        if (connection) connection.release()
    }
})

// GET /compra - compras realizadas pelo usuário logado
app.get("/compra", autenticar, async (req, res) => {
    try {
        const [rows] = await db.pool.query(
            `SELECT c.id AS idcompra, DATE_FORMAT(c.data, '%Y-%m-%d') AS data,
                    c.forma_pagamento, c.valor_total,
                    e.rua, e.numero, e.bairro, e.cidade, e.estado,
                    p.id AS idproduto, p.nome AS produto, p.caminho_img,
                    pc.quantidade, pc.valor_unitario
             FROM compra c
             INNER JOIN endereco e ON c.idEndereco = e.id
             INNER JOIN produtocompra pc ON c.id = pc.idcompra
             INNER JOIN produto p ON pc.idproduto = p.id
             WHERE c.idCliente = ?
             ORDER BY c.id DESC, p.id ASC`,
            [req.usuario.id]
        )
        res.status(200).json(rows)
    } catch (error) {
        res.status(500).json({ erro: error.message })
    }
})

// Health check
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", porta: PORT })
})

app.listen(PORT, () => {
    console.log(`API + site + imagens rodando em http://localhost:${PORT}`)
})
