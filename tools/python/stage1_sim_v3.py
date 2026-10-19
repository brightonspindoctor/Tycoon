"""
Stage 1 simulator, v3: the rules as agreed on 19 Oct.

Core: $10 Capital (HP), Bank Debt -$2 each turn, 2 AP, draw 5, gold = score.
Prospect (2 AP): +2 plots (max 5) and 2 Well cards to hand. Build a Well: 1 AP, 1 oil/turn.
Storage 3 oil (overflow lost). Sell oil: 1 AP, all of it, at price minus freight. Sell a Well: 1 AP, +$5.
Unsold oil is lost when a round ends (ASSUME). Wells and plots last the whole stage.
Enemies have Hold; cards deal damage by family (weak x2, resists x0.5 rounded down).
Fire is a hazard: burns oil = intensity (1-3) at end of turn, else the highest Well; pumps stop.
Skim rate per round: R1 $1, R2 $2, R3 $3, boss $4 per gold.
ASSUME: a round lasting over 25 turns is a loss; bots are simple rule-followers.
"""
import random, json
from collections import Counter

CARDS = {  # name: (ap, $cost, uses, family, power, shop price)
    'Prospect':        (2, 0, None, 'prod', 0, 3),
    'Hired Hand':      (1, 0, None, 'Muscle', 2, 3),
    'Lawyer Up':       (1, 2, None, 'Legal', 4, 4),
    'Shore Up':        (1, 0, None, 'Fix', 3, 3),
    'Bucket of Water': (1, 0, 2, 'water', 1, None),
    'Improve Gear':    (1, 1, None, 'cover', 3, None),
    'Hard Graft':      (0, 0, 1, 'ap', 1, None),
    'Petty Cash':      (0, 0, 3, 'skim', 1, None),
    'Fire Brigade':    (1, 0, None, 'water', 3, 4),
    'Pay Wages':       (1, 2, None, 'Wages', 3, 3),
    'Dynamite':        (1, 0, 1, 'Dirty', 6, 5),
    'Bribe the Sheriff': (1, 3, None, 'Dirty', 3, 5),
    'Wildcat Well':    (1, 0, None, 'wildcat', 2, 6),
    'Loose Thread':    (1, 1, None, 'junk', 0, None),
    'Bad Blood':       (None, 0, None, 'junk', 0, None),
}
SHOP_POOL = ['Hired Hand', 'Lawyer Up', 'Shore Up', 'Fire Brigade', 'Pay Wages', 'Dynamite',
             'Bribe the Sheriff', 'Wildcat Well']
ITEMS = {'Storage Tank': 4, 'Silo': 7, 'Steam Pump': 10, 'Lookout': 5}
STARTER = ['Prospect', 'Hired Hand', 'Hired Hand', 'Lawyer Up', 'Shore Up', 'Bucket of Water',
           'Bucket of Water', 'Improve Gear', 'Improve Gear', 'Hard Graft']
BONUSES = ['Extra Prospect', '3 Oil', 'Petty Cash', 'Gear + Graft']
R1 = ['Blowout', 'Strike', 'Bank Inspector', 'Railroad Agent']
ALL = R1 + ['Claim Jumper', 'Speculator']
MODS = ['Dry Season', 'Glut', 'Hard Rock', 'Bank Squeeze', 'Bad Weather', 'Boomtown']
HOLD = {'Blowout': 5, 'Strike': 8, 'Bank Inspector': 6, 'Railroad Agent': 7, 'Claim Jumper': 6,
        'Speculator': 6, 'Baron': 20}
WEAK = {'Blowout': 'Fix', 'Strike': 'Muscle', 'Bank Inspector': 'Legal', 'Railroad Agent': 'Legal',
        'Claim Jumper': 'Muscle', 'Speculator': 'Legal', 'Baron': 'Dirty'}
RESIST = {'Blowout': 'Muscle', 'Strike': 'Legal', 'Railroad Agent': 'Muscle', 'Claim Jumper': 'Legal',
          'Speculator': 'Muscle', 'Baron': 'Legal'}
CYCLE = {'Blowout': ['Rumble', 'Spray', 'Blow'], 'Strike': ['Picket', 'Sabotage'],
         'Bank Inspector': ['Audit', 'Fine'], 'Railroad Agent': ['Raise Rates', 'Refuse'],
         'Claim Jumper': ['Jump', 'Scout'], 'Speculator': ['Short', 'Margin Call', 'Rumours'],
         'Baron': ['Sabotage', 'Lease', 'Arson']}
FIRST = {'Strike': 'Walkout', 'Claim Jumper': 'Scout', 'Baron': 'Arson1'}
SKIM_RATE = {1: 1, 2: 2, 3: 3, 4: 4}
CFG = dict(start_cap=10, oil_carry=False, smart=False, debt_from_round=1, price=2, debt=2, well=1)


class Lose(Exception):
    def __init__(self, why): self.why = why


class Card:
    __slots__ = ('name', 'uses')
    def __init__(self, n): self.name, self.uses = n, CARDS[n][2]


def damage(fam, power, threat):
    if fam == 'Wages':
        return power if threat == 'Strike' else 0
    if fam == 'Muscle' and threat == 'Bank Inspector':
        return 0
    if WEAK.get(threat) == fam: return power * 2
    if RESIST.get(threat) == fam: return power // 2
    return power


class Game:
    def __init__(self, s, bonus, rng):
        self.s, self.rng = s, rng
        self.deck = [Card(n) for n in STARTER]
        self.cap, self.gold = CFG['start_cap'], 0
        self.carry_oil = 0
        self.debt = CFG['debt']
        self.items = set()
        self.plots = []                # list of well outputs or None; len = claimed plots
        self.storage = 3
        self.start_oil = 0
        self.destroy_cost, self.prospect_price = 3, 3
        self.stats = Counter()
        if bonus == 'Extra Prospect': self.deck.append(Card('Prospect'))
        if bonus == '3 Oil': self.start_oil = 3
        if bonus == 'Petty Cash': self.deck.append(Card('Petty Cash'))
        if bonus == 'Gear + Graft': self.deck += [Card('Improve Gear'), Card('Hard Graft')]
        self.round = 0

    # ---------------------------------------------------------------- shop
    def spend(self, amt, reserve):
        if self.cap - amt >= reserve:
            self.cap -= amt; return True
        return False

    def skim(self, gold_amt):
        rate = SKIM_RATE[max(1, self.round)]
        for _ in range(gold_amt):
            if self.cap - rate < 1: break
            self.cap -= rate; self.gold += 1; self.stats['skims'] += 1

    def shop(self, first=False):
        s, rng = self.s, self.rng
        row = rng.sample(SHOP_POOL, 3)
        item = rng.choice([i for i in ITEMS if i not in self.items or i == 'Storage Tank'])
        reserve = s['pre_reserve'] if first else s['reserve']
        if s['name'] == 'Random':
            for x in row + [item, 'Prospect']:
                if rng.random() < 0.35:
                    price = ITEMS.get(x) or (self.prospect_price if x == 'Prospect' else CARDS[x][5])
                    if self.spend(price, 3): self.add(x)
            if not first and rng.random() < 0.5: self.skim(rng.randint(0, 2))
            return
        # destroy junk first
        junk = next((c for c in self.deck if c.name in ('Bad Blood', 'Loose Thread')), None)
        if junk and self.spend(self.destroy_cost, reserve - 2):
            self.deck.remove(junk); self.destroy_cost += 1; self.stats['destroyed'] += 1
        if len(self.plots) < 5 and s['prospect'] and sum(c.name == 'Prospect' for c in self.deck) < 1:
            if self.spend(self.prospect_price, reserve):
                self.add('Prospect'); self.prospect_price += 1
        for want in s['buys']:
            if want in row or want == item:
                if want in ('Dynamite', 'Bribe the Sheriff') and not s['dirty']: continue
                price = ITEMS.get(want) or CARDS[want][5]
                if self.spend(price, reserve):
                    self.add(want)
                    if want in row: row.remove(want)
        if not first and s['skim_shop'] and self.cap > s['skim_keep']:
            rate = SKIM_RATE[self.round]
            self.skim((self.cap - s['skim_keep']) // rate)

    def add(self, x):
        if x in ITEMS:
            self.items.add(x)
            if x == 'Storage Tank': self.storage += 2
            if x == 'Silo': self.storage += 4
        else:
            self.deck.append(Card(x))

    # --------------------------------------------------------------- round
    def play_round(self, rnd):
        rng, s = self.rng, self.s
        self.round = rnd
        mod = None
        if rnd == 1: names = [rng.choice(R1)]
        elif rnd == 2: names = [rng.choice(ALL)]; mod = rng.choice(MODS)
        elif rnd == 3: names = rng.sample(ALL, 2)
        else: names = ['Baron']
        self.desc = (names, mod)
        th = [dict(name=n, hold=HOLD[n], step=0, cycle=0) for n in names]
        if rnd == 3:
            for t in th:
                if t['name'] == 'Strike': t['r3'] = True
                if t['name'] == 'Speculator': t['r3'] = True
        draw = self.deck[:]; rng.shuffle(draw)
        disc, hand = [], []
        well_cards, ious = 0, 0
        oil = self.start_oil if rnd == 1 else (self.carry_oil if CFG['oil_carry'] else 0)
        fire = 0
        unstable, marked = None, None   # plot indexes
        short, freight = 0, 0
        nxt = Counter()
        firebreak = False
        fire_bonus = 1 if mod == 'Dry Season' else 0

        def start_fire(n):
            nonlocal fire
            fire = min(3, (fire + 1) if fire else n + fire_bonus)
            self.stats['fires'] += 1

        def highest_well():
            for i in range(len(self.plots) - 1, -1, -1):
                if self.plots[i] is not None: return i
            return None

        # opening moves
        for t in th:
            op = FIRST.get(t['name'])
            if not op or 'Lookout' in self.items: continue
            if op == 'Walkout': nxt['ap'] += 1
            if op == 'Scout': marked = highest_well()
            if op == 'Arson1': start_fire(1)
        turn = 0
        while True:
            turn += 1
            if turn > 25: raise Lose('stalemate')
            cur, nxt = nxt, Counter()
            debt = (self.debt + (mod == 'Bank Squeeze') + (mod == 'Boomtown')) if rnd >= CFG['debt_from_round'] else 0
            self.cap -= debt * (2 if cur['audit'] else 1)
            self.cap -= ious
            if self.cap <= 0: raise Lose('debt')
            if not fire:
                prod = sum(w for i, w in enumerate(self.plots) if w is not None and i != unstable)
                oil = min(self.storage, oil + prod)
            n = 5 - (mod == 'Bad Weather')
            for _ in range(n):
                if not draw: draw, disc = disc, []; rng.shuffle(draw)
                if draw: hand.append(draw.pop())
            ap = 2 + ('Steam Pump' in self.items) - cur['ap']
            price = max(0, CFG['price'] - (mod == 'Glut') + (mod == 'Boomtown') - short)
            can_sell = not cur['refuse']
            cover = 0
            # forced cards
            for c in [c for c in hand if c.name == 'Loose Thread']:
                ap -= 1; self.cap -= 1; hand.remove(c); disc.append(c)
            if cur['margin']:
                for _ in range(cur['margin']): ap -= 1; self.cap -= 2
            if self.cap <= 0: raise Lose('debt')

            def has(nm): return next((c for c in hand if c.name == nm), None)

            def use(c):
                hand.remove(c)
                if c.uses is not None:
                    c.uses -= 1
                    if c.uses <= 0:
                        if c in self.deck: self.deck.remove(c)
                        return
                disc.append(c)

            def best_target(fam, power):
                live = [t for t in th if t['hold'] > 0]
                if not live: return None, 0
                t = max(live, key=lambda t: (damage(fam, power, t['name']), -t['hold']))
                return t, damage(fam, power, t['name'])

            def hit(t, d, fam):
                t['hold'] -= d
                if fam == 'Muscle' and t['name'] == 'Strike':
                    self.deck.append(Card('Bad Blood')); self.stats['bad_blood'] += 1
                if fam == 'Dirty':
                    self.deck.append(Card('Bad Blood')); self.stats['bad_blood'] += 1

            for _ in range(30):
                if ap <= 0:
                    hg = has('Hard Graft')
                    if hg and hand and any(CARDS[c.name][0] == 1 for c in hand if c.name != 'Hard Graft'):
                        use(hg); ap += 1; continue
                    break
                # douse fire
                water = has('Fire Brigade') or has('Bucket of Water')
                if fire and water:
                    fire = max(0, fire - CARDS[water.name][4]); use(water); ap -= 1; continue
                if CFG['smart']:
                    killed = False
                    for nm in ('Lawyer Up', 'Shore Up', 'Pay Wages', 'Hired Hand', 'Bribe the Sheriff', 'Dynamite'):
                        c = has(nm)
                        if not c: continue
                        fam, pw, cost = CARDS[nm][3], CARDS[nm][4], CARDS[nm][1]
                        if not s['dirty'] and fam == 'Dirty': continue
                        t, d = best_target(fam, pw)
                        if t and d >= t['hold'] and self.cap - cost > 1:
                            self.cap -= cost; hit(t, d, fam); use(c); ap -= 1; killed = True; break
                    if killed: continue
                # sell early when cash is short or the stockpile is nearly full
                if CFG['smart'] and oil > 0 and can_sell and price - freight > 0 and (self.cap <= 6 or oil >= self.storage - 1):
                    self.cap += oil * (price - freight); self.stats['oil'] += oil; oil = 0; ap -= 1; continue
                # prospect when out of plots to build on
                free = sum(1 for p in self.plots if p is None)
                pr = has('Prospect')
                p_cost = 2 + (mod == 'Hard Rock')
                if pr and ap >= p_cost and len(self.plots) < 5 and free + well_cards < 1:
                    add = min(2, 5 - len(self.plots))
                    self.plots += [None] * add; well_cards += 2
                    use(pr); ap -= p_cost; self.stats['prospects'] += 1; continue
                # build
                ww = has('Wildcat Well')
                if free and (well_cards or ww):
                    i = self.plots.index(None)
                    if ww: self.plots[i] = 2; use(ww)
                    else: self.plots[i] = CFG['well']; well_cards -= 1
                    ap -= 1; continue
                # attack (clean bots skip dirty)
                played = False
                for nm in ('Dynamite', 'Bribe the Sheriff', 'Lawyer Up', 'Shore Up', 'Pay Wages', 'Hired Hand'):
                    c = has(nm)
                    if not c: continue
                    fam, pw, cost = CARDS[nm][3], CARDS[nm][4], CARDS[nm][1]
                    t, d = best_target(fam, pw)
                    if t and d > 0 and self.cap - cost > 1:
                        self.cap -= cost; hit(t, d, fam); use(c); ap -= 1; played = True; break
                if played: continue
                # cap an unstable well against a blowout about to blow
                bo = next((t for t in th if t['name'] == 'Blowout' and t['hold'] > 0), None)
                if bo and unstable is not None and CYCLE['Blowout'][bo['step'] % 3] == 'Blow':
                    self.plots[unstable] = None; unstable = None; bo['hold'] -= 3; ap -= 1; continue
                # sell the marked well before a jump
                cj = next((t for t in th if t['name'] == 'Claim Jumper' and t['hold'] > 0), None)
                if cj and marked is not None and self.plots[marked] is not None and CYCLE['Claim Jumper'][cj['step'] % 2] == 'Jump' and s['strip']:
                    self.plots[marked] = None; self.cap += 5; marked = None; ap -= 1; continue
                # sell oil
                if oil > 0 and can_sell:
                    self.cap += oil * max(0, price - freight); self.stats['oil'] += oil
                    oil = 0; ap -= 1; continue
                pc = has('Petty Cash')
                if pc and s['petty'] and self.cap > s['petty_keep']:
                    self.skim(1); use(pc); continue
                ig = has('Improve Gear')
                incoming = sum(1 for t in th if t['hold'] > 0 and (
                    CYCLE[t['name']][t['step'] % len(CYCLE[t['name']])] in ('Fine', 'Spray')))
                if ig and incoming and self.cap > 2:
                    use(ig); ap -= 1; self.cap -= 1; cover += 3; continue
                break
            # passive & wins
            for t in th:
                if t['name'] == 'Bank Inspector' and t['hold'] > 0 and self.cap >= 12: t['hold'] -= 2
            for t in [t for t in th if t['hold'] <= 0 and not t.get('done')]:
                t['done'] = True
                if t['name'] == 'Bank Inspector': self.deck += [Card('Loose Thread'), Card('Loose Thread')]
                if t['name'] == 'Claim Jumper': start_fire(2)
                if t['name'] == 'Blowout': oil = min(self.storage, oil + 3)
                if t['name'] == 'Speculator': short = 0
                if t['name'] == 'Railroad Agent': freight = 0
            bad_in_hand = sum(c.name == 'Bad Blood' for c in hand)
            disc.extend(hand); hand = []
            if all(t['hold'] <= 0 for t in th):
                self.carry_oil = oil
                return turn
            # fire burns
            if fire:
                if oil > 0: oil = max(0, oil - fire)
                else:
                    i = highest_well()
                    if i is None: fire = 0
                    else:
                        self.plots[i] = None; self.stats['burnt'] += 1
                        if unstable == i: unstable = None
            # threats act
            dmg = 0
            for t in th:
                if t['hold'] <= 0: continue
                seq = CYCLE[t['name']] + (['Torch'] if t['name'] == 'Strike' and t.get('r3') else []) \
                      + (['Paper'] if t['name'] == 'Speculator' and t.get('r3') else [])
                a = seq[t['step'] % len(seq)]; t['step'] += 1
                if t['step'] % len(seq) == 0: t['cycle'] += 1
                c = t['cycle']
                if a == 'Rumble': unstable = highest_well()
                elif a == 'Spray': dmg += 2; oil = max(0, oil - 1)
                elif a == 'Blow':
                    if unstable is not None:
                        self.plots[unstable] = None; t['hold'] += 2; self.stats['blown'] += 1
                    unstable = highest_well()
                elif a == 'Picket': nxt['ap'] += 1
                elif a == 'Sabotage' and t['name'] == 'Strike':
                    real = [x for x in self.deck if CARDS[x.name][3] != 'junk']
                    if real:
                        v = rng.choice(real); self.deck.remove(v)
                        for p in (draw, disc):
                            if v in p: p.remove(v)
                elif a == 'Torch': start_fire(1)
                elif a == 'Audit': nxt['audit'] = 1
                elif a == 'Fine': dmg += 3
                elif a == 'Raise Rates': freight += 1
                elif a == 'Refuse': nxt['refuse'] = 1
                elif a == 'Jump':
                    if marked is not None and self.plots[marked] is not None:
                        self.plots[marked] = None; self.stats['stolen'] += 1
                    marked = None
                elif a == 'Scout': marked = highest_well()
                elif a == 'Short': short += 1
                elif a == 'Margin Call': nxt['margin'] += 1
                elif a == 'Rumours':
                    bb = Card('Bad Blood'); self.deck.append(bb); draw.append(bb)
                elif a == 'Paper': ious += 1
                elif a == 'Sabotage':   # Baron
                    for _ in range(1 + c):
                        i = highest_well()
                        if i is not None: self.plots[i] = None; self.stats['baron_wells'] += 1
                elif a == 'Lease':
                    costly = sorted([x for x in self.deck if CARDS[x.name][0]], key=lambda x: -CARDS[x.name][0])
                    if costly:
                        v = costly[0]; self.deck.remove(v)
                        for p in (draw, disc):
                            if v in p: p.remove(v)
                elif a == 'Arson': start_fire(min(3, 2 + c))
            for _ in range(bad_in_hand):
                if rng.random() < 1 / 3: start_fire(1)
            self.cap -= max(0, dmg - cover)
            if self.cap <= 0: raise Lose('damage')

    def run(self):
        self.shop(first=True)
        for rnd in range(1, 5):
            try: self.play_round(rnd)
            except Lose as e:
                return dict(won=False, died=rnd, why=e.why, desc=self.desc, gold=self.gold, stats=self.stats)
            if rnd < 4: self.shop()
        return dict(won=True, died=None, gold=self.gold, cap=self.cap, plots=len(self.plots),
                    wells=sum(p is not None for p in self.plots), stats=self.stats)


def S(name, **kw):
    d = dict(name=name, reserve=4, pre_reserve=6, prospect=True, buys=[], dirty=True, strip=False,
             skim_shop=False, skim_keep=12, petty=True, petty_keep=6)
    d.update(kw); return d

STRATS = [
    S('Builder', buys=['Storage Tank', 'Wildcat Well', 'Shore Up', 'Fire Brigade', 'Dynamite']),
    S('Fighter', buys=['Lawyer Up', 'Dynamite', 'Bribe the Sheriff', 'Hired Hand', 'Pay Wages', 'Fire Brigade']),
    S('Skimmer', buys=['Dynamite', 'Lawyer Up'], skim_shop=True, skim_keep=8, petty_keep=3),
    S('Clean Hands', buys=['Lawyer Up', 'Shore Up', 'Pay Wages', 'Fire Brigade', 'Hired Hand'], dirty=False),
    S('Hoarder', buys=['Lookout', 'Fire Brigade', 'Dynamite'], reserve=9, pre_reserve=10, petty=False),
    S('Random', buys=[]),
]


def simulate(n=4000, seed=3):
    out = {}
    for s in STRATS:
        for b in BONUSES:
            rng = random.Random(seed)
            reach, wins, gold, why, deaths, stats, wells = Counter(), 0, [], Counter(), Counter(), Counter(), []
            for _ in range(n):
                r = Game(s, b, rng).run()
                last = 5 if r['won'] else r['died']
                for k in range(2, last + 1): reach[k] += 1
                stats.update(r['stats'])
                if r['won']: wins += 1; gold.append(r['gold']); wells.append(r['wells'])
                else:
                    why[r['why']] += 1
                    for nm in r['desc'][0]: deaths[f"R{r['died']} {nm}"] += 1
            out[f"{s['name']} | {b}"] = dict(
                survive=[round(100 * reach[k] / n, 1) for k in (2, 3, 4, 5)],
                gold=round(sum(gold) / len(gold), 1) if gold else 0,
                wells=round(sum(wells) / len(wells), 1) if wells else 0,
                why=dict(why), deaths=dict(deaths.most_common(5)),
                per_run={k: round(v / n, 2) for k, v in stats.items()})
    return out


def r1_lethality(n=4000, seed=5):
    res = {}
    for th in R1:
        rng = random.Random(seed); dead = 0
        for _ in range(n):
            g = Game(STRATS[0], '3 Oil', rng); g.shop(first=True)
            orig = rng.choice
            rng.choice = lambda seq, th=th, o=orig: th if seq is R1 else o(seq)
            try: g.play_round(1)
            except Lose: dead += 1
            finally: del rng.choice
        res[th] = round(100 * dead / n, 1)
    return res


if __name__ == '__main__':
    out = simulate()
    leth = r1_lethality()
    json.dump(dict(results=out, r1=leth), open('/home/claude/v3_results.json', 'w'), indent=1)
    print(f"{'strategy | bonus':34}{'R1':>6}{'R2':>6}{'R3':>6}{'WIN':>6}{'gold':>6}{'wells':>6}")
    for k, v in out.items():
        print(f"{k:34}" + ''.join(f"{x:6}" for x in v['survive']) + f"{v['gold']:6}{v['wells']:6}")
    print('R1 death rate by threat (Builder, 3 Oil):', leth)
