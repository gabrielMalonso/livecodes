# LiveCodes para Android

Empacotamento pessoal do LiveCodes com Capacitor 8.5.2. O código web é compilado
localmente e incluído no APK; não depende de um servidor rodando no computador.

Abre em TypeScript, com CodeMirror, console e execução manual pelo botão Run.
O editor abre com o GitHub Dark adaptado às cores do VS Code de Gabriel.
Mantém o compilador TypeScript 5.9.3 do upstream. Componentes e compiladores
carregados por CDN e o sandbox do LiveCodes ainda precisam de internet.
Os projetos salvos ficam no armazenamento local do app.

O wrapper ativa `keyboardToolbar=true` e `consoleInput=false` na URL inicial.
A barra de teclas aparece acima do teclado Android somente quando um editor de
código está em foco. Tab, Shift+Tab e Run ficam fixos; símbolos e operadores são
distribuídos em páginas com swipe (a quantidade de páginas se adapta à largura).
A entrada do console fica oculta, mantendo os logs. Remover as flags restaura o
comportamento original. A visibilidade do teclado vem dos insets de IME do Android.

Inclui uma correção na integração CodeMirror/TypeScript: os nomes das bibliotecas
padrão são convertidos para os arquivos `.d.ts` esperados pela API do compilador,
evitando falsos erros de tipos em `console`, arrays e outras APIs padrão.

## Compilar

Pré-requisitos: Node.js 22+, JDK 21 e Android SDK 36.

Na raiz do repositório, para instalar apenas as dependências necessárias ao app:

```sh
npm ci --ignore-scripts
npm rebuild esbuild
npx --no-install patch-package
DOCS_BASE_URL=null npm run build:app
```

Nesta pasta:

```sh
npm ci
npm run build
```

Configure `JAVA_HOME` para o JDK 21 e `ANDROID_HOME` para o SDK Android antes de
executar o build. O APK de desenvolvimento é gerado em
`android/app/build/outputs/apk/debug/app-debug.apk`.

## Instalar por USB

```sh
adb devices -l
adb -s SERIAL install -r android/app/build/outputs/apk/debug/app-debug.apk
adb -s SERIAL shell am start -n com.gabrielalonso.livecodes/.MainActivity
```

O identificador `com.gabrielalonso.livecodes` e a mesma chave de assinatura devem
ser mantidos nas atualizações para preservar os projetos locais. Não é necessário
desinstalar o app para atualizar.

O código e os ícones originais do LiveCodes permanecem sob sua licença MIT,
disponível em `../LICENSE`.
