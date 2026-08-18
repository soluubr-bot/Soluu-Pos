# Soluu Maquininha

Aplicativo que roda **dentro da maquininha** e faz a ponte entre o Soluu Gestão
e o pagamento no cartão.

Ele não é o PDV. O operador continua trabalhando no Soluu Gestão, no computador
ou tablet. Este app tem uma função só: receber a cobrança que o PDV mandou,
executar o pagamento no terminal e devolver o resultado.

## Como se encaixa

```
PDV no navegador  →  cria a cobrança  →  smartposOrders (aguardando)
                                              ↓  (este app busca)
                              executa o pagamento no terminal
                                              ↓  (grava o resultado)
                                          pago
                                              ↓
              o Gestão liquida: comanda, nota fiscal, estoque, financeiro
```

É o mesmo caminho que a integração da Stone já usa hoje. A diferença é quem
escuta do outro lado: lá é a própria Stone, aqui é este app.

## Decisões que não são óbvias

**Não existe app Android registrado no Firebase, e nem precisa.** O
`google-services.json` só serve para as bibliotecas nativas do Firebase. Aqui
usamos o SDK JavaScript dentro do webview, e o login é feito com um token que o
nosso servidor gera no pareamento — não com login do Google. Registrar só
voltaria a ser necessário para notificação push (FCM) ou login nativo.

**A configuração do Firebase no código não é segredo.** Ela apenas identifica o
projeto e já é pública no Gestão que roda no navegador. Quem protege os dados
são as regras do Firestore e o token do dispositivo: um aparelho sem pareamento
válido não lê nada.

**O operador puxa a cobrança, o servidor não empurra.** Maquininha dorme e o
Android mata app em segundo plano; depender de push seria frágil. O operador
encosta no aparelho e ele busca o que está pendente — que também é como a Stone
opera no modo de pedido listado.

**A arena nunca é escolhida no aparelho.** Ela vem carimbada no token emitido
pelo servidor durante o pareamento, então uma maquininha não consegue pedir
cobranças de outra arena.

## Rodando

```bash
npm install
npm run dev
```

O app é 100% web: dá para desenvolver e testar tudo no navegador, inclusive o
ciclo completo de cobrança. A maquininha física só é necessária na etapa do
pagamento real.

## Gerando o aplicativo Android

Precisa do **Android Studio** instalado (ele traz o SDK e aceita as licenças).

```bash
npm run android
```

Isso compila o site, copia para dentro do projeto Android e abre o Android
Studio. De lá, `Run` instala no aparelho conectado por USB.

Para gerar o APK direto, sem abrir o Android Studio:

```bash
npm run android:apk
```

O arquivo sai em `android/app/build/outputs/apk/debug/`.

### Escolhas do projeto Android

- **Retrato travado**: maquininha fica presa no suporte; a tela não pode girar
  no meio de uma cobrança.
- **Tela sempre acesa** (`src/lib/tela.ts`): sem isso o operador teria que
  acordar o aparelho antes de cada venda.
- O número de série real virá do lado nativo, por `window.SoluuPOS.serial`.
  Enquanto não existe, o app gera um identificador local marcado como `DEV-`.

## Etapas

1. ~~Esqueleto rodando no navegador~~ ✅
2. Pareamento — função no servidor + tela em Configurações do Gestão
3. Ciclo completo com pagamento simulado
4. Empacotar com Capacitor e instalar na maquininha
5. Pagamento real (depende do SDK da adquirente)

## Projeto Firebase

Mesmo do Gestão: `soluugestao`, banco `soluu-gestao-db`, região
`southamerica-east1`.
