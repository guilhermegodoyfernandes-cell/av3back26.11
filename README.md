# Godoy Autopeças — API + site (porta 3000)

API REST, site e imagens rodando juntos em **http://localhost:3000**.

O arquivo `.env` já vem configurado (veja `dotenv.txt`): banco `Godoy3DSC`, usuário `root`, senha `escola`. Ajuste se necessário. A migration cria o banco/tabelas e popula produtos e usuários de teste. Atenção: `npm start` executa a migration e **recria as tabelas** (apaga os dados anteriores); para rodar apenas o servidor use `node index.js`, e para resetar manualmente use `npm run migrate`.

Login de teste: `guilherme.godoy@email.com` / `godoy123`

## O que está implementado

| Requisito | Onde |
| --- | --- |
| Cadastro de cliente (AV1) | `POST /cliente` |
| Login do cliente (AV1) | `POST /login` (JWT válido por 2h) |
| Perfil do cliente (AV1) | `GET /cliente/perfil` (com token) + `site/perfil.html` |
| Consulta de produtos com filtro (AV2) | `GET /produto?busca=&categoria=&preco_min=&preco_max=&ordenacao=&pagina=` |
| Imagens no servidor (AV3) | `GET /img/<arquivo>` + URLs no banco apontando para `http://localhost:3000/img/` |
| Cadastrar compra (AV3) | `POST /compra` (transação, valida estoque e endereço) + `site/carrinho.html` |
| Consultar compras do usuário (AV3) | `GET /compra` (com token) + seção "Minhas compras" |

## Endpoints rápidos

```bash
# cadastro
curl -X POST http://localhost:3000/cliente -H "Content-Type: application/json" \
  -d '{"nome":"Teste","cpf":"000.000.000-00","celular":"(41)99999-0000","email":"teste@email.com","senha":"123456"}'

# login (copie o token retornado)
curl -X POST http://localhost:3000/login -H "Content-Type: application/json" \
  -d '{"email":"guilherme.godoy@email.com","senha":"godoy123"}'

# perfil
curl http://localhost:3000/cliente/perfil -H "Authorization: Bearer <TOKEN>"

# produtos com filtro
curl "http://localhost:3000/produto?busca=freio&preco_max=150&ordenacao=menor%20preco&pagina=1"

# imagem
curl -I http://localhost:3000/img/oleo.jpg

# compra
curl -X POST http://localhost:3000/compra -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"produtos":[{"id":1,"quantidade":2}],"endereco":{"numero":"10","rua":"Rua A","bairro":"Centro","cidade":"Curitiba","estado":"PR"},"forma_pagamento":"Pix"}'

# compras do usuário
curl http://localhost:3000/compra -H "Authorization: Bearer <TOKEN>"
```

Páginas: `http://localhost:3000/` (produtos), `/login.html`, `/cadastro.html`, `/perfil.html`, `/carrinho.html`.

## Correções feitas na revisão

- Porta fixa `3000` para API, site e imagens (antes dependia de `API_PORT`).
- URLs das imagens corrigidas (arquivo `filtro-de-óleo.jpg` renomeado para `filtro-de-oleo.jpg`) e coluna de estoque unificada como `quantidade`.
- Migration com database criado automaticamente e senhas dos usuários de teste em bcrypt.
- Senha nunca retornada nas consultas de cliente; rotas de alteração/exclusão protegidas por token.
- Validações e mensagens de erro (duplicidade, estoque, endereço, paginação) e transação na compra com rollback.
- Token com duração de 2h (antes expirava em 2 minutos).
- Front-end corrigido para ES modules (`api.js` exporta as funções e `produtos.js` é carregado com `type="module"`); a URL da API acompanha a origem da página.
- `cliente.sql` sincronizado com o `migration.js` (mesmos usuários e senhas de teste).
