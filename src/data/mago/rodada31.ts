import type { MagoRound } from "@/types/mago-premium";

// Projeções pré-jogo fornecidas para a R31 de 2026. Preservar para auditoria futura.
export const rankingSg31 = [
  {
    "clube": "Corinthians",
    "sg": 41.44
  },
  {
    "clube": "Atlético-MG",
    "sg": 33.98
  },
  {
    "clube": "Botafogo",
    "sg": 33.84
  },
  {
    "clube": "São Paulo",
    "sg": 32.84
  },
  {
    "clube": "Bahia",
    "sg": 30.79
  },
  {
    "clube": "Fluminense",
    "sg": 30.55
  },
  {
    "clube": "Athletico-PR",
    "sg": 28.7
  },
  {
    "clube": "Palmeiras",
    "sg": 26.09
  },
  {
    "clube": "Flamengo",
    "sg": 24.63
  },
  {
    "clube": "Remo",
    "sg": 22.98
  },
  {
    "clube": "Vasco",
    "sg": 22.26
  },
  {
    "clube": "Coritiba",
    "sg": 20.55
  },
  {
    "clube": "Grêmio",
    "sg": 19.93
  },
  {
    "clube": "Vitória",
    "sg": 19.09
  },
  {
    "clube": "Santos",
    "sg": 18.63
  },
  {
    "clube": "Cruzeiro",
    "sg": 17.59
  },
  {
    "clube": "Chapecoense",
    "sg": 16.89
  },
  {
    "clube": "Bragantino",
    "sg": 16.08
  }
];
export const especialistas31 = {
  "provaveis": [
    "Botafogo",
    "Corinthians",
    "São Paulo",
    "Flamengo"
  ],
  "alternativas": [
    "Fluminense",
    "Bragantino",
    "Santos",
    "Palmeiras",
    "Athletico-PR"
  ]
};
export const magoRodada31: MagoRound = {
  "rodada": 31,
  "pelotoesDoMago": true,
  "topSg": [
    {
      "clube": "Corinthians",
      "adversario": "Vitória",
      "sg": 41.44,
      "xgAdversario": null,
      "confianca": "ALTA",
      "pelotao": "Pelotão 1",
      "analise": "Maior projeção de SG da rodada contra o Vitória: 41,44% de SG e 1,65 xG. Confirmar os titulares.",
      "veredito": "Projeção, não garantia · confirmar titulares"
    },
    {
      "clube": "Atlético-MG",
      "adversario": "Coritiba",
      "sg": 33.98,
      "xgAdversario": null,
      "confianca": "ALTA",
      "pelotao": "Pelotão 1",
      "analise": "Segunda maior projeção de SG contra o Coritiba. Ausente da seleção externa; atenção às escalações.",
      "veredito": "Projeção, não garantia · confirmar titulares"
    },
    {
      "clube": "Botafogo",
      "adversario": "Chapecoense",
      "sg": 33.84,
      "xgAdversario": null,
      "confianca": "ALTA",
      "pelotao": "Pelotão 1",
      "analise": "Destaque estratégico contra a Chapecoense: 33,84% de SG e 1,78 xG.",
      "veredito": "Projeção, não garantia · confirmar titulares"
    },
    {
      "clube": "São Paulo",
      "adversario": "Vasco",
      "sg": 32.84,
      "xgAdversario": null,
      "confianca": "ALTA",
      "pelotao": "Pelotão 1",
      "analise": "Convergência com especialistas contra o Vasco: 32,84% de SG.",
      "veredito": "Projeção, não garantia · confirmar titulares"
    },
    {
      "clube": "Fluminense",
      "adversario": "Santos",
      "sg": 30.55,
      "xgAdversario": null,
      "confianca": "ALTA",
      "pelotao": "Pelotão 1",
      "analise": "Permanece no Pelotão 1 por curadoria editorial: 30,55% de SG e 1,68 xG contra o Santos.",
      "veredito": "Projeção, não garantia · confirmar titulares"
    }
  ],
  "alternativas": [
    {
      "clube": "Bahia",
      "adversario": "Flamengo",
      "sg": 30.79,
      "xgAdversario": null,
      "confianca": "BOA COM RISCO",
      "pelotao": "Pelotão 2",
      "analise": "Quinto no ranking de SG, mas no Pelotão 2 editorial. Enfrenta o Flamengo.",
      "veredito": "Projeção, não garantia · confirmar titulares"
    },
    {
      "clube": "Athletico-PR",
      "adversario": "Palmeiras",
      "sg": 28.7,
      "xgAdversario": null,
      "confianca": "BOA COM RISCO",
      "pelotao": "Pelotão 2",
      "analise": "Enfrenta o Palmeiras com 28,70% de SG. Controlar o risco.",
      "veredito": "Projeção, não garantia · confirmar titulares"
    },
    {
      "clube": "Palmeiras",
      "adversario": "Athletico-PR",
      "sg": 26.09,
      "xgAdversario": null,
      "confianca": "BOA COM RISCO",
      "pelotao": "Pelotão 2",
      "analise": "Fora de casa contra o Athletico-PR: 26,09% de SG.",
      "veredito": "Projeção, não garantia · confirmar titulares"
    },
    {
      "clube": "Flamengo",
      "adversario": "Bahia",
      "sg": 24.63,
      "xgAdversario": null,
      "confianca": "BOA COM RISCO",
      "pelotao": "Pelotão 2",
      "analise": "Provável na seleção externa, mas com 24,63% de SG contra o Bahia.",
      "veredito": "Projeção, não garantia · confirmar titulares"
    },
    {
      "clube": "Remo",
      "adversario": "Bragantino",
      "sg": 22.98,
      "xgAdversario": null,
      "confianca": "BOA COM RISCO",
      "pelotao": "Pelotão 2",
      "analise": "Destaque ofensivo contra o RB Bragantino: 1,80 xG e 22,98% de SG.",
      "veredito": "Projeção, não garantia · confirmar titulares"
    }
  ],
  "alerta": {
    "clube": "Flamengo",
    "adversario": "Bahia",
    "sg": 24.63,
    "xgAdversario": null,
    "confianca": "BOA COM RISCO",
    "pelotao": "Pelotão 2",
    "analise": "Provável na seleção externa, mas com 24,63% de SG contra o Bahia.",
    "veredito": "Projeção, não garantia · confirmar titulares",
    "texto": "Provável na seleção externa, mas com 24,63% de SG contra o Bahia."
  },
  "escolhaTexto": "Maior projeção de SG da rodada contra o Vitória: 41,44% de SG e 1,65 xG. Confirmar os titulares.",
  "ataques": [
    {
      "clube": "Remo",
      "xg": 1.8
    },
    {
      "clube": "Botafogo",
      "xg": 1.78
    },
    {
      "clube": "Grêmio",
      "xg": 1.73
    },
    {
      "clube": "Fluminense",
      "xg": 1.68
    },
    {
      "clube": "Corinthians",
      "xg": 1.65
    }
  ],
  "ataquesTexto": "Top 5 xG da R31: projeções ofensivas independentes do ranking de SG.",
  "melhorCombinacao": "Corinthians",
  "jogos": [
    {
      "mandante": "Botafogo",
      "visitante": "Chapecoense",
      "dia": "Sábado, 17/10/2026",
      "horario": "18h00"
    },
    {
      "mandante": "Atlético-MG",
      "visitante": "Coritiba",
      "dia": "Sábado, 17/10/2026",
      "horario": "18h30"
    },
    {
      "mandante": "Athletico-PR",
      "visitante": "Palmeiras",
      "dia": "Sábado, 17/10/2026",
      "horario": "19h30"
    },
    {
      "mandante": "São Paulo",
      "visitante": "Vasco",
      "dia": "Sábado, 17/10/2026",
      "horario": "21h00"
    },
    {
      "mandante": "Fluminense",
      "visitante": "Santos",
      "dia": "Domingo, 18/10/2026",
      "horario": "16h00"
    },
    {
      "mandante": "Grêmio",
      "visitante": "Cruzeiro",
      "dia": "Domingo, 18/10/2026",
      "horario": "16h00"
    },
    {
      "mandante": "Bahia",
      "visitante": "Flamengo",
      "dia": "Domingo, 18/10/2026",
      "horario": "18h30"
    },
    {
      "mandante": "Remo",
      "visitante": "Bragantino",
      "dia": "Domingo, 18/10/2026",
      "horario": "19h30"
    },
    {
      "mandante": "Corinthians",
      "visitante": "Vitória",
      "dia": "Segunda-feira, 19/10/2026",
      "horario": "20h00"
    }
  ],
  "placares": [
    {
      "mandante": "Botafogo",
      "visitante": "Chapecoense",
      "golsMandante": 2,
      "golsVisitante": 0
    },
    {
      "mandante": "Atlético-MG",
      "visitante": "Coritiba",
      "golsMandante": 2,
      "golsVisitante": 0
    },
    {
      "mandante": "Athletico-PR",
      "visitante": "Palmeiras",
      "golsMandante": 1,
      "golsVisitante": 1
    },
    {
      "mandante": "São Paulo",
      "visitante": "Vasco",
      "golsMandante": 2,
      "golsVisitante": 0
    },
    {
      "mandante": "Fluminense",
      "visitante": "Santos",
      "golsMandante": 2,
      "golsVisitante": 1
    },
    {
      "mandante": "Grêmio",
      "visitante": "Cruzeiro",
      "golsMandante": 1,
      "golsVisitante": 1
    },
    {
      "mandante": "Bahia",
      "visitante": "Flamengo",
      "golsMandante": 1,
      "golsVisitante": 1
    },
    {
      "mandante": "Remo",
      "visitante": "Bragantino",
      "golsMandante": 2,
      "golsVisitante": 1
    },
    {
      "mandante": "Corinthians",
      "visitante": "Vitória",
      "golsMandante": 2,
      "golsVisitante": 0
    }
  ],
  "pelotoes": [
    {
      "nome": "Pelotão 1",
      "descricao": "Curadoria editorial do POINT FFC; ordem distinta do ranking estatístico de SG.",
      "clubes": [
        "Corinthians",
        "Atlético-MG",
        "Botafogo",
        "São Paulo",
        "Fluminense"
      ]
    },
    {
      "nome": "Pelotão 2",
      "descricao": "Curadoria editorial do POINT FFC; ordem distinta do ranking estatístico de SG.",
      "clubes": [
        "Bahia",
        "Athletico-PR",
        "Palmeiras",
        "Flamengo",
        "Remo"
      ]
    }
  ],
  "resumo": [
    {
      "rotulo": "Escolha do Mago",
      "valor": "Corinthians · 41,44% SG · 1,65 xG"
    },
    {
      "rotulo": "Destaque estratégico",
      "valor": "Botafogo · 33,84% SG · 1,78 xG"
    },
    {
      "rotulo": "Destaque ofensivo",
      "valor": "Remo · 1,80 xG · 22,98% SG"
    }
  ],
  "cruzamentos": [
    {
      "clube": "Fluminense",
      "resultado": "Permanece no Pelotão 1 do Mago"
    },
    {
      "clube": "Atlético-MG",
      "resultado": "33,98% SG; ausente da seleção externa, confirmar escalações"
    },
    {
      "clube": "Flamengo",
      "resultado": "Divergência: 24,63% SG apesar da seleção externa"
    }
  ],
  "convergencia": [
    {
      "rotulo": "Convergência",
      "valor": "Corinthians, Botafogo e São Paulo"
    },
    {
      "rotulo": "Divergência",
      "valor": "Flamengo · 24,63% SG"
    }
  ]
};
