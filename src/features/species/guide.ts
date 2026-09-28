import type {SpeciesId} from './catalog';

type SpeciesGuide={traits:[string,string,string];note:string;source:string;sourceName:string};
const source=(slug:string)=>({source:`https://svampguiden.com/sv/art/${slug}`,sourceName:'Svampguiden'});

export const speciesGuide:Record<SpeciesId,SpeciesGuide>={
  kantarell:{
    traits:['Gul hatt och fot; hattkanten blir ofta vågig.','Undersidan har förgrenade, trubbiga åsar som fortsätter ner längs foten.','Inuti är köttet ljust gulvitt. Doften brukar vara fruktig.'],
    note:'Jämför med narrkantarell: den har täta, tunna skivor i stället för kantarellens åsar.',
    ...source('3213-chanterelle'),
  },
  trattkantarell:{
    traits:['En tunn brunaktig hatt med fördjupning eller tratt i mitten.','Förgrenade åsar under hatten, med färg från gult till grått.','Den gulaktiga foten är ihålig.'],
    note:'Rödgul trumpetsvamp har betydligt svagare åsar. Kontrollera varje exemplar; andra arter kan växa tätt intill.',
    ...source('3217-trattkantarell'),
  },
  'svart-trumpetsvamp':{
    traits:['Tunnväggig och ihålig, med form som en öppen trumpet.','Mörk ovansida som kan bli gråbrun när svampen torkar.','Utsidan är gråaktig och slät eller svagt rynkad, utan tydliga åsar.'],
    note:'Grå kantarell kan likna arten men har tydligt förgrenade åsar.',
    ...source('3772-svart-trumpetsvamp'),
  },
  stensopp:{
    traits:['Brun, välvd hatt; kanten har ofta en smal ljus rand.','Porerna på undersidan är först ljusa, senare gula till gulgröna.','Den kraftiga foten har ett ljust nätmönster, tydligast nära hatten.'],
    note:'Kallas också karljohan. Gallsopp är en viktig förväxlingsart och har mörkare nätmönster på foten.',
    ...source('245630-karljohan'),
  },
  'blek-taggsvamp':{
    traits:['Matt hatt i vita till blekt beige toner.','Undersidan har sköra taggar som fortsätter en bit ner på foten.','Foten är ljus och kan sitta lite vid sidan av hattens mitt.'],
    note:'Namnet används även för flera svårskilda Hydnum-arter. Rödgul taggsvamp är oftast spensligare och dess taggar löper inte ner på foten.',
    ...source('4370-blek-taggsvamp'),
  },
  'rodgul-trumpetsvamp':{
    traits:['Brunaktig, tunn tratthatt med små fjäll och krusig kant.','Undersidan är gul till orange, med svaga rynkor snarare än kraftiga åsar.','Foten är ihålig och ofta tydligt gulorange.'],
    note:'Jämför undersidan med trattkantarell, vars förgrenade åsar är mer framträdande.',
    ...source('3215-rodgul-trumpetsvamp'),
  },
  smorsopp:{
    traits:['Brunaktig hatt som blir mycket slemmig när den är våt.','Gulaktiga porer under hatten; unga exemplar har en hinna över dem.','Foten har en tydlig ring som mörknar med åldern och ibland försvinner.'],
    note:'Grynsopp liknar arten men saknar ring. Titta på flera kännetecken tillsammans, särskilt på äldre exemplar.',
    ...source('6088-smorsopp'),
  },
  farticka:{
    traits:['Ljus hatt som med åldern kan bli gråbrun och spricka upp.','Undersidan har små porer och kan få citrongula fläckar.','Det ljusa köttet kan ha gul till gröngul ton.'],
    note:'Förväxlas bland annat med brödticka och lammtickor. Blek taggsvamp har taggar på undersidan, inte porer.',
    ...source('2959-farticka'),
  },
  'rod-flugsvamp':{
    traits:['Röd till orange hatt, vanligen med ljusa vårtlika rester av höljet.','Vita skivor under hatten och en ljus ring på foten.','Foten har en förtjockad bas med kransar av fjäll.'],
    note:'Giftig – här som fotomotiv. De vita resterna på hatten kan sköljas bort av regn.',
    ...source('2976-rod-flugsvamp'),
  },
  toppslatskivling:{
    traits:['Liten klocklik hatt, ofta med en tydlig spets på toppen.','Skivorna mörknar mot violettsvart när sporerna mognar.','Foten är tunn och fiberrik, ofta böjd eller vågig.'],
    note:'Endast för observation och fotografi. Innehåller psilocybin och ska inte ätas; små skivlingar kan vara mycket svåra att skilja åt.',
    source:'https://www.first-nature.com/fungi/psilocybe-semilanceata.php',sourceName:'First Nature',
  },
};
