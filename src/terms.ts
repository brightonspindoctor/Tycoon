// Glossary terms that unlock when you first get the card that uses them. Each one says what the
// term means and gives a real case. Kept on the device: once found, a term stays in the glossary.
import type { CardKey } from './engine/data'

export interface Term { term: string; means: string; real: string }

export const TERMS: Partial<Record<CardKey, Term>> = {
  sustainabilityReport: {
    term: 'Greenwashing',
    means: 'Greenwashing is when a company makes itself look better for the environment than it really is, through its branding, reports and adverts rather than by changing what it does.',
    real: 'In 2000 BP rebranded as "Beyond Petroleum", with a green and yellow sunburst logo, while the great majority of its spending stayed on oil and gas.',
  },
  astroturfing: {
    term: 'Astroturfing',
    means: 'Astroturfing is when a company or industry creates a fake grassroots campaign: a group that looks like ordinary members of the public speaking up, but is organised and paid for behind the scenes. AstroTurf is fake grass.',
    real: 'In 2009 "Energy Citizens" rallies against US climate legislation were organised with the backing of the American Petroleum Institute, the oil industry\'s trade body, according to a leaked memo.',
  },
  recycling: {
    term: 'Recycling as a promise',
    means: 'Recycling as a promise is when an industry promotes recycling as the answer to its waste, so the problem looks solved and the responsibility moves to the person putting out the bins, even when most of it is never recycled.',
    real: 'A 2020 NPR and PBS Frontline investigation found the plastics industry promoted recycling while its own people doubted it would ever pay. The OECD estimates only about 9% of plastic waste is recycled.',
  },
  carbonOffsets: {
    term: 'Carbon offsets',
    means: 'Carbon offsets are credits a company buys for cutting or soaking up emissions somewhere else, such as by protecting a forest, and then counts against its own pollution.',
    real: 'A 2023 investigation by The Guardian, Die Zeit and SourceMaterial found that most rainforest offsets certified by Verra, the largest certifier, did not represent real cuts. In 2021 the Bootleg Fire in Oregon burned through a forest whose offset credits companies including Microsoft and BP had bought.',
  },
  carbonCapture: {
    term: 'Carbon capture and storage',
    means: 'Carbon capture and storage is catching carbon dioxide from a chimney or a gas field and pumping it underground, so that fossil fuels can keep being burned.',
    real: 'Chevron\'s Gorgon gas project in Western Australia, one of the largest carbon capture schemes in the world, stored about a third of the carbon dioxide it had been required to in its first five years, according to reports in 2021.',
  },
  propaganda: {
    term: 'Manufactured doubt',
    means: 'Manufactured doubt is when a company or industry spreads uncertainty about science that is already settled, so that action is delayed without it ever having to win the argument.',
    real: 'Exxon\'s own scientists modelled global warming accurately in the late 1970s and 1980s, a 2023 study in Science found, while the company publicly questioned climate science for decades.',
  },
  lobbyCongress: {
    term: 'Lobbying',
    means: 'Lobbying is when a company pays people to persuade lawmakers and officials to make decisions in its favour.',
    real: 'In 2021 a senior Exxon lobbyist was filmed by Greenpeace\'s Unearthed, posing as recruiters, describing how the company worked with senators to weaken climate measures in a US infrastructure bill.',
  },
  onThePayroll: {
    term: 'The revolving door',
    means: 'The revolving door is when people move between jobs in government and jobs in the industries that government regulates, in either direction, taking their contacts with them.',
    real: 'Rex Tillerson went from chairman and chief executive of ExxonMobil to US Secretary of State in 2017.',
  },
  thinkTank: {
    term: 'Front groups and think tanks',
    means: 'Front groups and think tanks are organisations with independent-sounding names that are funded by an industry and argue its case.',
    real: 'The Global Climate Coalition (1989–2001), funded by fossil fuel and car companies, campaigned against the Kyoto Protocol even though its own scientific advisers had told it in 1995 that the science of greenhouse warming was well established.',
  },
  buryEvidence: {
    term: 'Burying research',
    means: 'Burying research is when a company keeps what its own scientists found away from the public, because the findings are bad for business.',
    real: 'Scientists at the French oil company Total were warned in 1971 that burning fossil fuels could cause significant warming, a 2021 study found, decades before the company publicly accepted it.',
  },
  advertorial: {
    term: 'Advertorials',
    means: 'An advertorial is a paid advert written to look like an opinion piece or a news article, so readers take it more seriously than an advert.',
    real: 'Mobil, and later ExxonMobil, ran weekly advertorials on the New York Times opinion page from 1972. A 2017 study by Geoffrey Supran and Naomi Oreskes found they cast doubt on climate science that the company\'s own documents accepted.',
  },
  bribeOfficial: {
    term: 'Bribery',
    means: 'Bribery is secretly paying officials to make decisions in your favour, such as who wins a contract.',
    real: 'Brazil\'s Operation Car Wash, from 2014, uncovered years of bribes paid to secure contracts with the state oil company Petrobras, and led to the conviction of business leaders and politicians.',
  },
  bridgeFuel: {
    term: 'Bridge fuel',
    means: 'A bridge fuel is how the gas industry describes natural gas: a cleaner stepping stone from coal to renewable energy, which keeps gas in use for decades.',
    real: 'Gas burns cleaner than coal, but its main ingredient, methane, is a far stronger greenhouse gas when it leaks. A 2018 study in Science estimated leaks from the US oil and gas industry were about 60% higher than the official estimate.',
  },
  influencers: {
    term: 'Influencer marketing',
    means: 'Influencer marketing is when a company pays people with a big social media following to promote its product as if it were their own choice.',
    real: 'In 2020 the American Public Gas Association paid Instagram influencers to praise cooking with gas stoves, Mother Jones reported.',
  },
  climateBreakdown: {
    term: 'Profiting from the crisis',
    means: 'Profiting from the crisis is when a company treats the damage from climate change as a new business opportunity.',
    real: 'As Arctic sea ice shrank, oil companies looked to drill in waters that had been frozen. Shell drilled off Alaska in 2012 and 2015 before abandoning the attempt.',
  },
  oilShock: {
    term: 'The oil shocks',
    means: 'An oil shock is a sudden jump in the price of oil caused by a cut in supply, often for political reasons.',
    real: 'In 1973 Arab oil producers embargoed the US and other countries, and the price of oil roughly quadrupled within months. A second shock followed in 1979.',
  },
  greenProject: {
    term: 'Development finance',
    means: 'Development finance is money lent by international banks to fund projects in poorer countries, which has often included oil, gas and coal.',
    real: 'The World Bank lent for oil and gas projects for decades. In 2017 it announced it would stop financing oil and gas extraction after 2019.',
  },
}

const KEY = 'tycoon.terms'
export function loadFound(): CardKey[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as CardKey[] } catch { return [] }
}
/** Marks the terms for these cards as found; returns the ones that are new. */
export function findTerms(keys: CardKey[]): Term[] {
  const found = new Set(loadFound())
  const fresh = [...new Set(keys)].filter(k => TERMS[k] && !found.has(k))
  if (!fresh.length) return []
  try { localStorage.setItem(KEY, JSON.stringify([...found, ...fresh])) } catch { /* not kept */ }
  return fresh.map(k => TERMS[k]!)
}

// Pharmaceutical terms: found the first time the card is in your deck. Kept apart from the Oil
// terms so the Oil achievement for finding every term isn't moved.
export const PHARMA_TERMS: Record<string, Term> = {
  snakeOil: {
    term: 'Patent medicine',
    means: 'A patent medicine was a branded remedy sold straight to the public, with no proof that it worked and often no list of what was in it. Many were mostly alcohol, opium or cocaine.',
    real: "Lydia E. Pinkham's Vegetable Compound, sold from the 1870s for women's complaints, was around 20% alcohol.",
  },
  biopiracy: {
    term: 'Biopiracy',
    means: 'Biopiracy is patenting a medicine or plant that comes from traditional knowledge, without the permission of the people it came from or paying them.',
    real: 'In 1995 the US granted a patent on using turmeric to heal wounds, a remedy long used in India. It was revoked in 1997 after an Indian research council challenged it.',
  },
  inventAilment: {
    term: 'Disease mongering',
    means: 'Disease mongering is widening the definition of a condition, or inventing one, so more people believe they need a treatment for it.',
    real: 'In the 1920s Listerine adverts made "halitosis", an obscure medical word for bad breath, into a social disaster that only mouthwash could fix. Sales rose sharply.',
  },
  kickback: {
    term: 'Kickback',
    means: 'A kickback is a hidden payment to a doctor, buyer or official in return for their business, such as prescribing your drug.',
    real: 'In 2012 GlaxoSmithKline pleaded guilty and agreed to pay $3 billion in the US, partly over paying doctors through trips and speaking fees to promote its drugs.',
  },
  testimonials: {
    term: 'Testimonials',
    means: 'A testimonial is a customer saying a product worked for them. Patent-medicine makers printed thousands, many bought, edited or made up.',
    real: "Samuel Hopkins Adams's 1905 series The Great American Fraud showed testimonials being bought, and some from people who had since died of the illness they claimed was cured.",
  },
  nda: {
    term: 'Non-disclosure agreement',
    means: 'A non-disclosure agreement (NDA) is a contract that pays someone, or binds them, to keep quiet. In drug-harm cases it is often part of a settlement.',
    real: 'Confidential settlements in drug-injury lawsuits can keep what a company knew out of public view. Several US states have passed laws limiting secrecy in settlements that involve public safety.',
  },
  medicineShow: {
    term: 'Medicine show',
    means: 'A medicine show was a travelling act of music, comedy and spectacle put on to draw a crowd for a sales pitch for remedies.',
    real: 'The Kickapoo Indian Medicine Company toured America from the 1880s with shows built around invented "Indian" remedies, none of them made by the Kickapoo people.',
  },
  freeSamples: {
    term: 'Free samples',
    means: 'Drug companies give doctors free samples to hand out. Patients start on the branded drug, and tend to stay on it.',
    real: 'US studies have found doctors who accept free samples are more likely to prescribe the more expensive branded drugs.',
  },
  charityGala: {
    term: 'Reputation laundering',
    means: 'Reputation laundering is giving to charities, museums and the arts so a company or family is known for its generosity rather than how it made its money.',
    real: 'The Sackler family, owners of OxyContin maker Purdue Pharma, gave their name to galleries at the Louvre, the Met and Tate. From 2019 those museums began taking the name down.',
  },
}

const PHARMA_KEY = 'tycoon.pharmaTerms'
export function loadPharmaFound(): string[] {
  try { return JSON.parse(localStorage.getItem(PHARMA_KEY) ?? '[]') as string[] } catch { return [] }
}
/** Marks the Pharmaceutical terms for these cards as found; returns the ones that are new. */
export function findPharmaTerms(keys: string[]): Term[] {
  const found = new Set(loadPharmaFound())
  // any remedy counts as finding "Patent medicine"
  const norm = keys.map(k => (['snakeOil', 'vegetableCompound', 'cocaineTonic', 'soothingSyrup', 'heroinSyrup'].includes(k) ? 'snakeOil' : k))
  const fresh = [...new Set(norm)].filter(k => PHARMA_TERMS[k] && !found.has(k))
  if (!fresh.length) return []
  try { localStorage.setItem(PHARMA_KEY, JSON.stringify([...found, ...fresh])) } catch { /* not kept */ }
  return fresh.map(k => PHARMA_TERMS[k])
}
