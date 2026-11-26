// Carrinho compartilhado entre a vitrine (index.html) e a página de compras.
// Os itens ficam no localStorage para sobreviverem à navegação entre páginas.
const CHAVE_CARRINHO = "carrinho_godoy"

 function obter_carrinho() {
    try {
        const dados = JSON.parse(localStorage.getItem(CHAVE_CARRINHO) || "[]")
        return Array.isArray(dados) ? dados : []
    } catch (erro) {
        return []
    }
}

function salvar_carrinho(itens) {
    localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(itens))
    atualizar_badge()
    return itens
}

function notificar(mensagem, classe = "bg-success") {
    if (typeof window.mostrarToast === "function") {
        window.mostrarToast(mensagem, classe)
    }
}

// Adiciona um produto (ou incrementa a quantidade se já estiver no carrinho).
 function adicionar_ao_carrinho(produto, quantidade = 1) {
    const itens = obter_carrinho()
    const estoque = Number(produto.quantidade ?? 0)
    const quantidade_desejada = Number(quantidade)

    if (estoque < 1) {
        notificar("Produto sem estoque disponível.", "bg-danger")
        return false
    }
    if (!Number.isInteger(quantidade_desejada) || quantidade_desejada < 1) {
        notificar("Quantidade inválida.", "bg-danger")
        return false
    }

    const item = itens.find(i => i.id === produto.id)
    const quantidade_final = (item ? item.quantidade : 0) + quantidade_desejada

    if (quantidade_final > estoque) {
        notificar(`Estoque insuficiente. Disponível: ${estoque}.`, "bg-danger")
        return false
    }

    if (item) {
        item.quantidade = quantidade_final
        item.produto = produto
    } else {
        itens.push({ id: produto.id, produto, quantidade: quantidade_desejada })
    }

    salvar_carrinho(itens)
    notificar(produto.nome + " adicionado ao carrinho.")
    return true
}

 function alterar_quantidade(id, quantidade) {
    const itens = obter_carrinho()
    const item = itens.find(i => i.id === Number(id))
    if (!item) return false

    const nova = Number(quantidade)
    if (!Number.isInteger(nova) || nova < 1 || nova > Number(item.produto.quantidade ?? 0)) {
        notificar("Quantidade inválida para esta peça.", "bg-danger")
        return false
    }

    item.quantidade = nova
    salvar_carrinho(itens)
    return true
}

 function remover_do_carrinho(id) {
    salvar_carrinho(obter_carrinho().filter(i => i.id !== Number(id)))
}

 function limpar_carrinho() {
    salvar_carrinho([])
}

 function total_itens() {
    return obter_carrinho().reduce((soma, item) => soma + item.quantidade, 0)
}

 function total_valor() {
    return obter_carrinho().reduce(
        (soma, item) => soma + Number(item.produto.preco) * item.quantidade,
        0
    )
}

 function atualizar_badge() {
    const badge = document.getElementById("badge-carrinho")
    if (!badge) return
    const quantidade = total_itens()
    badge.textContent = String(quantidade)
    badge.style.display = quantidade > 0 ? "inline-block" : "none"
}

// Atualiza o contador do navbar assim que o módulo é carregado.
atualizar_badge()
