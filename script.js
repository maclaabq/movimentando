/* =========================
   CONFIG CLOUDINARY ☁️
   ========================= */
const CLOUDINARY_CLOUD = "dfivbyco4";
const CLOUDINARY_PRESET = "movimentando_relatos";

/* =========================
   VARIÁVEIS GLOBAIS
   ========================= */
let mediaRecorder;
let chunks = [];
let audiosCache = {};
let idPendente = null;

/* =========================
   DOM READY
   ========================= */
document.addEventListener('DOMContentLoaded', () => {

    document.querySelectorAll('.gravacao-perfil').forEach(perfilDiv => {
        perfilDiv.querySelector('.btnGravar')
            ?.addEventListener('click', () => iniciarGravacao(perfilDiv.id));

        perfilDiv.querySelector('.btnParar')
            ?.addEventListener('click', () => pararGravacao(perfilDiv.id));
    });

    const inputArquivo = document.getElementById("inputArquivo");
    const textoArquivo = document.querySelector(".texto-arquivo");

    if (inputArquivo && textoArquivo) {
        inputArquivo.addEventListener("change", () => {
            textoArquivo.textContent = inputArquivo.files.length
                ? inputArquivo.files[0].name
                : "Nenhum arquivo selecionado";
        });
    }

    document.getElementById('btnEnviar')?.addEventListener('click', confirmarEnvio);
    document.getElementById('btnFechar')?.addEventListener('click', fecharModal);
    document.getElementById("btnEnviarImagem")?.addEventListener("click", enviarImagem);
});


/* =========================
   GRAVAÇÃO 🎤
   ========================= */
async function iniciarGravacao(id) {
    chunks = [];

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = e => chunks.push(e.data);

        mediaRecorder.onstop = () => {
            mediaRecorder.stream.getTracks().forEach(t => t.stop());
            const blob = new Blob(chunks, { type: 'audio/webm' });

            audiosCache[id] = blob;
            prepararPreview(blob);
            abrirModal(id);
        };

        mediaRecorder.start();
        alternarBotoes(id, true);
        atualizarBotaoGravar(id, true);

    } catch (err) {
        alert("Erro ao acessar microfone.");
        console.error(err);
    }
}

function pararGravacao(id) {
    mediaRecorder.stop();
    alternarBotoes(id, false);
    atualizarBotaoGravar(id, false);
}

function atualizarBotaoGravar(id, gravando) {
    const btn = document.querySelector(`#${id} .btnGravar`);
    if (!btn) return;

    btn.textContent = gravando ? "🔴 GRAVANDO..." : "GRAVAR";
    btn.style.backgroundColor = gravando ? "#e74c3c" : "";
}


/* =========================
   PREVIEW DO ÁUDIO 🎧
   ========================= */
function prepararPreview(blob) {
    const audio = document.getElementById("audioPreview");
    if (!audio) return;

    audio.src = URL.createObjectURL(blob);
    audio.style.display = "block";
}


/* =========================
   MODAL
   ========================= */
function abrirModal(id) {
    idPendente = id;
    document.getElementById('modalTermo').style.display = 'flex';
}

function fecharModal() {
    document.getElementById('modalTermo').style.display = 'none';
    document.getElementById('nomeUsuario').value = "";
    document.getElementById('checkUnico').checked = false;
}


/* =========================
   SANITIZAR NOME PERFIL
   ========================= */
function sanitizarNomePerfil(texto) {
    return texto
        .normalize("NFD")                 // remove acentos
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, " ")    // remove símbolos
        .trim()
        .split(" ")
        .map((p, i) => i === 0
            ? p.toLowerCase()
            : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
        )
        .join("");
}

/* =========================
   CONFIRMAR ENVIO DO ÁUDIO 🎤
   ========================= */
async function confirmarEnvio() {

    const nomeDigitado = document.getElementById('nomeUsuario').value.trim();
    const aceitou = document.getElementById('checkUnico').checked;
    if (!aceitou) return alert("Aceite o termo para enviar.");

    const agora = new Date();
    const dia = String(agora.getDate()).padStart(2,'0');
    const mes = String(agora.getMonth()+1).padStart(2,'0');
    const ano = agora.getFullYear();
    const hora = String(agora.getHours()).padStart(2,'0');
    const minuto = String(agora.getMinutes()).padStart(2,'0');
    const dataStr = `${dia}-${mes}-${ano}_${hora}h${minuto}`;

    let arquivoFinal = idPendente === "ArquivoExterno"
        ? document.getElementById('inputArquivo').files[0]
        : audiosCache[idPendente];

    if (!arquivoFinal) return alert("Nenhum áudio encontrado.");

    const nomeUsuario = nomeDigitado === ""
        ? "anonimo"
        : nomeDigitado.replace(/\s+/g,"_");

    const divPerfil = document.getElementById(idPendente);
    const nomePerfilBruto = divPerfil.dataset.perfil || idPendente;
    const nomePerfil = sanitizarNomePerfil(nomePerfilBruto);

    const ext = idPendente === "ArquivoExterno"
        ? arquivoFinal.type.split('/')[1] || 'audio'
        : "webm";

    const nomeFinal = `${nomePerfil}_${dataStr}_${nomeUsuario}.${ext}`;

    await enviarParaCloudinary(arquivoFinal, nomeFinal);
    fecharModal();
}

/* =========================
   ENVIO ☁️ CLOUDINARY
   ========================= */
async function enviarParaCloudinary(blob, nomeArquivo) {

    const formData = new FormData();

    const file = new File([blob], nomeArquivo, { type: blob.type });
    formData.append("file", file);

    formData.append("upload_preset", "movimentando_relatos");
    formData.append("folder", "relatos-audio");
    formData.append("public_id", nomeArquivo.replace(/\.[^/.]+$/, ""));

    try {
        const resposta = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/upload`,
            { method: "POST", body: formData }
        );

        const data = await resposta.json();

        if (data.secure_url) {
            alert("✅ Áudio enviado com sucesso!");
            limparCamposUpload();
            console.log("Salvo em:", data.secure_url);
        } else {
            alert("❌ Erro ao enviar.");
            console.error(data);
        }

    } catch (error) {
        alert("❌ Falha de conexão.");
        console.error(error);
    }
}


/* =========================
   LIMPAR CAMPOS
   ========================= */
function limparCamposUpload() {
    document.getElementById('inputArquivo').value = "";
    document.querySelector('.texto-arquivo').textContent = "Nenhum arquivo selecionado";
    document.getElementById('nomeUsuario').value = "";
    document.getElementById('checkUnico').checked = false;
}


/* =========================
   BOTÕES
   ========================= */
function alternarBotoes(id, gravando) {
    const bloco = document.getElementById(id);
    bloco.querySelectorAll('button')[0].disabled = gravando;
    bloco.querySelectorAll('button')[1].disabled = !gravando;
}

/* =========================
   ENVIO DE IMAGEM 📸 CLOUDINARY
   ========================= */
async function enviarImagem() {

    console.log("📸 Clique detectado");

    const input = document.getElementById("inputImagem");
    const nomeDigitado = document.getElementById("nomeImagem").value.trim();
    const aceitou = document.getElementById("checkImagem").checked;
    const status = document.getElementById("statusImagem");
    const botao = document.getElementById("btnEnviarImagem");

    if (!input.files.length) {
        alert("Escolha uma imagem.");
        return;
    }

    if (!aceitou) {
        alert("Aceite o termo para enviar.");
        return;
    }

    const arquivo = input.files[0];
    const nomeAutor = nomeDigitado || "anonimo";
    const timestamp = Date.now();

    const nomeArquivo = `foto_${sanitizarNomePerfil(nomeAutor)}_${timestamp}`;

    const formData = new FormData();
    formData.append("file", arquivo);
    formData.append("upload_preset", CLOUDINARY_PRESET);
    formData.append("folder", "fotos-projeto");
    formData.append("public_id", nomeArquivo);

    try {
        botao.disabled = true;
        status.textContent = "ENVIANDO FOTO...";

        const resposta = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/upload`,
            { method: "POST", body: formData }
        );

        const data = await resposta.json();

        if (data.secure_url) {
            status.textContent = "✅ FOTO ENVIADA COM SUCESSO!";
            console.log("Imagem salva:", data.secure_url);

            input.value = "";
            document.getElementById("nomeImagem").value = "";
            document.getElementById("checkImagem").checked = false;
        } else {
            status.textContent = "❌ ERRO AO ENVIAR";
            console.error(data);
        }

    } catch (erro) {
        status.textContent = "❌ FALHA DE CONEXÃO";
        console.error(erro);
    }

    botao.disabled = false;
}