// Ponto único de acesso à API. Tudo em http://localhost:3000
// Se a página for aberta direto do disco (file://), usa o endereço fixo do servidor local.
const LINK_API = location.protocol === "http:" || location.protocol === "https:"
    ? location.origin
    : "http://localhost:3001"

async function requisitar(caminho, opcoes = {}) {
    const resposta = await fetch(LINK_API + caminho, opcoes)
    let corpo = null
    try {
        corpo = await resposta.json()
    } catch (erro) {
        corpo = null
    }

    if (!resposta.ok) {
        const msg = (corpo && (corpo.msg || corpo.erro || corpo.mensagem)) || "Erro na API"
        throw new Error(msg)
    }
    return corpo
}

function opcoes_json(metodo, dados, comToken = false) {
    const headers = { "Content-Type": "application/json" }
    if (comToken) {
        const token = localStorage.getItem("token")
        if (token) headers["Authorization"] = "Bearer " + token
    }
    return { method: metodo, headers, body: JSON.stringify(dados) }
}

function opcoes_autenticadas() {
    const headers = {}
    const token = localStorage.getItem("token")
    if (token) headers["Authorization"] = "Bearer " + token
    return { headers }
}

function token_cliente() {
    return localStorage.getItem("token")
}

// Redireciona para o login quando não há token. Retorna true se está autenticado.
function requer_login() {
    if (!token_cliente()) {
        window.location.href = "login.html"
        return false
    }
    return true
}

// AV1
function cadastrar_cliente(dados) {
    return requisitar("/cliente", opcoes_json("POST", dados))
}

function login_cliente(dados) {
    return requisitar("/login", opcoes_json("POST", dados))
}

function buscar_perfil() {
    return requisitar("/cliente/perfil", opcoes_autenticadas())
}

// AV2
function buscar_produtos(queryParams) {
    const queryString = queryParams ? queryParams.toString() : ""
    return requisitar("/produto" + (queryString ? "?" + queryString : ""))
}

function buscar_produto(id) {
    return requisitar("/produto/" + encodeURIComponent(id))
}

// AV3
function cadastrar_compra(dados) {
    return requisitar("/compra", opcoes_json("POST", dados, true))
}

function buscar_compras() {
    return requisitar("/compra", opcoes_autenticadas())
}

