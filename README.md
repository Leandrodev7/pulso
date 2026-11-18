# MarketPulse

Painel web para acompanhar cotações do dólar, euro e Bitcoin em reais. A interface reúne valores atuais, histórico gráfico e conversão entre BRL, USD, EUR e BTC.

## Recursos

- Cotações atualizadas pela AwesomeAPI, com atualização manual e automática.
- Histórico de 7, 30 ou 90 dias em gráfico interativo.
- Horário da última consulta e sinalização de cotações antigas no conversor.
- Tabela acessível com os valores usados no gráfico.
- Conversor de moedas com indicação quando uma cotação está desatualizada.
- Layout responsivo, navegação por teclado e suporte a preferência por movimento reduzido.

## Tecnologias e execução

- HTML, CSS e JavaScript sem framework ou etapa de compilação.
- Chart.js 4.4.1, carregado de uma URL versionada do cdnjs e verificado por SRI.
- AwesomeAPI para dados de cotação.

Para executar localmente, abra `index.html` em um navegador ou sirva a pasta por um servidor estático local. A consulta à API depende de conexão com a internet e pode não funcionar ao abrir o arquivo diretamente, conforme as regras de origem do navegador.

## Privacidade e segurança

O projeto não possui backend, contas, formulários de cadastro, ferramentas de análise ou publicidade. O código do site não grava cookies nem armazena valores do conversor; esses valores são processados no navegador e não são enviados à API. As consultas externas contêm apenas os pares de moedas solicitados. A hospedagem, AwesomeAPI e cdnjs ainda podem receber dados técnicos da conexão, como IP e navegador, segundo suas próprias políticas.

Há uma política CSP no HTML que limita scripts, estilos, fontes e conexões às origens necessárias; a biblioteca Chart.js também usa Subresource Integrity (SRI). O código da aplicação não insere respostas da API como HTML. A página depende da disponibilidade e das práticas de privacidade da AwesomeAPI, cdnjs e hospedagem; não há como garantir disponibilidade contínua, ausência absoluta de falhas ou cotação em tempo real. Leia também [privacidade.html](./privacidade.html).

**Antes da publicação:** identificar na política a pessoa ou organização que decide a operação do site e incluir um canal de contato para solicitações de privacidade. Até essas informações serem fornecidas, `privacidade.html` é uma minuta, não uma declaração de conformidade com a LGPD. A adequação depende também da operação real e dos fornecedores escolhidos; este projeto não constitui parecer jurídico.

### Publicação no Cloudflare Pages

O arquivo `_headers` configura cabeçalhos HTTP de CSP, proteção contra MIME incorreto, política de referência e permissões do navegador. A CSP enviada pelo Cloudflare também impede que a página seja incorporada em frames. O HTML mantém uma política CSP de reserva para execução fora do Cloudflare.

No Cloudflare Pages, crie um projeto conectado ao repositório Git ou faça upload dos arquivos do site. Para este site estático, não é necessário comando de build: use a raiz do projeto como diretório de saída e deixe o comando de build vazio. Confirme que `_headers` foi publicado com `index.html`, `style.css` e `script.js`.

Depois da publicação, teste a URL `pages.dev` ou o domínio personalizado e confirme que os cabeçalhos de segurança aparecem na resposta HTTP.

### Google Search Console

Após obter a URL pública no Cloudflare Pages, adicione-a ao [Google Search Console](https://search.google.com/search-console/) como uma propriedade de prefixo de URL. Conclua a verificação de propriedade seguindo o método sugerido pelo Google e solicite a indexação da página inicial. A inclusão nos resultados não é imediata nem garantida pelo Google. Este projeto não inclui um sitemap porque ainda não há um domínio público definido.

Não há credenciais ou projeto Cloudflare configurados neste repositório. Nenhuma configuração torna um site “à prova de problemas”; mantenha dependências e instruções de implantação revisadas.

## Dados financeiros

Os valores são informativos, podem ter atraso ou diferir dos praticados por instituições financeiras devido a IOF, spread e tarifas. Não constituem recomendação de investimento.

## Créditos

- API de cotações: [AwesomeAPI](https://docs.awesomeapi.com.br/)
- Gráficos: [Chart.js](https://www.chartjs.org/)
- Desenvolvido por Leandro Dev7 como projeto de estudo e portfólio.
