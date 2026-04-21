const pairs: [string, string][] = [
  ["sun","flower"],["sun","light"],["sun","burn"],["sun","set"],["sun","rise"],["sun","shine"],["sun","roof"],["sun","screen"],["sun","stroke"],["sun","day"],["sun","dial"],["sun","down"],["sun","spot"],["sun","glass"],["sun","beam"],
  ["moon","light"],["moon","shine"],["moon","walk"],["moon","beam"],["moon","lit"],["moon","stone"],
  ["rain","bow"],["rain","coat"],["rain","drop"],["rain","fall"],["rain","storm"],["rain","water"],["rain","forest"],
  ["bed","room"],["bed","rock"],["bed","side"],["bed","time"],["bed","spread"],["bed","bug"],["bed","post"],
  ["fire","work"],["fire","side"],["fire","place"],["fire","arm"],["fire","man"],["fire","fly"],["fire","wood"],["fire","proof"],["fire","truck"],
  ["back","bone"],["back","fire"],["back","ground"],["back","hand"],["back","lash"],["back","log"],["back","pack"],["back","stage"],["back","track"],["back","up"],["back","yard"],["back","door"],["back","drop"],["back","seat"],["back","stair"],["back","stroke"],
  ["book","mark"],["book","worm"],["book","case"],["book","shelf"],["book","store"],["book","end"],["book","keeper"],
  ["foot","ball"],["foot","hold"],["foot","note"],["foot","path"],["foot","print"],["foot","step"],["foot","rest"],["foot","wear"],["foot","hill"],["foot","work"],["foot","bridge"],
  ["door","bell"],["door","knob"],["door","mat"],["door","step"],["door","way"],["door","frame"],
  ["cup","board"],["cup","cake"],
  ["pan","cake"],
  ["board","walk"],["board","room"],["board","game"],
  ["walk","way"],["walk","out"],
  ["side","walk"],["side","line"],["side","step"],["side","track"],["side","show"],["side","kick"],["side","burn"],["side","car"],
  ["key","board"],["key","stone"],["key","note"],["key","hole"],["key","word"],["key","chain"],["key","ring"],
  ["push","back"],["push","over"],["push","up"],["push","pin"],["push","cart"],
  ["pull","over"],["pull","back"],["pull","up"],["pull","out"],
  ["chair","lift"],["chair","man"],["chair","person"],
  ["arm","chair"],["arm","band"],["arm","rest"],["arm","pit"],
  ["over","turn"],["over","board"],["over","time"],["over","coat"],["over","come"],["over","due"],["over","flow"],["over","haul"],["over","head"],["over","lap"],["over","look"],["over","night"],["over","ride"],["over","run"],["over","see"],["over","take"],["over","throw"],
  ["turn","off"],["turn","over"],["turn","pike"],["turn","table"],["turn","key"],["turn","out"],["turn","stile"],["turn","coat"],
  ["lift","off"],
  ["stair","case"],["stair","way"],["stair","lift"],
  ["up","lift"],["up","start"],["up","turn"],["up","keep"],["up","date"],["up","grade"],["up","hill"],["up","hold"],["up","right"],["up","roar"],["up","root"],["up","set"],["up","shot"],["up","side"],["up","stage"],["up","stairs"],["up","stream"],["up","swing"],["up","ward"],
  ["down","hill"],["down","load"],["down","pour"],["down","right"],["down","side"],["down","size"],["down","stairs"],["down","stream"],["down","time"],["down","town"],["down","turn"],["down","ward"],["down","fall"],
  ["count","down"],
  ["come","back"],["come","down"],
  ["home","run"],["home","town"],["home","work"],["home","land"],["home","sick"],["home","made"],["home","coming"],
  ["run","way"],["run","off"],["run","down"],["run","ner"],
  ["snow","ball"],["snow","board"],["snow","fall"],["snow","flake"],["snow","man"],["snow","plow"],["snow","storm"],["snow","drift"],
  ["water","fall"],["water","front"],["water","mark"],["water","proof"],["water","shed"],["water","way"],["water","melon"],["water","color"],
  ["land","mark"],["land","lord"],["land","mine"],["land","scape"],["land","slide"],["land","fall"],
  ["thumb","screw"],["thumb","nail"],["thumb","tack"],["thumb","print"],
  ["screw","ball"],["screw","driver"],
  ["nail","gun"],["nail","bed"],["nail","file"],
  ["gun","fire"],["gun","man"],["gun","point"],["gun","shot"],["gun","powder"],["gun","boat"],["gun","smith"],
  ["shot","gun"],["shot","glass"],
  ["hand","shake"],["hand","bag"],["hand","book"],["hand","cuff"],["hand","ful"],["hand","gun"],["hand","made"],["hand","out"],["hand","over"],["hand","rail"],["hand","stand"],["hand","writing"],
  ["off","hand"],["off","shore"],["off","spring"],["off","set"],["off","side"],["off","shoot"],
  ["out","break"],["out","come"],["out","door"],["out","fit"],["out","law"],["out","line"],["out","look"],["out","put"],["out","reach"],["out","right"],["out","run"],["out","set"],["out","side"],["out","skirt"],
  ["black","berry"],["black","bird"],["black","board"],["black","list"],["black","mail"],["black","out"],["black","smith"],["black","top"],
  ["blue","bell"],["blue","berry"],["blue","bird"],["blue","print"],["blue","grass"],
  ["gold","fish"],["gold","mine"],["gold","smith"],
  ["sand","box"],["sand","castle"],["sand","storm"],["sand","stone"],["sand","paper"],
  ["star","fish"],["star","light"],["star","dust"],["star","board"],
  ["net","work"],
  ["eye","brow"],["eye","lash"],["eye","lid"],["eye","sight"],["eye","witness"],
  ["honey","bee"],["honey","comb"],["honey","moon"],["honey","dew"],
  ["bee","hive"],["bee","line"],
  ["spring","board"],["spring","time"],
  ["time","line"],["time","out"],["time","table"],["time","stamp"],["time","piece"],
  ["ground","work"],["ground","break"],["ground","floor"],
  ["horse","back"],["horse","power"],["horse","play"],["horse","shoe"],["horse","fly"],["horse","tail"],
  ["sea","horse"],["sea","shell"],["sea","shore"],["sea","weed"],["sea","food"],["sea","side"],
  ["eye","drop"],["tear","drop"],["drop","kick"],["drop","out"],["drop","down"],
  ["head","band"],["head","line"],["head","light"],["head","phone"],["head","quarter"],
  ["work","bench"],["work","book"],["work","day"],["work","force"],["work","horse"],["work","load"],["work","man"],["work","out"],["work","place"],["work","room"],["work","shop"],
  ["high","light"],["high","land"],["high","rise"],["high","way"],["high","chair"],["high","jack"],
  ["low","land"],["low","life"],
  ["pot","luck"],["pot","hole"],
  ["finger","nail"],["finger","print"],["finger","tip"],
  ["day","break"],["day","dream"],["day","light"],["day","time"],
  ["night","cap"],["night","fall"],["night","gown"],["night","club"],["night","shift"],["night","mare"],
  ["shoe","horn"],["shoe","lace"],["shoe","maker"],["shoe","string"],
  ["hay","stack"],["hay","wire"],
  ["corn","field"],["corn","flour"],["corn","meal"],["corn","starch"],
  ["cow","boy"],["cow","girl"],["cow","hide"],
  ["cat","fish"],["cat","nap"],["cat","walk"],
  ["dog","house"],["dog","wood"],["dog","ear"],
  ["car","pool"],["car","port"],["car","pet"],["car","jack"],["car","go"],
  ["air","craft"],["air","line"],["air","port"],["air","ship"],["air","tight"],["air","way"],["air","field"],
  ["wind","mill"],["wind","shield"],["wind","pipe"],["wind","fall"],["wind","break"],
  ["earth","quake"],["earth","worm"],
  ["birth","day"],["birth","place"],["birth","mark"],["birth","right"],
  ["life","boat"],["life","guard"],["life","line"],["life","time"],["life","style"],
  ["light","house"],["light","weight"],["light","ning"],["light","year"],["light","bulb"],
  ["lime","stone"],["lime","light"],
  ["stone","wall"],["stone","mason"],["stone","work"],
  ["wall","flower"],["wall","paper"],
  ["flower","bed"],["flower","pot"],
  ["rock","bottom"],["rock","slide"],["rock","star"],
  ["butter","cup"],["butter","fly"],["butter","milk"],["butter","scotch"],["butter","finger"],
  ["milk","man"],["milk","shake"],["milk","maid"],
  ["ink","well"],["ink","blot"],
  ["well","spring"],["well","fare"],["fare","well"],
  ["camp","fire"],["camp","ground"],["camp","site"],
  ["ice","berg"],["ice","cap"],["ice","cream"],
  ["cream","cheese"],
  ["cheese","cake"],["cheese","burger"],
  ["ham","burger"],["ham","string"],["ham","mock"],
  ["mock","bird"],["mock","up"],
  ["bridge","work"],
  ["draw","back"],["draw","bridge"],["draw","string"],
  ["string","bean"],
  ["bean","stalk"],
  ["pine","apple"],["pine","cone"],["pine","tree"],
  ["apple","sauce"],["apple","seed"],
  ["basket","ball"],
  ["base","ball"],["base","board"],["base","line"],["base","ment"],
  ["play","ground"],["play","mate"],["play","off"],["play","thing"],["play","wright"],["play","pen"],
  ["pen","knife"],["pen","name"],
  ["name","sake"],["name","plate"],["name","tag"],
  ["tail","gate"],["tail","bone"],["tail","coat"],["tail","spin"],["tail","pipe"],["tail","light"],["tail","wind"],
  ["wind","screen"],["wind","surf"],
  ["screen","play"],["screen","shot"],["screen","save"],
  ["cross","bow"],["cross","road"],["cross","word"],["cross","bar"],["cross","fire"],["cross","walk"],
  ["road","block"],["road","side"],["road","map"],["road","runner"],["road","way"],["road","kill"],
  ["news","paper"],["news","room"],["news","cast"],["news","flash"],["news","stand"],
  ["grand","father"],["grand","mother"],["grand","child"],["grand","stand"],["grand","son"],
  ["father","land"],["father","hood"],
  ["mother","hood"],["mother","land"],["mother","board"],
  ["child","hood"],["child","proof"],
  ["hard","ball"],["hard","board"],["hard","copy"],["hard","core"],["hard","ship"],["hard","ware"],["hard","wood"],
  ["soft","ball"],["soft","ware"],["soft","wood"],["soft","back"],
  ["worm","hole"],["worm","wood"],
  ["hole","punch"],["hole","sale"],
  ["short","cut"],["short","hand"],["short","cake"],["short","list"],["short","stop"],["short","sight"],
  ["long","bow"],["long","horn"],["long","shot"],["long","term"],
  ["hot","dog"],["hot","bed"],["hot","cake"],["hot","head"],["hot","house"],["hot","line"],["hot","pot"],["hot","rod"],["hot","shot"],["hot","spot"],
  ["cold","blood"],["cold","shoulder"],["cold","front"],["cold","snap"],["cold","cut"],
  ["blood","hound"],["blood","line"],["blood","bath"],["blood","stream"],["blood","stain"],["blood","stone"],["blood","shed"],
  ["dry","clean"],["dry","dock"],["dry","wall"],
  ["wet","land"],["wet","suit"],
];

const adj = new Map<string, Set<string>>();
for (const [a, b] of pairs) {
  if (!adj.has(a)) adj.set(a, new Set());
  if (!adj.has(b)) adj.set(b, new Set());
  adj.get(a)!.add(b);
  adj.get(b)!.add(a);
}

const gridAdj: [number, number][] = [
  [0, 1], [1, 2],
  [3, 4], [4, 5],
  [6, 7], [7, 8],
  [0, 3], [3, 6],
  [1, 4], [4, 7],
  [2, 5], [5, 8],
];

function degree(word: string): number {
  return adj.get(word)?.size ?? 0;
}

function canUse(word: string): boolean {
  return degree(word) <= 12;
}

function isAdj(a: string, b: string): boolean {
  return adj.get(a)?.has(b) ?? false;
}

const allWords = [...adj.keys()].filter(canUse);
const seen = new Set<string>();
let found = 0;

for (const center of allWords) {
  const neighbors = [...(adj.get(center) ?? [])].filter(canUse);
  if (neighbors.length < 4 || neighbors.length > 6) continue;

  for (const p1 of neighbors) {
    for (const p3 of neighbors) {
      if (p3 === p1) continue;
      for (const p5 of neighbors) {
        if (p5 === p1 || p5 === p3) continue;
        for (const p7 of neighbors) {
          if (p7 === p1 || p7 === p3 || p7 === p5) continue;

          const cands0 = [...(adj.get(p1) ?? [])].filter((word) => canUse(word) && word !== center && word !== p1 && word !== p3 && word !== p5 && word !== p7 && isAdj(word, p3));
          const cands2 = [...(adj.get(p1) ?? [])].filter((word) => canUse(word) && word !== center && word !== p1 && word !== p3 && word !== p5 && word !== p7 && isAdj(word, p5));
          const cands6 = [...(adj.get(p3) ?? [])].filter((word) => canUse(word) && word !== center && word !== p1 && word !== p3 && word !== p5 && word !== p7 && isAdj(word, p7));
          const cands8 = [...(adj.get(p5) ?? [])].filter((word) => canUse(word) && word !== center && word !== p1 && word !== p3 && word !== p5 && word !== p7 && isAdj(word, p7));

          for (const p0 of cands0) {
            for (const p2 of cands2) {
              if (new Set([p0, p2, center, p1, p3, p5, p7]).size !== 7) continue;
              for (const p6 of cands6) {
                if (new Set([p0, p2, p6, center, p1, p3, p5, p7]).size !== 8) continue;
                for (const p8 of cands8) {
                  const grid = [p0, p1, p2, p3, center, p5, p6, p7, p8];
                  if (new Set(grid).size !== 9) continue;
                  if (!gridAdj.every(([a, b]) => isAdj(grid[a], grid[b]))) continue;
                  const key = [...grid].sort().join(",");
                  if (seen.has(key)) continue;
                  seen.add(key);
                  found += 1;
                  console.log(grid.join(" "));
                  if (found >= 120) process.exit(0);
                }
              }
            }
          }
        }
      }
    }
  }
}