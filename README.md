# Pulso

Desenvolvido por Leandro Dev7.

Painel web para acompanhar cotações do dólar, euro e Bitcoin em reais. A interface reúne valores atuais em tempo real, histórico gráfico vetorial e conversão de moedas executada diretamente no navegador.

## Recursos

- **Cotações em tempo real:** dados oficiais da AwesomeAPI para USD, EUR e BTC com atualização automática a cada 60s ou sob demanda.
- **Identidade e tema escuro:** paleta em azul-marinho profundo (`#0b1329`, `#14213d`) com acentos em laranja vibrante (`#f28c28`) e tipografia com números tabulares.
- **Relógio de Brasília:** fuso horário oficial (`America/Sao_Paulo`), desacoplado do relógio local do dispositivo e sem presunções de feriados.
- **Gráfico vetorial nativo (SVG):** histórico interativo de 7, 30 ou 90 dias com curvas suaves (Bézier), mira, tooltip de variação e métricas estatísticas (mínima, máxima, média).
- **Tratamento de falhas resiliente:** limpeza automática de dados defasados caso a consulta falhe, exibindo estado claro de erro e botão de nova tentativa.
- **Tabela acessível:** visualização tabular completa dos fechamentos diários para leitores de tela e auditoria de dados (WCAG 2.1 AA).
- **Conversor de moedas:** conversão client-side com atalhos rápidos (100, 500, 1.000, 5.000), paridades direta/inversa e sinalização de cotação desatualizada.
- **Acessibilidade total:** botões interativos com `aria-pressed`, outline visível para navegação por teclado e semântica estrita.

## Tecnologias e Execução

- **HTML5, CSS3 nativo e Vanilla JavaScript (ES6+):** sem frameworks, sem etapa de build ou dependências externas pesadas.
- **Segurança e CSP:** política rígida de Content Security Policy (CSP) configurada via `_headers` e `<meta>`, sem scripts inline (`onsubmit`, `onclick`), sem estilos embutidos e sem CDNs não autorizadas.
- **AwesomeAPI:** dados de cotações de câmbio públicos.

Para executar localmente, sirva o diretório através de um servidor local (por exemplo, `npx serve`, Python `python -m http.server` ou extensão Live Server do VS Code) ou abra `index.html`.

## Privacidade e Governança

O Pulso não possui backend proprietário, cadastro de contas, banco de dados ou ferramentas de rastreamento. As conversões são processadas exclusivamente na memória do navegador do usuário. Veja mais detalhes em [privacidade.html](./privacidade.html).

### Publicação no Cloudflare Pages

O arquivo `_headers` define cabeçalhos HTTP para CSP, `nosniff`, `Referrer-Policy: no-referrer` e restrições de permissões (`Permissions-Policy`). Ao publicar no Cloudflare Pages, mantenha o diretório raiz como pasta de publicação sem comando de build.

## Aviso Legal

Os valores exibidos são puramente informativos e podem apresentar variações ou atrasos de cache da API. Não constituem recomendação de investimento ou compra/venda de ativos.
