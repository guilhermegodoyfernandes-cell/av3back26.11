// Cria (se necessário) o banco, as tabelas e os dados iniciais.
// Executada automaticamente por: npm start
require("dotenv").config()
const bcrypt = require("bcrypt")
const mysql = require("mysql2/promise")
const { config, pool } = require("./db")

// API, site e imagens sempre na porta 3000.
const BASE_IMG = "http://localhost:3000/img/"

const ESTRUTURA_CLIENTE = `
CREATE TABLE IF NOT EXISTS cliente (
    id INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(50) NOT NULL,
    cpf CHAR(14) NOT NULL,
    celular CHAR(14) NOT NULL,
    email VARCHAR(50) NOT NULL,
    senha VARCHAR(512) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY cpf (cpf),
    UNIQUE KEY email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`

const ESTRUTURA_PRODUTO = `
CREATE TABLE IF NOT EXISTS produto (
    id INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    preco DECIMAL(10,2) NOT NULL,
    caminho_img VARCHAR(255) DEFAULT NULL,
    quantidade INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`

const ESTRUTURA_ENDERECO = `
CREATE TABLE IF NOT EXISTS endereco (
    id INT NOT NULL AUTO_INCREMENT,
    idCliente INT NOT NULL,
    numero INT NOT NULL,
    rua VARCHAR(100) NOT NULL,
    bairro VARCHAR(50) NOT NULL,
    cidade VARCHAR(50) NOT NULL,
    estado VARCHAR(50) NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (idCliente) REFERENCES cliente(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`

const ESTRUTURA_COMPRA = `
CREATE TABLE IF NOT EXISTS compra (
    id INT NOT NULL AUTO_INCREMENT,
    idCliente INT NOT NULL,
    idEndereco INT NOT NULL,
    data DATE NOT NULL,
    forma_pagamento VARCHAR(50) NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (idCliente) REFERENCES cliente(id),
    FOREIGN KEY (idEndereco) REFERENCES endereco(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`

const ESTRUTURA_PRODUTOCOMPRA = `
CREATE TABLE IF NOT EXISTS produtocompra (
    idproduto INT NOT NULL,
    idcompra INT NOT NULL,
    quantidade INT NOT NULL,
    valor_unitario DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (idproduto, idcompra),
    FOREIGN KEY (idproduto) REFERENCES produto(id),
    FOREIGN KEY (idcompra) REFERENCES compra(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`

const clientes = [
    { nome: "Guilherme Godoy", cpf: "111.222.333-44", celular: "(41)98888-1111", email: "guilherme.godoy@email.com", senha: "godoy123" },
    { nome: "Pedro Nathan", cpf: "222.333.444-55", celular: "(42)97777-2222", email: "pedro.nathan@email.com", senha: "nathanneris456" },
    { nome: "Antonio Wesley", cpf: "333.444.555-66", celular: "(43)96666-3333", email: "antonio.wesley@email.com", senha: "wesley123" },
    { nome: "Kayke Ramos", cpf: "444.555.666-77", celular: "(44)95555-4444", email: "kayke.ramos@email.com", senha: "ramos321" },
    { nome: "Ana Livia", cpf: "555.666.777-88", celular: "(45)94444-5555", email: "ana.livia@email.com", senha: "analivia987" },
    { nome: "Ianzeen Isadora", cpf: "11.322.322-44", celular: "(43)98888-1111", email: "ianzeen.isadora@email.com", senha: "ianzeen123" }
]

const produtos = [
    ["Óleo Sintético 5W30", "Lubrificante sintético de alta performance para motores.", "Lubrificantes", 45.90, "oleo.jpg", 50],
    ["Filtro de Óleo Blindado", "Filtro de óleo para proteção contra impurezas no motor.", "Filtros", 28.50, "filtro-de-oleo.jpg", 40],
    ["Filtro de Ar Esportivo", "Filtro de ar lavável de alto fluxo para maior potência.", "Filtros", 149.90, "filtro-de-ar.jpg", 15],
    ["Pastilha de Freio Dianteira", "Jogo de pastilhas de cerâmica sem ruído e alta durabilidade.", "Freios", 119.90, "pastilha-de-freio.jpg", 25],
    ["Disco de Freio Ventilado", "Par de discos dianteiros ventilados de aço carbono.", "Freios", 249.90, "disco-de-freio.jpg", 12],
    ["Vela de Ignição Iridium", "Jogo com 4 velas de iridium para queima eficiente.", "Ignição", 189.90, "velas.jpg", 20],
    ["Cabo de Vela Silicone", "Jogo de cabos de ignição supressivos de 8mm.", "Ignição", 89.90, "cabo-de-vela.jpg", 18],
    ["Amortecedor Dianteiro", "Amortecedor pressurizado a gás para maior estabilidade.", "Suspensão", 329.90, "amortecedor-dianteiro.jpg", 10],
    ["Kit Embreagem Completo", "Platô, disco e rolamento para transmissão manual.", "Transmissão", 489.90, "embreagem.jpg", 8],
    ["Correia Dentada", "Correia sincronizadora reforçada em borracha nitrílica.", "Motor", 79.90, "correia-dentada.jpg", 30],
    ["Bateria Automotiva 60Ah", "Bateria selada livre de manutenção com 18 meses de garantia.", "Elétrica", 389.90, "bateria.jpg", 14],
    ["Lâmpada Super LED H4", "Par de lâmpadas LED 6000K branco frio para farol principal.", "Iluminação", 129.90, "lampada-led.jpg", 22],
    ["Palheta Limpador Silicone", "Par de palhetas flexíveis de encaixe universal.", "Acessórios", 49.90, "palheta-limpador.jpg", 35],
    ["Aditivo Radiador Concentrado", "Fluido orgânico anticorrosivo rosa de 1 litro.", "Arrefecimento", 34.90, "aditivo.jpg", 45],
    ["Bomba de Água", "Bomba d'água com rotor de alumínio e junta de vedação.", "Arrefecimento", 139.90, "bomba-de-agua.jpg", 16],
    ["Fluido de Freio DOT 4", "Frasco de 500ml de fluido sintético para freios ABS.", "Freios", 24.90, "fluido.jpg", 40],
    ["Sensor de Oxigênio", "Sonda lambda universal de 4 fios para injeção eletrônica.", "Injeção", 179.90, "sonda.jpeg", 12],
    ["Bico Injetor Flex", "Válvula injetora de combustível de alta vazão.", "Injeção", 159.90, "bico-injetor.jpeg", 15],
    ["Tapete Automotivo Borracha", "Jogo com 4 tapetes impermeáveis e antiderrapantes.", "Acessórios", 84.90, "tapete.jpeg", 20]
]

async function garantir_banco() {
    const { database, ...semBanco } = config
    const nomeSeguro = String(database).replace(/`/g, "")
    const conexao = await mysql.createConnection(semBanco)
    try {
        await conexao.query(
            `CREATE DATABASE IF NOT EXISTS \`${nomeSeguro}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        )
    } finally {
        await conexao.end()
    }
}

async function executar() {
    console.log("Preparando banco de dados...")
    await garantir_banco()

    const connection = await pool.getConnection()
    try {
        console.log("Criando estrutura das tabelas...")
        await connection.query("SET FOREIGN_KEY_CHECKS = 0")
        await connection.query("DROP TABLE IF EXISTS produtocompra")
        await connection.query("DROP TABLE IF EXISTS compra")
        await connection.query("DROP TABLE IF EXISTS endereco")
        await connection.query("DROP TABLE IF EXISTS produto")
        await connection.query("DROP TABLE IF EXISTS cliente")
        await connection.query(ESTRUTURA_CLIENTE)
        await connection.query(ESTRUTURA_PRODUTO)
        await connection.query(ESTRUTURA_ENDERECO)
        await connection.query(ESTRUTURA_COMPRA)
        await connection.query(ESTRUTURA_PRODUTOCOMPRA)
        await connection.query("SET FOREIGN_KEY_CHECKS = 1")

        await connection.beginTransaction()
        console.log("Inserindo dados...")

        let idGuilherme = null
        for (const cliente of clientes) {
            const senhaCript = await bcrypt.hash(cliente.senha, 10)
            const [resultado] = await connection.query(
                `INSERT INTO cliente (nome, cpf, celular, email, senha) VALUES (?, ?, ?, ?, ?)`,
                [cliente.nome, cliente.cpf, cliente.celular, cliente.email, senhaCript]
            )
            if (cliente.email === "guilherme.godoy@email.com") {
                idGuilherme = resultado.insertId
            }
        }

        for (const produto of produtos) {
            await connection.query(
                `INSERT INTO produto (nome, descricao, categoria, preco, caminho_img, quantidade)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [produto[0], produto[1], produto[2], produto[3], BASE_IMG + produto[4], produto[5]]
            )
        }

        await connection.query(
            `INSERT INTO endereco (idCliente, numero, rua, bairro, cidade, estado)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [idGuilherme, 123, "Rua das Peças", "Centro", "Curitiba", "PR"]
        )

        await connection.commit()
        console.log("Migration executada com sucesso!")
        console.log("Login de teste: guilherme.godoy@email.com / godoy123")
    } catch (error) {
        try { await connection.rollback() } catch (rollbackError) { /* ignora */ }
        console.error("Erro na migration:", error)
        process.exitCode = 1
    } finally {
        connection.release()
        await pool.end()
    }
}

executar()
