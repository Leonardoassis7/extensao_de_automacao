Extensao RPA Web – Preencha formulários com Excel

Extensao RPA Web é uma extensão do Google Chrome que permite você criar automações simples em qualquer página da web, usando apenas o navegador e uma planilha do Excel.

Com ela, você pode:

    Gravar passos em qualquer site (campo de texto, clique de botão).

    Executar a automação em todos os dados da planilha.

    Repetir o fluxo quantas vezes quiser, sem precisar apertar tecla e clicar manualmente.

Objetivo:

A extensão foi pensada para:

    Pessoas que não sabem programar.

    Quem precisa preencher formulários repetitivos (ex: cadastro de alunos, clientes, produtos).

    Quem quer automatizar tarefas no navegador de forma rápida e simples.

Como funciona:

    O usuário instala a extensão pelo Chrome.

    Abre um site qualquer (ex: uma página de cadastro de alunos).

    Arrasta ou envia uma planilha do Excel para a extensão (com campos padrão).

    Inicia o modo de gravação.

    Em cada ação:

        Para preencher um campo: pressiona SHIFT + CLIQUE no campo.

        Para clicar em um botão: pressiona CTRL + CLIQUE no botão.

    A extensão vai capturar essas ações e salvar o fluxo de automação.

    Ao final, o usuário salva a automação.

    Depois, basta clicar em “Rodar” que a extensão:

        Percorre as linhas do Excel.

        Repete o fluxo gravado em cada página.

A extensão nunca fecha sozinha enquanto o usuário não decidir sair do modo de automação.
Funcionalidades principais:

    Gravação de ações em qualquer página (formulários, botões, etc.).

    Associação de campos com colunas do Excel (ex: nome -> #campo-nome).

    Leitura de planilhas Excel diretamente no navegador (biblioteca SheetJS / xlsx.js).

    Salvar e reutilizar automações varias vezes (JSON salvo no navegador).

    Modo de execução contínua (não fecha sozinho, só finaliza quando o usuário decide).

Tecnologias usadas:

    Chrome Extension (Manifest V3): roda no navegador, em qualquer página.

    JavaScript (vanilla): captura cliques, teclas e gera seletores CSS.

    SheetJS (xlsx.js): lê arquivos Excel diretamente no popup.

    chrome.storage.local: armazena automações criadas pelos usuários.

    Content Scripts: rodam na própria página para capturar o comportamento do usuário.

Estrutura do projeto:

<img width="720" height="226" alt="image" src="https://github.com/user-attachments/assets/80143208-6282-443d-8eae-c131a93b215e" />


-- Versão 1.1
<img width="1366" height="651" alt="image" src="https://github.com/user-attachments/assets/f54c198a-a802-4794-8f83-e66c25fede9f" />

-- Primeira Versão 1.0 --
<img width="1359" height="655" alt="image" src="https://github.com/user-attachments/assets/88f979af-9ec8-466e-9b15-e77af418fe68" />
