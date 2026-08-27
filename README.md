# MOBY DICK 🎸

Arquivo pessoal de shows — quantos você já foi, quantas vezes viu cada banda,
quando é o próximo e quantos dias faltam. Os dados vêm de uma Google Sheet que
só você edita; seu amigo só acessa o link e vê tudo pronto.

Feito com React + Vite. Roda de graça na Vercel.

---

## Rodando na sua máquina

Precisa de Node.js 18+ instalado.

```bash
npm install     # instala as dependências (só na 1ª vez)
npm run dev     # sobe em http://localhost:5173
npm run build   # gera a versão de produção na pasta dist/
```

Enquanto você não conectar a planilha, o site roda com dados de exemplo.

---

## Conectando a sua planilha (Google Sheets)

1. Crie uma Google Sheet com **exatamente** estas colunas na primeira linha:

   | data | evento | headliner | suporte | local | cidade | preco | setor | nota_voce | nota_amigo | notas |
   |------|--------|-----------|---------|-------|--------|-------|-------|-----------|------------|-------|

   - **data**: `2026-09-19` (ano-mês-dia)
   - **evento**: nome do festival/turnê (ex: `Rock in Rio`). Deixe em branco pra show normal.
   - **headliner**: banda principal. Num festival sem cabeça de cartaz, deixe em branco.
   - **suporte**: bandas de abertura separadas por `;` (ex: `Ingested; Signs Of The Swarm`).
   - **preco**: só o número (ex: `290`).
   - **nota_voce / nota_amigo**: nota de 0 a 10 de cada um (pode ter decimal). Em branco enquanto não foram.

2. No Google Sheets: **Arquivo → Compartilhar → Publicar na web → escolha a aba → formato CSV → Publicar.**
3. Copie o link gerado (algo tipo `https://docs.google.com/spreadsheets/d/e/.../pub?output=csv`).
4. Abra `src/App.jsx` e cole o link na constante do topo:

   ```js
   const SHEET_CSV_URL = "COLE_O_LINK_AQUI";
   ```

5. Ainda no topo do `src/App.jsx`, ajuste os nomes que aparecem nas notas:

   ```js
   const NOME_VOCE = "Suum";
   const NOME_AMIGO = "Magilla";
   ```

> A planilha continua **privada pra edição** — só você edita. O que fica público é
> apenas o CSV, que é justamente o que o site (e seu amigo) consomem. Sem login, sem senha.

### Como registrar um show novo

Abra a planilha (dá pra fazer do celular) e adicione uma linha. O site lê a versão
publicada e atualiza sozinho — pode levar alguns minutos pro Google propagar o CSV.

---

## Publicando na Vercel

1. Crie um repositório no GitHub e suba este projeto:

   ```bash
   git init
   git add .
   git commit -m "primeiro commit"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/moby-dick.git
   git push -u origin main
   ```

2. Entre em [vercel.com](https://vercel.com), faça login com o GitHub e clique em **Add New → Project**.
3. Selecione o repositório `moby-dick`. A Vercel detecta o Vite sozinho:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Clique em **Deploy**. Em ~1 minuto você recebe um link tipo `moby-dick.vercel.app`.

A partir daí, todo `git push` na branch `main` refaz o deploy automaticamente.
Mandou o link pro Magilla e tá no ar. 🤘

---

## Estrutura

```
moby-dick/
├── index.html          # carrega as fontes e monta o app
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx        # ponto de entrada
    ├── App.jsx         # todo o app (dados de exemplo, cálculos, layout)
    └── index.css       # estilos (paleta, tipografia de pôster)
```

Quase tudo que você vai querer mexer está no topo do `src/App.jsx`:
o link da planilha, os nomes e — se quiser testar sem planilha — o `SAMPLE_DATA`.
