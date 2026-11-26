
CREATE DATABASE IF NOT EXISTS `Godoy3DSC`
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `Godoy3DSC`;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS produtocompra;
DROP TABLE IF EXISTS compra;
DROP TABLE IF EXISTS endereco;
DROP TABLE IF EXISTS produto;
DROP TABLE IF EXISTS cliente;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE cliente (
    id INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(50) NOT NULL,
    cpf CHAR(14) NOT NULL,
    celular CHAR(14) NOT NULL,
    email VARCHAR(50) NOT NULL,
    senha VARCHAR(512) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY cpf (cpf),
    UNIQUE KEY email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE endereco (
    id INT NOT NULL AUTO_INCREMENT,
    idCliente INT NOT NULL,
    numero INT NOT NULL,
    rua VARCHAR(100) NOT NULL,
    bairro VARCHAR(50) NOT NULL,
    cidade VARCHAR(50) NOT NULL,
    estado VARCHAR(50) NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (idCliente) REFERENCES cliente(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE produto (
    id INT NOT NULL AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    preco DECIMAL(10,2) NOT NULL,
    caminho_img VARCHAR(255) DEFAULT NULL,
    quantidade INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE compra (
    id INT NOT NULL AUTO_INCREMENT,
    idCliente INT NOT NULL,
    idEndereco INT NOT NULL,
    data DATE NOT NULL,
    forma_pagamento VARCHAR(50) NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (idCliente) REFERENCES cliente(id),
    FOREIGN KEY (idEndereco) REFERENCES endereco(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE produtocompra (
    idproduto INT NOT NULL,
    idcompra INT NOT NULL,
    quantidade INT NOT NULL,
    valor_unitario DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (idproduto, idcompra),
    FOREIGN KEY (idproduto) REFERENCES produto(id),
    FOREIGN KEY (idcompra) REFERENCES compra(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO cliente (nome, cpf, celular, email, senha) VALUES
('Guilherme Godoy', '111.222.333-44', '(41)98888-1111', 'guilherme.godoy@email.com', '$2b$10$CGZWsMh/w0iWGg8KH13sT.7o3D4kCYz05aPJb9zBC1sLq2CwnfF3i'),
('Pedro Nathan', '222.333.444-55', '(42)97777-2222', 'pedro.nathan@email.com', '$2b$10$U571HzaNapE/6l18o3OTM.gq8.aiS/nJN/tnvFktXYjZStKgjk7P.'),
('Antonio Wesley', '333.444.555-66', '(43)96666-3333', 'antonio.wesley@email.com', '$2b$10$IXTz4Y3vvbWhA/H.qo1yhOjNayrau5W0A7/j2jN.ccQjvOXOOlz3e'),
('Kayke Ramos', '444.555.666-77', '(44)95555-4444', 'kayke.ramos@email.com', '$2b$10$vQg9gRNFAt0eZ7AkIgptyevQV4odMY9Ui8.qxxvsfiqZ5fmGoIV3q'),
('Ana Livia', '555.666.777-88', '(45)94444-5555', 'ana.livia@email.com', '$2b$10$b3/Cro/3l4EP3BgrfaK/4.2nYmvThO.iYgvEANGgwe9nblrtrJ9j.'),
('Ianzeen Isadora', '11.322.322-44', '(43)98888-1111', 'ianzeen.isadora@email.com', '$2b$10$3LjIhInl6Y4emo8Jk3AJVOZ/5A4A.fq6DJiI8SR3Uhl5e6J3DQLny');

INSERT INTO endereco (idCliente, numero, rua, bairro, cidade, estado) VALUES
(1, 123, 'Rua das Peças', 'Centro', 'Curitiba', 'PR');

INSERT INTO produto (nome, descricao, categoria, preco, caminho_img, quantidade) VALUES
('Óleo Sintético 5W30', 'Lubrificante sintético de alta performance para motores.', 'Lubrificantes', 45.90, 'http://localhost:3000/img/oleo.jpg', 50),
('Filtro de Óleo Blindado', 'Filtro de óleo para proteção contra impurezas no motor.', 'Filtros', 28.50, 'http://localhost:3000/img/filtro-de-oleo.jpg', 40),
('Filtro de Ar Esportivo', 'Filtro de ar lavável de alto fluxo para maior potência.', 'Filtros', 149.90, 'http://localhost:3000/img/filtro-de-ar.jpg', 15),
('Pastilha de Freio Dianteira', 'Jogo de pastilhas de cerâmica sem ruído e alta durabilidade.', 'Freios', 119.90, 'http://localhost:3000/img/pastilha-de-freio.jpg', 25),
('Disco de Freio Ventilado', 'Par de discos dianteiros ventilados de aço carbono.', 'Freios', 249.90, 'http://localhost:3000/img/disco-de-freio.jpg', 12),
('Vela de Ignição Iridium', 'Jogo com 4 velas de iridium para queima eficiente.', 'Ignição', 189.90, 'http://localhost:3000/img/velas.jpg', 20),
('Cabo de Vela Silicone', 'Jogo de cabos de ignição supressivos de 8mm.', 'Ignição', 89.90, 'http://localhost:3000/img/cabo-de-vela.jpg', 18),
('Amortecedor Dianteiro', 'Amortecedor pressurizado a gás para maior estabilidade.', 'Suspensão', 329.90, 'http://localhost:3000/img/amortecedor-dianteiro.jpg', 10),
('Kit Embreagem Completo', 'Platô, disco e rolamento para transmissão manual.', 'Transmissão', 489.90, 'http://localhost:3000/img/embreagem.jpg', 8),
('Correia Dentada', 'Correia sincronizadora reforçada em borracha nitrílica.', 'Motor', 79.90, 'http://localhost:3000/img/correia-dentada.jpg', 30),
('Bateria Automotiva 60Ah', 'Bateria selada livre de manutenção com 18 meses de garantia.', 'Elétrica', 389.90, 'http://localhost:3000/img/bateria.jpg', 14),
('Lâmpada Super LED H4', 'Par de lâmpadas LED 6000K branco frio para farol principal.', 'Iluminação', 129.90, 'http://localhost:3000/img/lampada-led.jpg', 22),
('Palheta Limpador Silicone', 'Par de palhetas flexíveis de encaixe universal.', 'Acessórios', 49.90, 'http://localhost:3000/img/palheta-limpador.jpg', 35),
('Aditivo Radiador Concentrado', 'Fluido orgânico anticorrosivo rosa de 1 litro.', 'Arrefecimento', 34.90, 'http://localhost:3000/img/aditivo.jpg', 45),
('Bomba de Água', "Bomba d'água com rotor de alumínio e junta de vedação.", 'Arrefecimento', 139.90, 'http://localhost:3000/img/bomba-de-agua.jpg', 16),
('Fluido de Freio DOT 4', 'Frasco de 500ml de fluido sintético para freios ABS.', 'Freios', 24.90, 'http://localhost:3000/img/fluido.jpg', 40),
('Sensor de Oxigênio', 'Sonda lambda universal de 4 fios para injeção eletrônica.', 'Injeção', 179.90, 'http://localhost:3000/img/sonda.jpeg', 12),
('Bico Injetor Flex', 'Válvula injetora de combustível de alta vazão.', 'Injeção', 159.90, 'http://localhost:3000/img/bico-injetor.jpeg', 15),
('Tapete Automotivo Borracha', 'Jogo com 4 tapetes impermeáveis e antiderrapantes.', 'Acessórios', 84.90, 'http://localhost:3000/img/tapete.jpeg', 20);
