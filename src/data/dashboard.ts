import type {MarketStatus,MatchOdds,RoundStatistic,WizardInsight} from "@/types/dashboard";
// MOCK: substituir pelo estado oficial do Cartola quando o endpoint estiver disponível.
export const marketStatus:MarketStatus={isOpen:true,bolaRolando:false,closesAt:"2026-08-29T15:59:00-03:00",round:25};
// MOCK comercial isolado e vazio: nenhuma marca ou odd é exibida.
export const oddsByMatchId:Record<number,MatchOdds|undefined>={
  346371:{home:1.75,draw:3.4,away:4.8},
  346381:{home:2.1,draw:3.25,away:3.6},
  346379:{home:3.2,draw:3.1,away:2.25},
  346385:{home:1.85,draw:3.4,away:4.2},
  346377:{home:2.05,draw:3.2,away:3.7},
};
// MOCK comercial: preserva a apresentação enquanto não existe uma API própria de odds.
// A ordem acompanha somente os cards em destaque e nunca faz parte do payload Cartola.
export const featuredOdds:MatchOdds[]=Object.values(oddsByMatchId).filter((item):item is MatchOdds=>Boolean(item));
export const openWizardInsights:WizardInsight[]=[{label:"Melhor SG",value:"PAL 62%"},{label:"Expectativa de gols",value:"FLA 1,82"},{label:"Ataque em alta",value:"PAL"}];
export const liveWizardInsights:WizardInsight[]=[{label:"Gols na rodada",value:"12"},{label:"SG mantidos",value:"4"},{label:"Atletas pontuando",value:"87"}];
export const roundStatistics:RoundStatistic[]=[{label:"Jogos",value:"10",detail:"na rodada"},{label:"Média de gols",value:"2,4",detail:"por partida"},{label:"Mandantes",value:"54%",detail:"de favoritismo"},{label:"SG provável",value:"PAL",detail:"62% de chance"}];
export const wizardCleanSheets=[{team:"PAL",value:"62%"},{team:"FLA",value:"58%"},{team:"CAM",value:"54%"}];
export const wizardGoals=[{team:"FLA",value:"1,82"},{team:"PAL",value:"1,65"},{team:"CAM",value:"1,57"}];
export const wizardAttacks=[{team:"FLA",value:"Muito alto"},{team:"PAL",value:"Alto"},{team:"CAM",value:"Alto"}];
export const wizardTips=["Palmeiras é o time com maior probabilidade de SG na rodada.","Flamengo tem o melhor ataque e alto potencial de gols.","Observe os confrontos com defesas mais vulneráveis."];
