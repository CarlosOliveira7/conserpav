# Conserpav - Sistema de Controle de Frequência, Pagamentos e Previsão de Custos

Sistema web inteligente para gerenciamento da frequência de trabalhadores, cálculo automático de pagamentos e previsão de custos de mão de obra, desenvolvido para a **Conserpav**, empresa do segmento de obras e pavimentação.

##  Sobre o Projeto

Nas obras da Conserpav, o controle da frequência dos trabalhadores é feito de forma manual, por meio de cadernos, planilhas e anotações do responsável pela obra. Esse processo gera erros de contagem, perda de anotações, retrabalho no fechamento dos pagamentos e dificuldade de consulta ao histórico.

O sistema propõe centralizar esse controle, automatizar o cálculo dos pagamentos e, como diferencial, utilizar **Inteligência Artificial** para prever os custos de mão de obra do próximo período de fechamento, com base no histórico da obra.

> A previsão gerada pela IA tem caráter estimativo e de apoio à decisão, não substituindo a análise do responsável pela obra.

##  Problema Identificado

- Registro manual da frequência (dias completos, meios dias e ausências);
- Consolidação manual dos dias trabalhados;
- Cálculo manual dos valores a pagar por funcionário;
- Dificuldade de consulta ao histórico de períodos anteriores;
- Períodos de fechamento distintos (semanal e quinzenal) dificultando a organização dos dados.

##  Funcionalidades do MVP

- **Cadastro de obras** — cadastro das obras e definição do período de fechamento (semanal ou quinzenal).
- **Cadastro de funcionários** — nome, função, valor da diária, obra vinculada e chave Pix.
- **Registro de frequência** — diária completa, meia diária ou ausência.
- **Cálculo automático dos pagamentos** — com base nos registros de frequência.
- **Histórico** — consulta de frequência e pagamentos de períodos anteriores.
- **Relatório de pagamento** — geração em PDF com funcionário, dias completos, meios dias, ausências, valor total e chave Pix.
- **Previsão de custos com IA** — estimativa do custo de mão de obra do próximo período, com base no histórico (custo do período anterior, média dos períodos anteriores, previsão atual e variação estimada).

##  Hipótese de Validação

> Se os dados históricos de frequência e pagamentos forem utilizados por uma solução baseada em Inteligência Artificial para prever os custos de mão de obra, então os responsáveis pelas obras poderão antecipar os gastos dos próximos períodos e utilizar essa informação como apoio ao planejamento financeiro.

Indicadores analisados na validação:

- Diferença entre o custo previsto e o custo real;
- Percentual de erro da previsão;
- Facilidade de compreensão da previsão;
- Utilidade percebida pelo responsável;
- Tempo necessário para obter a estimativa;
- Interesse do usuário em utilizar a funcionalidade.

## Tecnologias Utilizadas

| Camada | Tecnologia | Utilização |
|---|---|---|
| Front-end | React + Vite | Interface web do sistema |
| Back-end | Supabase | Autenticação, API e gerenciamento dos dados |
| Banco de Dados | PostgreSQL | Armazenamento de obras, funcionários, frequências e pagamentos |
| Sincronização | Supabase Realtime | Atualização dos registros entre dispositivos |
| Hospedagem | Vercel | Publicação e hospedagem da aplicação |
| Dev. assistido por IA | ChatGPT / Gemini | Apoio à programação, documentação e revisão de código |
| Análise de dados | Python + Pandas | Organização e tratamento dos dados históricos |
| Machine Learning | Scikit-learn | Experimentação de modelos para estimativa de custos |
| Modelo de previsão | Modelos de regressão | Avaliação de ganhos com Machine Learning na previsão |

##  Cronograma

| Etapa | Atividade | Período |
|---|---|---|
| TED 1 | Identificação do problema, modelagem da solução e primeira versão funcional (obras, funcionários, chamada e relatório) | 03/09 |
| TED 2 | Validação da solução e prototipação (navegação em abas, PWA, tema claro/escuro, período configurável) | 01/10 |
| TED 3 | Desenvolvimento parcial do MVP (relatório refinado, cabeçalho de impressão, sincronização em tempo real) | 05/11 |
| TED 4 | Entrega do MVP final e pitch da solução | 03/12 |

## Equipe

| Nome | Função | RA |
|---|---|---|
| Kaio Moreira Morais | Analista de Requisitos e Documentação Técnica | 25.1.06774 |
| Andrei Pereira Lima | Desenvolvedor Front-End | 25.1 |
| Carlos Oliveira Lopes | Desenvolvedor Back-End | 25.1.07350 |
| Priscila Ferreira Dias Santos | Desenvolvedor Back-End | 25.1.01585 |
| Ywd Rhavell Ferreira Carvalho | Engenheiro de Software / Testes | 25.1.02815 |

##  Links do Projeto

- **Lean Canvas:** [Canva](https://www.canva.com/design/DAHUJp4ClcA/TFKSxVYON0W8lTrb1oURlQ/edit?ui=eyJBIjp7fX0)
- **Repositório:** [github.com/CarlosOliveira7/conserpav](https://github.com/CarlosOliveira7/conserpav)

##  Referências

- MAURYA, Ash. *Running Lean: iterate from Plan A to a Plan That Works*. 2. ed. Sebastopol: O'Reilly Media, 2016.
- NATIONAL INSTITUTE OF STANDARDS AND TECHNOLOGY. *Artificial Intelligence Risk Management Framework (AI RMF 1.0)*. Gaithersburg: NIST, 2023.
- RUSSELL, Stuart; NORVIG, Peter. *Artificial Intelligence: A Modern Approach*. 4. ed. Hoboken: Pearson, 2021.

---

Projeto desenvolvido no âmbito do curso de **Análise e Desenvolvimento de Sistemas** — UNIBALSAS, Balsas - MA, 2026.
