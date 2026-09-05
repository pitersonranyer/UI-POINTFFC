import type {MarketStatus,MatchOdds,RoundStatistic,WizardInsight} from "@/types/dashboard";
import { sgRodada26 } from "@/data/mago/sgRodada26";
// MOCK: substituir pelo estado oficial do Cartola quando o endpoint estiver disponível.
export const marketStatus:MarketStatus={isOpen:true,bolaRolando:false,closesAt:"2026-09-05T15:59:00-03:00",round:sgRodada26.rodada};
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
export const openWizardInsights:WizardInsight[]=[{label:"Melhor SG",value:"COR 46,55%"},{label:"Expectativa de gols",value:"FLU 1,62"},{label:"Destaque ofensivo",value:sgRodada26.destaqueOfensivo.clube}];
export const liveWizardInsights:WizardInsight[]=[{label:"Gols na rodada",value:"12"},{label:"SG mantidos",value:"4"},{label:"Atletas pontuando",value:"87"}];
export const roundStatistics:RoundStatistic[]=[{label:"Jogos",value:"10",detail:"na rodada"},{label:"Média de gols",value:"2,4",detail:"por partida"},{label:"Mandantes",value:"54%",detail:"de favoritismo"},{label:"SG provável",value:"PAL",detail:"62% de chance"}];
const decimal = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const wizardCleanSheets=sgRodada26.analises.slice(0,3).map((item)=>({team:item.clube,value:`${decimal.format(item.probabilidadeSg)}%`}));
export const wizardGoals=sgRodada26.melhoresAtaques.slice(0,3).map((item)=>({team:item.clube,value:decimal.format(item.xg)}));
export const wizardAttacks=sgRodada26.melhoresAtaques.slice(3,6).map((item)=>({team:item.clube,value:`${decimal.format(item.xg)} xG`}));
export const wizardTips=[`${sgRodada26.resumoMago.sgMaisForte} é o SG mais forte da rodada.`,`${sgRodada26.resumoMago.diferencialDefensivo} é o melhor diferencial defensivo.`,`${sgRodada26.destaqueOfensivo.clube} é o destaque ofensivo do Mago.`];
