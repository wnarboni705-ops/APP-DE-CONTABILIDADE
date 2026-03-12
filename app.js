// app.js - VERSÃO FINAL MODULAR

class Despesa {
    constructor(id, ano, mes, dia, tipo, descricao, valor) {
        this.id = id || 0;
        this.ano = ano;
        this.mes = mes;
        this.dia = dia;
        this.tipo = tipo;
        this.descricao = descricao;
        this.valor = parseFloat(valor) || 0;
    }

    validarDados() {
        return this.ano && this.mes && this.dia >= 1 && this.dia <= 31 && 
               this.tipo && this.descricao && this.valor > 0;
    }
}

class Bd {
    constructor() {
        if (!localStorage.getItem('id')) localStorage.setItem('id', 0);
    }

    getProximoId() { return parseInt(localStorage.getItem('id')) + 1; }

    gravar(d) {
        let id = this.getProximoId();
        d.id = id;
        localStorage.setItem(id, JSON.stringify(d));
        localStorage.setItem('id', id);
    }

    recuperarTodos() {
        let despesas = [], idMax = localStorage.getItem('id');
        for (let i = 1; i <= idMax; i++) {
            let json = localStorage.getItem(i);
            if (json) despesas.push(JSON.parse(json));
        }
        return despesas;
    }

    excluir(id) {
        localStorage.removeItem(id);
        this.reorganizar();
    }

    reorganizar() {
        let despesas = this.recuperarTodos();
        localStorage.clear();
        localStorage.setItem('id', 0);
        despesas.forEach(d => this.gravar(d));
    }
}

const bd = new Bd();
const tiposDespesa = {'1':'Alimentação','2':'Contas da Casa','3':'Lazer','4':'Cartões','5':'Motocicleta'};

// CADASTRO
function cadastrarDespesa() {
    const campos = ['ano','mes','dia','tipo','descricao','valor'].map(id => document.getElementById(id).value);
    const despesa = new Despesa(0, ...campos.slice(0,5), campos[5]);
    
    if (despesa.validarDados()) {
        bd.gravar(despesa);
        mostrarModal('✅ Sucesso!', 'Despesa cadastrada!', 'success', () => limparFormulario());
    } else {
        mostrarModal('❌ Erro!', 'Preencha todos os campos!', 'danger');
    }
}

// CONSULTA
function carregaListaDespesa() { exibeDespesas(bd.recuperarTodos()); }

function pesquisarDespesas() { 
    // Implementar filtro depois
    carregaListaDespesa(); 
}

function exibeDespesas(despesas) {
    const tbody = document.getElementById('tabelaDespesas');
    const total = despesas.reduce((s, d) => s + d.valor, 0);
    
    tbody.innerHTML = despesas.length ? 
        despesas.map(d => `
            <tr>
                <td>${d.dia.toString().padStart(2,'0')}/${d.mes.padStart(2,'0')}/${d.ano}</td>
                <td><span class="badge bg-secondary">${tiposDespesa[d.tipo]}</span></td>
                <td>${d.descricao}</td>
                <td class="text-end">R$ ${d.valor.toFixed(2).replace('.', ',')}</td>
                <td><button class="btn btn-sm btn-danger" onclick="excluirDespesa(${d.id})"><i class="fas fa-trash"></i></button></td>
            </tr>`).join('') :
        '<tr><td colspan="5" class="text-center">Nenhuma despesa</td></tr>';
    
    document.getElementById('totalRegistros').textContent = `${despesas.length} registros`;
    document.getElementById('totalGasto').textContent = `Total: R$ ${total.toFixed(2).replace('.', ',')}`;
}

// UTILITÁRIOS
function excluirDespesa(id) {
    if (confirm('Excluir?')) {
        bd.excluir(id);
        carregaListaDespesas();
        alert('Excluída!');
    }
}

function limparFormulario() {
    document.querySelectorAll('#ano, #mes, #dia, #tipo, #descricao, #valor').forEach(el => el.value = '');
    document.getElementById('ano').value = '2026';
}

function mostrarModal(titulo, conteudo, tipo, callback) {
    const modal = document.getElementById('modalRegistrarDespesa');
    document.getElementById('modal_titulo').textContent = titulo;
    document.getElementById('modal_conteudo').innerHTML = `<div class="alert alert-${tipo}">${conteudo}</div>`;
    document.getElementById('modal_titulo_div').className = `modal-header text-${tipo}`;
    document.getElementById('modal_btn').className = `btn btn-${tipo}`;
    document.getElementById('modal_btn').textContent = 'OK';
    
    if (callback) document.getElementById('modal_btn').onclick = callback;
    
    new bootstrap.Modal(modal).show();
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    const hoje = new Date();
    const mesAtual = (hoje.getMonth() + 1).toString();
    document.getElementById('mes') && (document.getElementById('mes').value = mesAtual);
    document.getElementById('ano') && (document.getElementById('ano').value = hoje.getFullYear());
});


// === CORREÇÃO DO BOTÃO OK ===
function fecharModal() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalRegistrarDespesa'));
    if (modal) modal.hide();
}

// Substitua a função mostrarModal por esta:
function mostrarModal(titulo, conteudo, tipo, callback) {
    const modal = document.getElementById('modalRegistrarDespesa');
    const tituloEl = document.getElementById('modal_titulo');
    const conteudoEl = document.getElementById('modal_conteudo');
    const tituloDiv = document.getElementById('modal_titulo_div');
    const btn = document.getElementById('modal_btn');
    
    tituloEl.textContent = titulo;
    conteudoEl.innerHTML = `<div class="alert alert-${tipo}">${conteudo}</div>`;
    tituloDiv.className = `modal-header text-${tipo}`;
    btn.className = `btn btn-${tipo}`;
    btn.textContent = 'OK';
    
    // ✅ REMOVE data-bs-dismiss e adiciona onclick manual
    btn.removeAttribute('data-bs-dismiss');
    btn.onclick = function() {
        fecharModal();
        if (callback) callback();
    };
    
    new bootstrap.Modal(modal).show();
}


// === FUNÇÃO DE FILTRO COMPLETA ===
function pesquisarDespesas() {
    const todas = bd.recuperarTodos();  // ✅ CORRIGIDO: recuperarTodos()
    const filtros = {
        ano: document.getElementById('ano')?.value || '',
        mes: document.getElementById('mes')?.value || '',
        dia: parseInt(document.getElementById('dia')?.value || 0),
        tipo: document.getElementById('tipo')?.value || '',
        descricao: (document.getElementById('descricao')?.value || '').toLowerCase().trim(),
        valorMin: parseFloat(document.getElementById('valor')?.value || 0)
    };

    const filtradas = todas.filter(d => 
        (!filtros.ano || d.ano == filtros.ano) &&
        (!filtros.mes || d.mes == filtros.mes) &&
        (!filtros.dia || d.dia == filtros.dia) &&
        (!filtros.tipo || d.tipo == filtros.tipo) &&
        (!filtros.descricao || d.descricao.toLowerCase().includes(filtros.descricao)) &&
        (d.valor >= filtros.valorMin)
    );

    exibeDespesas(filtradas);
}

// Função limpar filtros
function limparFiltros() {
    document.getElementById('ano').value = '2026';
    document.getElementById('mes').value = '';
    document.getElementById('dia').value = '';
    document.getElementById('tipo').value = '';
    document.getElementById('descricao').value = '';
    document.getElementById('valor').value = '';
    carregaListaDespesa();
}

// CORREÇÃO do botão limpar (no HTML da consulta)
