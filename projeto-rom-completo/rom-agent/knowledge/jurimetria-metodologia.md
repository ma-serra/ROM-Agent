# Jurimetria — metodologia ROM (referência)

Jurimetria é a aplicação de estatística e ciência de dados ao Direito: converter grandes volumes de decisões em métricas acionáveis sobre o comportamento de tribunais, órgãos e relatores. No ROM, é a camada EMPÍRICA que complementa o diagnóstico jurídico de admissibilidade.

## Para que serve aqui
- Estimar a **taxa de conhecimento** (admissibilidade empírica) e a **taxa de provimento** da matéria no foro de destino.
- Mapear o **perfil decisório** de órgãos e relatores e os **fundamentos** associados a êxito.
- Calibrar **expectativa** e **prazo** do cliente (tempo de tramitação).
- Detectar **tendência** (entendimento se firmando, mudando ou em divergência → distinção/superação).

## Variáveis a coletar por acórdão
tribunal · órgão (turma/câmara) · relator · matéria · classe · fundamento principal · súmula aplicada · conhecido (sim/não) · resultado (provido/parcial/improvido) · data de distribuição · data de julgamento · processo · fonte.

## Métricas
- Taxa de conhecimento = conhecidos / total.
- Taxa de provimento = providos / conhecidos.
- Tempo de tramitação = mediana(julgamento − distribuição).
- Recortes por órgão, relator e fundamento; série temporal.

## Limites estatísticos (sempre declarar)
- n pequeno (<30) → indicativo, não conclusivo.
- Viés de seleção: ementadas ≠ universo; monocráticas e acordos escapam.
- Correlação ≠ causalidade; passado ≠ futuro.
- Datar a janela analisada.

## Limites éticos (sempre observar)
- Somente dados públicos; respeito à LGPD.
- Imparcialidade do magistrado é premissa (LOMAN, art. 35), não variável a manipular.
- Jurimetria orienta estratégia e expectativa; não substitui o mérito nem serve a pressionar/influenciar indevidamente o julgador.
- O debate sobre limites dessas ferramentas ainda amadurece no Brasil; tratar perfil decisório como hipótese interna de trabalho.

## Ferramentas de mercado (para integração futura via MCP)
Data Lawyer, Judit.io (API), Legal One Analytics, Turivius — fontes possíveis de corpus além da raspagem dos repositórios oficiais STJ/STF.
