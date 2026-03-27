let mediaRecorder;
let audioChunks = [];
let stream;
let audioBlob;

const modal = document.getElementById("modalTermo");
const btnFechar = document.getElementById("btnFechar");
const btnEnviar = document.getElementById("btnEnviar");

// Seleciona todos os containers de gravação da página
const containersGravacao = document.querySelectorAll('.gravacao-perfil');

containersGravacao.forEach(container => {
    const btnGravar = container.querySelector('.btnGravar');
    const btnParar = container.querySelector('.btnParar');

    btnGravar.onclick = async () => {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = e => audioChunks.push(e.data);

            mediaRecorder.onstop = () => {
                audioBlob = new Blob(audioChunks, { type: "audio/webm" });
                // ALTERAÇÃO CRÍTICA: Mudar para 'flex' para ativar a centralização do CSS
                modal.style.display = "flex";
            };

            mediaRecorder.start();
            
            // Controle visual dos botões
            btnGravar.disabled = true;
            btnParar.disabled = false;
            btnGravar.innerText = "GRAVANDO...";
        } catch (err) {
            console.error("Erro ao acessar microfone:", err);
            alert("ERRO AO ACESSAR O MICROFONE. VERIFIQUE AS PERMISSÕES.");
        }
    };

    btnParar.onclick = () => {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
            stream.getTracks().forEach(track => track.stop());
            
            btnGravar.disabled = false;
            btnParar.disabled = true;
            btnGravar.innerText = "GRAVAR";
        }
    };
});

// Funções do Modal
btnFechar.onclick = () => {
    modal.style.display = "none";
};

btnEnviar.onclick = () => {
    if (!audioBlob) {
        alert("NENHUM ÁUDIO ENCONTRADO.");
        return;
    }
    if (!document.getElementById("checkUnico").checked) {
        alert("VOCÊ PRECISA CONCORDAR COM O TEXTO PARA ENVIAR O ÁUDIO.");
        return;
    }

    const nome = document.getElementById("nomeUsuario").value || "ANÔNIMO";
    console.log("ENVIANDO ÁUDIO DE:", nome, audioBlob);
    
    alert("RELATO ENVIADO COM SUCESSO! OBRIGADO.");
    
    // Reseta o estado do modal
    modal.style.display = "none";
    document.getElementById("nomeUsuario").value = "";
    document.getElementById("checkUnico").checked = false;
};

// Fecha o modal se clicar na parte escura (fundo)
window.onclick = (event) => {
    if (event.target == modal) {
        modal.style.display = "none";
    }
};