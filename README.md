# PickClassStarUml (StarUML Extension)

Extensão para o **StarUML** que gera uma planilha **.xlsx** com os cálculos **FI / FIT / LIF** e a seção **Integration order** (ordem sugerida de integração das classes).

---

## Requisitos (Windows)

- StarUML instalado
- Git instalado
- Node.js instalado (o npm vem junto)
- Yarn v1 (ex.: **1.22.19**)

> Se você já tem Node e npm, normalmente só falta o Yarn.

---

## Instalação (passo a passo)

### 1) Localizar a pasta de extensões do StarUML

No **Explorador de Arquivos**, navegue até:

- `C:\`
- `Users` (ou `Usuários`)
- `[nomeDoUsuario]`
- `AppData`
- `Roaming`
- `StarUML`
- `extensions`
- `user`

Caminho final:

`C:\Users\[nomeDoUsuario]\AppData\Roaming\StarUML\extensions\user`

> A pasta `user` pode estar vazia — isso é normal. É dentro dela que o plugin será instalado.


---

### 2) Abrir o terminal diretamente nessa pasta

**Opção A (mais simples):** com a pasta aberta no Explorer, clique na barra de endereço, digite `cmd` e pressione **Enter** (abre o terminal já no local).

**Opção B (PowerShell):** abra o PowerShell e execute:

```powershell
cd "$env:APPDATA\StarUML\extensions\user"
```

### 3) Clonar o repositório do plugin

Copie e cole:

```powershell
git clone https://github.com/YanPaivaAndrade/PickClassStarUml.git
```
Ao final, deve existir a pasta:
%APPDATA%\StarUML\extensions\user\PickClassStarUml

### 4) Entrar na pasta do plugin

Copie e cole:

```powershell
cd ".\PickClassStarUml"
```

### 5) Instalar o Yarn (se não tiver)

Primeiro, teste:

```powershell
yarn -v
```
Se aparecer “yarn não é reconhecido”, instale o Yarn v1:

```powershell
npm i -g yarn@1.22.19
```

Depois feche e abra o PowerShell e confirme:
```powershell
yarn -v
```

### 6) Instalar as dependências do plugin

Ainda dentro da pasta do plugin, rode:

```powershell
yarn install
```

### 7) Reiniciar o StarUML

Feche o StarUML e abra novamente.


## Como usar

Abra seu arquivo .mdj (ou .mfj) no StarUML

Vá no menu PickClass

Clique em Generate document

O StarUML vai gerar/baixar um arquivo .xlsx com os resultados (FI/FIT/LIF + Integration order)
