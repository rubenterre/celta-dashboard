// netlify/functions/laliga-standings.js
const axios = require('axios');
const cheerio = require('cheerio');

const URL_AS = 'https://as.com/resultados/futbol/primera/clasificacion/';

function toInt(value) {
  const n = parseInt(String(value).replace(/\D+/g, ''), 10);
  return Number.isNaN(n) ? 0 : n;
}

async function scrapeAsStandings() {
  const res = await axios.get(URL_AS, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
    },
  });

  const $ = cheerio.load(res.data);
  const standings = [];

  $('table tr').each((_, row) => {
    const th = $(row).find('th.fix');
    const tds = $(row).find('td');

    if (!th.length || tds.length < 8) return;

    // POSICIÓN (span.a_tb_ps dentro del th)
    const pos = toInt(th.find('.a_tb_ps').text());
    if (pos === 0) return;

    // NOMBRE DEL EQUIPO (span._hidden-xs dentro del enlace)
    let teamName =
      th.find('a ._hidden-xs').first().text().trim() ||
      th.find('a').first().text().trim();

    teamName = teamName.replace(/\s+/g, ' ').trim();

    // ESCUDO (img dentro del <a>)
    const logoEl = th.find('a img.a_bd_i').first();
    const logoUrl = logoEl.attr('src') || logoEl.attr('data-src') || null;

    // COLUMNAS numéricas (en los <td>)
    // td[0] -> PTS
    // td[1] -> PJ
    // td[2] -> G
    // td[3] -> E
    // td[4] -> P
    // td[5] -> GF
    // td[6] -> GC
    // td[7] -> DIF (a veces)
    const points = toInt($(tds[0]).text());
    const played = toInt($(tds[1]).text());
    const wins = toInt($(tds[2]).text());
    const draws = toInt($(tds[3]).text());
    const losses = toInt($(tds[4]).text());
    const goalsFor = toInt($(tds[5]).text());
    const goalsAgainst = toInt($(tds[6]).text());
    const diffFromTable = toInt($(tds[7]).text());
    const goalDiff = diffFromTable || goalsFor - goalsAgainst;

    standings.push({
      position: pos,
      team: teamName,
      played,
      wins,
      draws,
      losses,
      goals_for: goalsFor,
      goals_against: goalsAgainst,
      goal_diff: goalDiff,
      points,
      is_celta: /celta/i.test(teamName),
      logo: logoUrl,
    });
  });

  standings.sort((a, b) => a.position - b.position);

  const payload = {
    season: '2025-2026',
    competition: 'LALIGA EA SPORTS',
    updatedAt: new Date().toISOString(),
    standings,
  };

  return payload;
}

// Netlify function handler
exports.handler = async (event, context) => {
  try {
    const payload = await scrapeAsStandings();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(payload),
    };
  } catch (err) {
    console.error('Error al scrapear AS:', err.message);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Error al scrapear AS',
        details: err.message,
      }),
    };
  }
};
