Assim que eu queria
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

### 1) Abrir o PowerShell

### 2) Ir para a pasta de extensões do StarUML
Copie e cole:

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
