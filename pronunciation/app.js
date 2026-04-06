const STORAGE_KEY = "russian-pronunciation-coach-state-v1";
const REMOTE_PROGRESS_URL = "./api/progress";
const HISTORY_LIMIT = 240;
const VIEW_MODES = new Set(["normal", "syllables", "both"]);
const CHUNK_IDS = [
  "s1-c1",
  "s1-c2",
  "s1-c3",
  "s1-c4",
  "s1-c5",
  "s1-c6",
  "s1-c7",
  "s1-c8",
  "s1-c9",
  "s1-c10",
  "s1-c11",
  "s1-c12",
  "s1-c13",
  "s2-c1",
  "s2-c2",
  "s2-c3",
  "s2-c4",
  "s2-c5",
  "s2-c6",
  "s2-c7",
  "s2-c8",
  "s2-c9",
  "s3-c1",
  "s3-c2",
  "s3-c3",
  "s3-c4",
  "s3-c5",
  "s3-c6",
  "s4-c1",
  "s5-c1",
  "s5-c2",
  "s5-c3",
  "s5-c4",
  "s5-c5",
  "s5-c6",
  "s5-c7",
  "s5-c8",
  "s5-c9",
  "s5-c10",
  "s5-c11",
  "s5-c12",
  "s5-c13",
  "s5-c14",
  "s5-c15",
  "s5-c16",
  "s5-c17",
  "s5-c18",
  "s5-c19",
  "s5-c20",
];
const CHUNK_ID_SET = new Set(CHUNK_IDS);
const RATING_META = [
  { value: 1, label: "Again" },
  { value: 2, label: "Rough" },
  { value: 3, label: "Okay" },
  { value: 4, label: "Close" },
  { value: 5, label: "Solid" },
];

const SENTENCES = [
  {
    id: "s1",
    label: "Sentence 1",
    original:
      'И потом протокол про протокол протоколом запротоколировал, как интервьюером интервьюируемый лигурийский регулировщик речисто, да не чисто рапортовал, да так зарапортовался про размокропогодившуюся погоду что, дабы инцидент не стал претендентом на судебный прецедент, лигурийский регулировщик акклиматизировался в неконституционном Константинополе, где хохлатые хохотушки хохотом хохотали и кричали турке, который начерно обкурен трубкой: "Не кури, турка трубку, купи лучше кипу пик, лучше пик кипу купи, а то придет бомбардир из Бранденбурга – бомбами забомбардирует за то, что некто чернорылый у него полдвора рылом изрыл вырыл и подрыл.',
    chunkIds: [
      "s1-c1",
      "s1-c2",
      "s1-c3",
      "s1-c4",
      "s1-c5",
      "s1-c6",
      "s1-c7",
      "s1-c8",
      "s1-c9",
      "s1-c10",
      "s1-c11",
      "s1-c12",
      "s1-c13",
    ],
  },
  {
    id: "s2",
    label: "Sentence 2",
    original:
      "Но на самом деле турка не был в деле, да и Клара-краля в то время кралась к ларю, пока Карл у Клары крал кораллы, за что Клара у Карла украла кларнет, а потом на дворе дёготниковой вдовы Варвары два этих вора дрова воровали; но грех – не смех – не уложить в орех: о Кларе с Карлом во мраке все раки шумели в драке, – вот и не до бомбардира ворам было, но и не до деготниковой вдовы, и не до деготниковых детей.",
    chunkIds: ["s2-c1", "s2-c2", "s2-c3", "s2-c4", "s2-c5", "s2-c6", "s2-c7", "s2-c8", "s2-c9"],
  },
  {
    id: "s3",
    label: "Sentence 3",
    original:
      "Зато рассердившаяся вдова убрала в сарай дрова: раз дрова, два дрова, три дрова – не вместились все дрова, и два дровосека, два дровокола, два дроворуба для расчувствовавшейся Варвары выдворили дрова вширь двора обратно на дровяной двор, где цапля чахла, цапля сохла, цапля сдохла.",
    chunkIds: ["s3-c1", "s3-c2", "s3-c3", "s3-c4", "s3-c5", "s3-c6"],
  },
  {
    id: "s4",
    label: "Sentence 4",
    original: "Цыплёнок же цапли цепко цеплялся за цепь.",
    chunkIds: ["s4-c1"],
  },
  {
    id: "s5",
    label: "Sentence 5",
    original:
      "Молодец против овец, а против молодца сам овца, которой носит Сеня сено в сани, потом везет Сенька Соньку с Санькой на санках: санки – скок, Сеньку – в бок, Соньку – в лоб, все – в сугроб, а оттуда только шапкой шишки сшиб, затем по шоссе Саша пошёл, Сашу на шоссе Саша нашёл; Сонька же – Сашкина подружка шла по шоссе и сосала сушку, да притом у Соньки-вертушки во рту ещё и три ватрушки – аккурат в медовик, но ей не до медовика – Сонька и с ватрушками во рту пономаря перепономарит, перевыпономарит: жужжит, как жужелица, жужжит, да кружится: была у Фрола – Фролу на Лавра наврала, пойдет к Лавру на Фрола Лавру наврет, что – вахмистр с вахмистршей, ротмистр с ротмистршей, у ужа – ужата, у ежа – ежата, а у него высокопоставленный гость унес трость, и вскоре опять пять ребят съели пять опят с полчетвертью четверика чечевицы без червоточины, да тысячу шестьсот шестьдесят шесть пирогов с творогом из сыворотки из-под простокваши, – о всем о том около кола колокола звоном раззванивали, да так, что даже Константин – зальцбуржский бссперспективняк из-под бронетранспортера констатировал: как все колокола не переколоколовать, не перевыколоколовать, так и всех скороговорок не перескороговорить, не перевыскороговорить; но попытка – не пытка.",
    chunkIds: [
      "s5-c1",
      "s5-c2",
      "s5-c3",
      "s5-c4",
      "s5-c5",
      "s5-c6",
      "s5-c7",
      "s5-c8",
      "s5-c9",
      "s5-c10",
      "s5-c11",
      "s5-c12",
      "s5-c13",
      "s5-c14",
      "s5-c15",
      "s5-c16",
      "s5-c17",
      "s5-c18",
      "s5-c19",
      "s5-c20",
    ],
  },
];

const CHUNKS = [
  {
    id: "s1-c1",
    sentenceId: "s1",
    chunkIndex: 1,
    russian: "И потом протокол про протокол протоколом запротоколировал,",
    syllabified: "И по-том про-то-кол про про-то-кол про-то-ко-лом за-про-то-ко-ли-ро-вал,",
    english: "And then the protocol, about the protocol, protocolized it with a protocol,",
  },
  {
    id: "s1-c2",
    sentenceId: "s1",
    chunkIndex: 2,
    russian: "как интервьюером интервьюируемый лигурийский регулировщик",
    syllabified: "как и-нте-рвью-е-ром и-нте-рвью-и-ру-е-мый ли-гу-ри-йский ре-гу-ли-ро-вщик",
    english: "how the interviewed Ligurian traffic controller,",
  },
  {
    id: "s1-c3",
    sentenceId: "s1",
    chunkIndex: 3,
    russian: "речисто, да не чисто рапортовал,",
    syllabified: "ре-чи-сто, да не чи-сто ра-по-рто-вал,",
    english: "eloquently, but not clearly, delivered his report,",
  },
  {
    id: "s1-c4",
    sentenceId: "s1",
    chunkIndex: 4,
    russian: "да так зарапортовался про размокропогодившуюся погоду",
    syllabified: "да так за-ра-по-рто-ва-лся про ра-змо-кро-по-го-ди-вшу-ю-ся по-го-ду",
    english: "and got so carried away reporting about the weather turning soaking-wet,",
  },
  {
    id: "s1-c5",
    sentenceId: "s1",
    chunkIndex: 5,
    russian: "что, дабы инцидент не стал претендентом на судебный прецедент,",
    syllabified: "что, да-бы и-нци-дент не стал пре-те-нде-нтом на су-де-бный пре-це-дент,",
    english: "that, so the incident would not become a candidate for a court precedent,",
  },
  {
    id: "s1-c6",
    sentenceId: "s1",
    chunkIndex: 6,
    russian: "лигурийский регулировщик акклиматизировался",
    syllabified: "ли-гу-ри-йский ре-гу-ли-ро-вщик а-ккли-ма-ти-зи-ро-ва-лся",
    english: "the Ligurian traffic controller acclimatized himself",
  },
  {
    id: "s1-c7",
    sentenceId: "s1",
    chunkIndex: 7,
    russian: "в неконституционном Константинополе,",
    syllabified: "в не-ко-нсти-ту-ци-о-нном Ко-нста-нти-но-по-ле,",
    english: "in unconstitutional Constantinople,",
  },
  {
    id: "s1-c8",
    sentenceId: "s1",
    chunkIndex: 8,
    russian: "где хохлатые хохотушки хохотом хохотали",
    syllabified: "где хо-хла-ты-е хо-хо-ту-шки хо-хо-том хо-хо-та-ли",
    english: "where crested laughers laughed with laughter",
  },
  {
    id: "s1-c9",
    sentenceId: "s1",
    chunkIndex: 9,
    russian: "и кричали турке, который начерно обкурен трубкой:",
    syllabified: "и кри-ча-ли ту-рке, ко-то-рый на-че-рно о-бку-рен тру-бкой:",
    english: "and shouted to the Turk, blackened all over by his pipe:",
  },
  {
    id: "s1-c10",
    sentenceId: "s1",
    chunkIndex: 10,
    russian: "\"Не кури, турка трубку,",
    syllabified: "\"Не ку-ри, ту-рка тру-бку,",
    english: "\"Don’t smoke, Turk, a pipe,",
  },
  {
    id: "s1-c11",
    sentenceId: "s1",
    chunkIndex: 11,
    russian: "купи лучше кипу пик, лучше пик кипу купи,",
    syllabified: "ку-пи лу-чше ки-пу пик, лу-чше пик ки-пу ку-пи,",
    english: "better buy a bundle of pikes, better buy the bundle of pikes,",
  },
  {
    id: "s1-c12",
    sentenceId: "s1",
    chunkIndex: 12,
    russian: "а то придет бомбардир из Бранденбурга –",
    syllabified: "а то при-дет бо-мба-рдир из Бра-нде-нбу-рга –",
    english: "or a bombardier will come from Brandenburg —",
  },
  {
    id: "s1-c13",
    sentenceId: "s1",
    chunkIndex: 13,
    russian: "бомбами забомбардирует за то, что некто чернорылый у него полдвора рылом изрыл вырыл и подрыл.",
    syllabified: "бо-мба-ми за-бо-мба-рди-ру-ет за то, что не-кто че-рно-ры-лый у не-го по-лдво-ра ры-лом и-зрыл вы-рыл и по-дрыл.",
    english: "and bombard you because some black-snouted fellow rooted up, dug out, and undermined half his yard with his snout.",
  },
  {
    id: "s2-c1",
    sentenceId: "s2",
    chunkIndex: 1,
    russian: "Но на самом деле турка не был в деле,",
    syllabified: "Но на са-мом де-ле ту-рка не был в де-ле,",
    english: "But in fact the Turk was not involved,",
  },
  {
    id: "s2-c2",
    sentenceId: "s2",
    chunkIndex: 2,
    russian: "да и Клара-краля в то время кралась к ларю,",
    syllabified: "да и Кла-ра-кра-ля в то вре-мя кра-лась к ла-рю,",
    english: "and Klara the sneak was creeping toward the chest at that time,",
  },
  {
    id: "s2-c3",
    sentenceId: "s2",
    chunkIndex: 3,
    russian: "пока Карл у Клары крал кораллы,",
    syllabified: "по-ка Карл у Кла-ры крал ко-ра-ллы,",
    english: "while Karl was stealing Klara’s corals,",
  },
  {
    id: "s2-c4",
    sentenceId: "s2",
    chunkIndex: 4,
    russian: "за что Клара у Карла украла кларнет,",
    syllabified: "за что Кла-ра у Ка-рла у-кра-ла кла-рнет,",
    english: "for which Klara stole Karl’s clarinet,",
  },
  {
    id: "s2-c5",
    sentenceId: "s2",
    chunkIndex: 5,
    russian: "а потом на дворе дёготниковой вдовы Варвары",
    syllabified: "а по-том на дво-ре дё-го-тни-ко-вой вдо-вы Ва-рва-ры",
    english: "and then in the yard of Varvara the tar-maker’s widow",
  },
  {
    id: "s2-c6",
    sentenceId: "s2",
    chunkIndex: 6,
    russian: "два этих вора дрова воровали;",
    syllabified: "два э-тих во-ра дро-ва во-ро-ва-ли;",
    english: "those two thieves were stealing firewood;",
  },
  {
    id: "s2-c7",
    sentenceId: "s2",
    chunkIndex: 7,
    russian: "но грех – не смех – не уложить в орех:",
    syllabified: "но грех – не смех – не у-ло-жить в о-рех:",
    english: "but sin is no joke and cannot be packed into a nut:",
  },
  {
    id: "s2-c8",
    sentenceId: "s2",
    chunkIndex: 8,
    russian: "о Кларе с Карлом во мраке все раки шумели в драке, –",
    syllabified: "о Кла-ре с Ка-рлом во мра-ке все ра-ки шу-ме-ли в дра-ке, –",
    english: "about Klara and Karl, in the dark, all the crayfish rattled in a fight,",
  },
  {
    id: "s2-c9",
    sentenceId: "s2",
    chunkIndex: 9,
    russian: "вот и не до бомбардира ворам было, но и не до деготниковой вдовы, и не до деготниковых детей.",
    syllabified: "вот и не до бо-мба-рди-ра во-рам бы-ло, но и не до де-го-тни-ко-вой вдо-вы, и не до де-го-тни-ко-вых де-тей.",
    english: "so the thieves had no time for the bombardier, nor for the tar-maker’s widow, nor for the tar-maker’s children.",
  },
  {
    id: "s3-c1",
    sentenceId: "s3",
    chunkIndex: 1,
    russian: "Зато рассердившаяся вдова убрала в сарай дрова:",
    syllabified: "За-то ра-ссе-рди-вша-я-ся вдо-ва у-бра-ла в са-рай дро-ва:",
    english: "But the angered widow put the firewood away in the shed:",
  },
  {
    id: "s3-c2",
    sentenceId: "s3",
    chunkIndex: 2,
    russian: "раз дрова, два дрова, три дрова –",
    syllabified: "раз дро-ва, два дро-ва, три дро-ва –",
    english: "one log, two logs, three logs —",
  },
  {
    id: "s3-c3",
    sentenceId: "s3",
    chunkIndex: 3,
    russian: "не вместились все дрова,",
    syllabified: "не вме-сти-лись все дро-ва,",
    english: "not all the logs would fit,",
  },
  {
    id: "s3-c4",
    sentenceId: "s3",
    chunkIndex: 4,
    russian: "и два дровосека, два дровокола, два дроворуба",
    syllabified: "и два дро-во-се-ка, два дро-во-ко-ла, два дро-во-ру-ба",
    english: "and two woodcutters, two choppers, two hewers",
  },
  {
    id: "s3-c5",
    sentenceId: "s3",
    chunkIndex: 5,
    russian: "для расчувствовавшейся Варвары выдворили дрова",
    syllabified: "для ра-счу-вство-ва-вше-йся Ва-рва-ры вы-дво-ри-ли дро-ва",
    english: "for the soft-hearted Varvara drove the logs out",
  },
  {
    id: "s3-c6",
    sentenceId: "s3",
    chunkIndex: 6,
    russian: "вширь двора обратно на дровяной двор, где цапля чахла, цапля сохла, цапля сдохла.",
    syllabified: "вширь дво-ра о-бра-тно на дро-вя-ной двор, где ца-пля ча-хла, ца-пля со-хла, ца-пля сдо-хла.",
    english: "back across the yard to the wood yard, where the heron languished, dried out, and died.",
  },
  {
    id: "s4-c1",
    sentenceId: "s4",
    chunkIndex: 1,
    russian: "Цыплёнок же цапли цепко цеплялся за цепь.",
    syllabified: "Цы-плё-нок же ца-пли це-пко це-пля-лся за цепь.",
    english: "But the heron’s chick clung tightly to the chain.",
  },
  {
    id: "s5-c1",
    sentenceId: "s5",
    chunkIndex: 1,
    russian: "Молодец против овец, а против молодца сам овца,",
    syllabified: "Мо-ло-дец про-тив о-вец, а про-тив мо-ло-дца сам о-вца,",
    english: "A brave fellow against sheep, but against a brave fellow he himself is a sheep,",
  },
  {
    id: "s5-c2",
    sentenceId: "s5",
    chunkIndex: 2,
    russian: "которой носит Сеня сено в сани, потом везет Сенька Соньку с Санькой на санках:",
    syllabified: "ко-то-рой но-сит Се-ня се-но в са-ни, по-том ве-зет Се-нька Со-ньку с Са-нькой на са-нках:",
    english: "for whom Senya carries hay into the sleigh, then Senka drives Sonya with Sanka on the sleds:",
  },
  {
    id: "s5-c3",
    sentenceId: "s5",
    chunkIndex: 3,
    russian: "санки – скок, Сеньку – в бок, Соньку – в лоб, все – в сугроб, а оттуда только шапкой шишки сшиб,",
    syllabified: "са-нки – скок, Се-ньку – в бок, Со-ньку – в лоб, все – в су-гроб, а о-тту-да то-лько ша-пкой ши-шки сшиб,",
    english: "the sleds go hop, Senya gets a jab in the side, Sonya in the forehead, everyone into the snowdrift, and from there he only knocks pinecones down with his hat,",
  },
  {
    id: "s5-c4",
    sentenceId: "s5",
    chunkIndex: 4,
    russian: "затем по шоссе Саша пошёл, Сашу на шоссе Саша нашёл;",
    syllabified: "за-тем по шо-ссе Са-ша по-шёл, Са-шу на шо-ссе Са-ша на-шёл;",
    english: "then Sasha walked along the highway, and on the highway Sasha found Sasha;",
  },
  {
    id: "s5-c5",
    sentenceId: "s5",
    chunkIndex: 5,
    russian: "Сонька же – Сашкина подружка шла по шоссе и сосала сушку,",
    syllabified: "Со-нька же – Са-шки-на по-дру-жка шла по шо-ссе и со-са-ла су-шку,",
    english: "and Sonya, Sasha’s friend, walked along the highway sucking on a ring biscuit,",
  },
  {
    id: "s5-c6",
    sentenceId: "s5",
    chunkIndex: 6,
    russian: "да притом у Соньки-вертушки во рту ещё и три ватрушки – аккурат в медовик,",
    syllabified: "да при-том у Со-ньки-ве-рту-шки во рту е-щё и три ва-тру-шки – а-кку-рат в ме-до-вик,",
    english: "and besides, in Sonya-the-twister’s mouth there were still three pastries, right by the honey cake,",
  },
  {
    id: "s5-c7",
    sentenceId: "s5",
    chunkIndex: 7,
    russian: "но ей не до медовика – Сонька и с ватрушками во рту",
    syllabified: "но ей не до ме-до-ви-ка – Со-нька и с ва-тру-шка-ми во рту",
    english: "but she had no time for honey cake — Sonya, even with pastries in her mouth,",
  },
  {
    id: "s5-c8",
    sentenceId: "s5",
    chunkIndex: 8,
    russian: "пономаря перепономарит, перевыпономарит:",
    syllabified: "по-но-ма-ря пе-ре-по-но-ма-рит, пе-ре-вы-по-но-ма-рит:",
    english: "would out-clerk the clerk and over-out-clerk him:",
  },
  {
    id: "s5-c9",
    sentenceId: "s5",
    chunkIndex: 9,
    russian: "жужжит, как жужелица, жужжит, да кружится:",
    syllabified: "жу-жжит, как жу-же-ли-ца, жу-жжит, да кру-жи-тся:",
    english: "she buzzes like a beetle, buzzes and spins:",
  },
  {
    id: "s5-c10",
    sentenceId: "s5",
    chunkIndex: 10,
    russian: "была у Фрола – Фролу на Лавра наврала, пойдет к Лавру на Фрола Лавру наврет,",
    syllabified: "бы-ла у Фро-ла – Фро-лу на Ла-вра на-вра-ла, по-йдет к Ла-вру на Фро-ла Ла-вру на-врет,",
    english: "she was at Frol’s, lied to Frol about Lavr, and will go to Lavr and lie to him about Frol,",
  },
  {
    id: "s5-c11",
    sentenceId: "s5",
    chunkIndex: 11,
    russian: "что – вахмистр с вахмистршей, ротмистр с ротмистршей, у ужа – ужата, у ежа – ежата,",
    syllabified: "что – ва-хмистр с ва-хми-стршей, ро-тмистр с ро-тми-стршей, у у-жа – у-жа-та, у е-жа – е-жа-та,",
    english: "that there is a warrant officer with his wife, a cavalry captain with his wife, baby grass snakes for the snake, and baby hedgehogs for the hedgehog,",
  },
  {
    id: "s5-c12",
    sentenceId: "s5",
    chunkIndex: 12,
    russian: "а у него высокопоставленный гость унес трость,",
    syllabified: "а у не-го вы-со-ко-по-ста-вле-нный гость у-нес трость,",
    english: "and at his place a high-ranking guest carried off a cane,",
  },
  {
    id: "s5-c13",
    sentenceId: "s5",
    chunkIndex: 13,
    russian: "и вскоре опять пять ребят съели пять опят с полчетвертью четверика чечевицы без червоточины,",
    syllabified: "и вско-ре о-пять пять ре-бят съе-ли пять о-пят с по-лче-тве-ртью че-тве-ри-ка че-че-ви-цы без че-рво-то-чи-ны,",
    english: "and soon again five boys ate five honey mushrooms with a quarter-measure of lentils without wormholes,",
  },
  {
    id: "s5-c14",
    sentenceId: "s5",
    chunkIndex: 14,
    russian: "да тысячу шестьсот шестьдесят шесть пирогов с творогом из сыворотки из-под простокваши,",
    syllabified: "да ты-ся-чу ше-стьсот ше-стьде-сят шесть пи-ро-гов с тво-ро-гом из сы-во-ро-тки из-под про-сто-ква-ши,",
    english: "and one thousand six hundred sixty-six pies with curd from the whey of clabbered milk,",
  },
  {
    id: "s5-c15",
    sentenceId: "s5",
    chunkIndex: 15,
    russian: "– о всем о том около кола колокола звоном раззванивали,",
    syllabified: "– о всем о том о-ко-ло ко-ла ко-ло-ко-ла зво-ном ра-ззва-ни-ва-ли,",
    english: "and about all of that the bells around the stake rang out loudly,",
  },
  {
    id: "s5-c16",
    sentenceId: "s5",
    chunkIndex: 16,
    russian: "да так, что даже Константин –",
    syllabified: "да так, что да-же Ко-нста-нтин –",
    english: "and so loudly that even Konstantin —",
  },
  {
    id: "s5-c17",
    sentenceId: "s5",
    chunkIndex: 17,
    russian: "зальцбуржский бссперспективняк из-под бронетранспортера",
    syllabified: "за-льцбу-ржский бсспе-рспе-кти-вняк из-под бро-не-тра-нспо-рте-ра",
    english: "that Salzburg no-hoper from under the armored personnel carrier —",
  },
  {
    id: "s5-c18",
    sentenceId: "s5",
    chunkIndex: 18,
    russian: "констатировал: как все колокола не переколоколовать,",
    syllabified: "ко-нста-ти-ро-вал: как все ко-ло-ко-ла не пе-ре-ко-ло-ко-ло-вать,",
    english: "declared: just as you cannot bell all the bells over and over,",
  },
  {
    id: "s5-c19",
    sentenceId: "s5",
    chunkIndex: 19,
    russian: "не перевыколоколовать, так и всех скороговорок не перескороговорить,",
    syllabified: "не пе-ре-вы-ко-ло-ко-ло-вать, так и всех ско-ро-го-во-рок не пе-ре-ско-ро-го-во-рить,",
    english: "nor over-bell them beyond all measure, so too you cannot tongue-twist your way through every tongue twister,",
  },
  {
    id: "s5-c20",
    sentenceId: "s5",
    chunkIndex: 20,
    russian: "не перевыскороговорить; но попытка – не пытка.",
    syllabified: "не пе-ре-вы-ско-ро-го-во-рить; но по-пы-тка – не пы-тка.",
    english: "nor over-twist them; but trying is no torture.",
  },
];

const chunkById = Object.fromEntries(CHUNKS.map((chunk) => [chunk.id, chunk]));
const chunkIndexById = Object.fromEntries(CHUNKS.map((chunk, index) => [chunk.id, index]));
const sentenceById = Object.fromEntries(SENTENCES.map((sentence) => [sentence.id, sentence]));

const elements = {
  currentProgress: document.getElementById("current-progress"),
  currentProgressNote: document.getElementById("current-progress-note"),
  ratedProgress: document.getElementById("rated-progress"),
  weakProgress: document.getElementById("weak-progress"),
  chunkHeading: document.getElementById("chunk-heading"),
  chunkStatePill: document.getElementById("chunk-state-pill"),
  cardCaption: document.getElementById("card-caption"),
  practiceCard: document.getElementById("practice-card"),
  cardBody: document.getElementById("card-body"),
  averageRating: document.getElementById("average-rating"),
  lastRating: document.getElementById("last-rating"),
  attemptCount: document.getElementById("attempt-count"),
  previousButton: document.getElementById("previous-button"),
  nextButton: document.getElementById("next-button"),
  navStatus: document.getElementById("nav-status"),
  ratingRow: document.getElementById("rating-row"),
  focusList: document.getElementById("focus-list"),
  transcriptList: document.getElementById("transcript-list"),
  resetButton: document.getElementById("reset-button"),
  viewButtons: Array.from(document.querySelectorAll("[data-view-mode]")),
};

let state = loadState();
let cardFace = "russian";
let remoteSaveChain = Promise.resolve();

function createChunkProgress() {
  return {
    attempts: 0,
    ratingTotal: 0,
    lastRating: 0,
    lastPracticedAt: 0,
  };
}

function createDefaultState(now = 0) {
  return {
    version: 1,
    createdAt: now,
    updatedAt: now,
    settings: {
      viewMode: "normal",
      currentChunkId: CHUNKS[0].id,
    },
    history: [],
    byChunk: Object.fromEntries(CHUNK_IDS.map((chunkId) => [chunkId, createChunkProgress()])),
  };
}

function numberOr(value, fallback) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function sanitizeHistory(items, fallbackNow = Date.now()) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => ({
      chunkId: CHUNK_ID_SET.has(item?.chunkId) ? item.chunkId : null,
      rating: clamp(numberOr(item?.rating, 0), 1, 5),
      at: Math.max(0, numberOr(item?.at, fallbackNow)),
    }))
    .filter((item) => item.chunkId)
    .slice(-HISTORY_LIMIT);
}

function sanitizeState(parsed, fallbackNow = Date.now()) {
  const base = createDefaultState(fallbackNow);
  if (!parsed || typeof parsed !== "object") {
    return base;
  }

  base.createdAt = Math.max(0, numberOr(parsed.createdAt, base.createdAt));
  base.updatedAt = Math.max(0, numberOr(parsed.updatedAt, base.updatedAt));

  const viewMode = parsed.settings?.viewMode;
  if (VIEW_MODES.has(viewMode)) {
    base.settings.viewMode = viewMode;
  }

  if (CHUNK_ID_SET.has(parsed.settings?.currentChunkId)) {
    base.settings.currentChunkId = parsed.settings.currentChunkId;
  }

  base.history = sanitizeHistory(parsed.history, fallbackNow);

  if (parsed.byChunk && typeof parsed.byChunk === "object") {
    CHUNK_IDS.forEach((chunkId) => {
      const target = base.byChunk[chunkId];
      const source = parsed.byChunk[chunkId];
      target.attempts = Math.max(0, numberOr(source?.attempts, target.attempts));
      target.ratingTotal = Math.max(0, numberOr(source?.ratingTotal, target.ratingTotal));
      target.lastRating = clamp(numberOr(source?.lastRating, target.lastRating), 0, 5);
      target.lastPracticedAt = Math.max(0, numberOr(source?.lastPracticedAt, target.lastPracticedAt));
    });
  }

  return base;
}

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultState(0);
    }
    return sanitizeState(JSON.parse(raw), 0);
  } catch {
    return createDefaultState(0);
  }
}

function persistLocalState() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    return;
  }
}

function cloneStateSnapshot(source) {
  if (typeof structuredClone === "function") {
    return structuredClone(source);
  }

  return JSON.parse(JSON.stringify(source));
}

async function requestRemoteState(method = "GET", payload = null) {
  const response = await window.fetch(REMOTE_PROGRESS_URL, {
    method,
    cache: "no-store",
    credentials: "same-origin",
    keepalive: method === "PUT",
    headers: {
      Accept: "application/json",
      ...(payload ? { "Content-Type": "application/json" } : {}),
    },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  });

  if (!response.ok) {
    throw new Error(`Remote sync failed with status ${response.status}`);
  }

  return response.json();
}

function queueRemoteSave(snapshot = cloneStateSnapshot(state)) {
  if (typeof window.fetch !== "function") {
    return;
  }

  remoteSaveChain = remoteSaveChain
    .catch(() => undefined)
    .then(async () => {
      const remote = sanitizeState(await requestRemoteState("PUT", snapshot));
      if (remote.updatedAt >= state.updatedAt) {
        state = remote;
        persistLocalState();
        render();
      }
    })
    .catch(() => undefined);
}

async function syncStateFromServer() {
  if (typeof window.fetch !== "function") {
    return;
  }

  try {
    const remote = sanitizeState(await requestRemoteState());
    if (remote.updatedAt > state.updatedAt) {
      state = remote;
      persistLocalState();
      render();
      return;
    }

    if (state.updatedAt > remote.updatedAt) {
      queueRemoteSave();
    }
  } catch {
    return;
  }
}

function saveState() {
  state.updatedAt = Date.now();
  persistLocalState();
  queueRemoteSave();
}

function getCurrentChunk() {
  return chunkById[state.settings.currentChunkId] || CHUNKS[0];
}

function getChunkStats(chunkId) {
  return state.byChunk[chunkId] || createChunkProgress();
}

function getAverageRating(stats) {
  return stats.attempts ? stats.ratingTotal / stats.attempts : 0;
}

function getChunkState(stats) {
  if (!stats.attempts) {
    return "new";
  }

  const averageRating = getAverageRating(stats);
  if (stats.lastRating <= 3 || averageRating < 4) {
    return "needs-work";
  }

  return "steady";
}

function getSentenceState(sentence) {
  const allStats = sentence.chunkIds.map((chunkId) => getChunkStats(chunkId));
  const attempts = allStats.reduce((total, stats) => total + stats.attempts, 0);
  if (!attempts) {
    return "new";
  }

  const everySteady = allStats.every((stats) => getChunkState(stats) === "steady");
  return everySteady ? "steady" : "needs-work";
}

function getSentenceAverageRating(sentence) {
  const totals = sentence.chunkIds.reduce(
    (aggregate, chunkId) => {
      const stats = getChunkStats(chunkId);
      aggregate.attempts += stats.attempts;
      aggregate.ratingTotal += stats.ratingTotal;
      return aggregate;
    },
    { attempts: 0, ratingTotal: 0 }
  );

  return totals.attempts ? totals.ratingTotal / totals.attempts : 0;
}

function getStateLabel(stateName) {
  if (stateName === "steady") {
    return "Steady";
  }
  if (stateName === "needs-work") {
    return "Needs work";
  }
  return "New";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const TEXT_TOKEN_PATTERN = /[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*|\s+|[^\s\p{L}\p{N}]/gu;
const WORD_TOKEN_PATTERN = /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u;

function buildWordStyledText(text, tone = "normal") {
  const tokens = String(text).match(TEXT_TOKEN_PATTERN) ?? [String(text)];
  let wordIndex = 0;

  return tokens
    .map((token) => {
      if (/^\s+$/u.test(token)) {
        return token;
      }

      if (WORD_TOKEN_PATTERN.test(token)) {
        const toneIndex = wordIndex % 3;
        wordIndex += 1;
        return `<span class="word-token word-tone-${toneIndex} is-${tone}">${escapeHtml(token)}</span>`;
      }

      return `<span class="word-punctuation">${escapeHtml(token)}</span>`;
    })
    .join("");
}

function formatAverage(value) {
  return value ? `${value.toFixed(1)} / 5` : "--";
}

function formatLastRating(value) {
  return value ? `${value} / 5` : "--";
}

function describeRecency(timestamp) {
  if (!timestamp) {
    return "Never rated";
  }

  const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if (diffMinutes < 1) {
    return "Just now";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

function buildRussianCardHtml(chunk) {
  if (state.settings.viewMode === "syllables") {
    return `<p class="card-line is-syllables-only">${buildWordStyledText(chunk.syllabified, "syllables")}</p>`;
  }

  if (state.settings.viewMode === "both") {
    return `
      <p class="card-line">${buildWordStyledText(chunk.russian, "normal")}</p>
      <p class="assist-line">${buildWordStyledText(chunk.syllabified, "assist")}</p>
    `;
  }

  return `<p class="card-line">${buildWordStyledText(chunk.russian, "normal")}</p>`;
}

function getChunkHeading(chunk) {
  const sentence = sentenceById[chunk.sentenceId];
  return `${sentence.label} · ${chunk.chunkIndex}/${sentence.chunkIds.length}`;
}

function selectChunk(chunkId) {
  if (!CHUNK_ID_SET.has(chunkId) || state.settings.currentChunkId === chunkId) {
    return;
  }

  state.settings.currentChunkId = chunkId;
  cardFace = "russian";
  saveState();
  render();
}

function moveChunk(delta) {
  const currentIndex = chunkIndexById[state.settings.currentChunkId] ?? 0;
  const nextIndex = clamp(currentIndex + delta, 0, CHUNKS.length - 1);
  if (nextIndex === currentIndex) {
    return;
  }

  selectChunk(CHUNKS[nextIndex].id);
}

function toggleCardFace() {
  cardFace = cardFace === "russian" ? "english" : "russian";
  renderPractice();
}

function setViewMode(mode) {
  if (!VIEW_MODES.has(mode) || mode === state.settings.viewMode) {
    return;
  }

  state.settings.viewMode = mode;
  saveState();
  render();
}

function applyRating(rating) {
  const normalizedRating = clamp(numberOr(rating, 0), 1, 5);
  const chunkId = state.settings.currentChunkId;
  const stats = getChunkStats(chunkId);
  const now = Date.now();

  stats.attempts += 1;
  stats.ratingTotal += normalizedRating;
  stats.lastRating = normalizedRating;
  stats.lastPracticedAt = now;

  state.history.push({
    chunkId,
    rating: normalizedRating,
    at: now,
  });
  state.history = state.history.slice(-HISTORY_LIMIT);

  saveState();
  render();
}

function resetProgress() {
  const confirmed = window.confirm("Reset all pronunciation progress on this device and sync the reset?");
  if (!confirmed) {
    return;
  }

  state = createDefaultState(Date.now());
  cardFace = "russian";
  saveState();
  render();
}

function renderProgress() {
  const currentChunk = getCurrentChunk();
  const currentIndex = chunkIndexById[currentChunk.id] + 1;
  const ratedCount = CHUNKS.filter((chunk) => getChunkStats(chunk.id).attempts > 0).length;
  const weakCount = CHUNKS.filter((chunk) => getChunkState(getChunkStats(chunk.id)) === "needs-work").length;
  const sentence = sentenceById[currentChunk.sentenceId];

  elements.currentProgress.textContent = `${currentIndex} / ${CHUNKS.length}`;
  elements.currentProgressNote.textContent = `${sentence.label} · chunk ${currentChunk.chunkIndex}`;
  elements.ratedProgress.textContent = `${ratedCount} / ${CHUNKS.length}`;
  elements.weakProgress.textContent = String(weakCount);
}

function renderPractice() {
  const chunk = getCurrentChunk();
  const stats = getChunkStats(chunk.id);
  const averageRating = getAverageRating(stats);
  const chunkState = getChunkState(stats);
  const absoluteIndex = chunkIndexById[chunk.id] + 1;

  elements.chunkHeading.textContent = getChunkHeading(chunk);
  elements.chunkStatePill.className = `state-pill state-${chunkState}`;
  elements.chunkStatePill.textContent = getStateLabel(chunkState);
  elements.averageRating.textContent = formatAverage(averageRating);
  elements.lastRating.textContent = formatLastRating(stats.lastRating);
  elements.attemptCount.textContent = String(stats.attempts);
  elements.navStatus.textContent = `Chunk ${absoluteIndex} of ${CHUNKS.length}`;
  elements.previousButton.disabled = absoluteIndex === 1;
  elements.nextButton.disabled = absoluteIndex === CHUNKS.length;

  elements.viewButtons.forEach((button) => {
    const isActive = button.dataset.viewMode === state.settings.viewMode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  elements.practiceCard.classList.toggle("is-english", cardFace === "english");
  elements.cardCaption.textContent =
    cardFace === "english"
      ? "Tap for Russian"
      : state.settings.viewMode === "both"
        ? "Tap for English"
        : "Tap for English";
  elements.cardBody.innerHTML =
    cardFace === "english"
      ? `<p class="english-line">${escapeHtml(chunk.english)}</p>`
      : buildRussianCardHtml(chunk);

  elements.ratingRow.innerHTML = RATING_META.map(({ value, label }) => {
    const isActive = stats.lastRating === value;
    return `
      <button class="rating-button${isActive ? " is-active" : ""}" type="button" data-rating="${value}">
        <span class="rating-number">${value}</span>
        <span class="rating-copy">${label}</span>
      </button>
    `;
  }).join("");
}

function renderFocus() {
  const ranked = CHUNKS.map((chunk) => {
    const stats = getChunkStats(chunk.id);
    const averageRating = getAverageRating(stats);
    const recencyHours = stats.lastPracticedAt ? (Date.now() - stats.lastPracticedAt) / 3600000 : 240;
    const practicedTier = stats.attempts ? 1 : 0;
    const lastGap = stats.attempts ? Math.max(0, 4 - stats.lastRating) : 0;
    const averageGap = stats.attempts ? Math.max(0, 4.2 - averageRating) : 0;
    const staleFactor = stats.attempts ? Math.min(recencyHours, 240) / 24 : 0;
    const newChunkBonus = stats.attempts ? 0 : 32;
    const practicedPriority = stats.attempts ? (lastGap > 0 || averageGap > 0 ? 18 : recencyHours >= 96 ? 8 : 0) : 0;
    const practicedWeakness =
      stats.attempts
        ? lastGap * 28 + averageGap * 18 + staleFactor * (lastGap > 0 || averageGap > 0 ? 6 : 2)
        : 0;
    const fresheningWeight = stats.attempts ? Math.max(0, 3 - stats.attempts) * 3 : 0;
    const weight = newChunkBonus + practicedPriority + practicedWeakness + fresheningWeight;

    return {
      chunk,
      stats,
      weight,
      practicedTier,
      averageRating,
      state: getChunkState(stats),
    };
  })
    .sort(
      (left, right) =>
        right.practicedTier - left.practicedTier ||
        right.weight - left.weight ||
        chunkIndexById[left.chunk.id] - chunkIndexById[right.chunk.id]
    )
    .slice(0, 5);

  elements.focusList.innerHTML = ranked
    .map(({ chunk, stats, averageRating, state: chunkState }) => {
      const sentence = sentenceById[chunk.sentenceId];
      const isCurrent = chunk.id === getCurrentChunk().id;
      const meta = stats.attempts
        ? `${formatAverage(averageRating)} · last ${formatLastRating(stats.lastRating)} · ${describeRecency(stats.lastPracticedAt)}`
        : "New chunk";

      return `
        <button class="focus-item is-${chunkState}${isCurrent ? " is-current" : ""}" type="button" data-chunk-id="${chunk.id}">
          <div class="focus-top">
            <span class="focus-title">${escapeHtml(sentence.label)} · ${chunk.chunkIndex}</span>
            <span class="state-pill state-${chunkState}">${getStateLabel(chunkState)}</span>
          </div>
          <p class="chunk-copy">${escapeHtml(chunk.russian)}</p>
          <span class="focus-meta">${escapeHtml(meta)}</span>
        </button>
      `;
    })
    .join("");
}

function renderTranscript() {
  elements.transcriptList.innerHTML = SENTENCES.map((sentence) => {
    const sentenceState = getSentenceState(sentence);
    const ratedCount = sentence.chunkIds.filter((chunkId) => getChunkStats(chunkId).attempts > 0).length;
    const averageRating = getSentenceAverageRating(sentence);

    const chunksHtml = sentence.chunkIds
      .map((chunkId) => {
        const chunk = chunkById[chunkId];
        const stats = getChunkStats(chunkId);
        const chunkState = getChunkState(stats);
        const scoreCopy = stats.attempts
          ? `${formatAverage(getAverageRating(stats))} · last ${formatLastRating(stats.lastRating)}`
          : "Not rated yet";

        return `
          <button class="transcript-chunk is-${chunkState}${chunkId === getCurrentChunk().id ? " is-current" : ""}" type="button" data-chunk-id="${chunkId}">
            <div class="transcript-top">
              <span class="chunk-index">Chunk ${chunk.chunkIndex}</span>
              <span class="chunk-score">${escapeHtml(scoreCopy)}</span>
            </div>
            <p class="chunk-copy">${escapeHtml(chunk.russian)}</p>
          </button>
        `;
      })
      .join("");

    return `
      <section class="transcript-section is-${sentenceState}">
        <div class="sentence-head">
          <div class="sentence-title-row">
            <span class="sentence-title">${escapeHtml(sentence.label)}</span>
            <span class="state-pill state-${sentenceState}">${getStateLabel(sentenceState)}</span>
          </div>
          <p class="sentence-original">${escapeHtml(sentence.original)}</p>
          <span class="sentence-summary">${ratedCount} / ${sentence.chunkIds.length} rated${averageRating ? ` · ${formatAverage(averageRating)}` : ""}</span>
        </div>
        <div class="sentence-chunks">
          ${chunksHtml}
        </div>
      </section>
    `;
  }).join("");
}

function render() {
  renderProgress();
  renderPractice();
  renderFocus();
  renderTranscript();
}

function attachEvents() {
  elements.practiceCard.addEventListener("click", toggleCardFace);
  elements.previousButton.addEventListener("click", () => moveChunk(-1));
  elements.nextButton.addEventListener("click", () => moveChunk(1));
  elements.resetButton.addEventListener("click", resetProgress);
  elements.viewButtons.forEach((button) => {
    button.addEventListener("click", () => setViewMode(button.dataset.viewMode));
  });
  elements.ratingRow.addEventListener("click", (event) => {
    const button = event.target.closest("[data-rating]");
    if (!button) {
      return;
    }
    applyRating(button.dataset.rating);
  });
  const handleChunkPicker = (event) => {
    const button = event.target.closest("[data-chunk-id]");
    if (!button) {
      return;
    }
    selectChunk(button.dataset.chunkId);
  };
  elements.focusList.addEventListener("click", handleChunkPicker);
  elements.transcriptList.addEventListener("click", handleChunkPicker);
  window.addEventListener("online", () => {
    void syncStateFromServer();
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      void syncStateFromServer();
    }
  });
}

attachEvents();
render();
void syncStateFromServer();
