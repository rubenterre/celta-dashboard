// netlify/functions/laliga-standings.js
const axios = require('axios');

const API_BASE = 'https://api.football-data.org/v4';
const LALIGA_COMPETITION_ID = '2014'; // LaLiga

exports.handler = async (event, context) => {
  try {
    const apiToken = process.env.FOOTBALL_DATA_TOKEN;

    const res = await axios.get(
      `${API_BASE}/competitions/${LALIGA_COMPETITION_ID}/standings`,
      {
        headers: {
          'X-Auth-Token': apiToken,
        },
      }
    );

    const data = res.data;

    const season = data.season
      ? `${data.season.startDate?.slice(0, 4)}/${data.season.endDate?.slice(0, 4)}`
      : '';
    const competition = data.competition?.name || 'LALIGA EA SPORTS';

    // Buscamos la tabla TOTAL
    const totalStanding =
      (data.standings || []).find((s) => s.type === 'TOTAL') ||
      data.standings?.[0];

    const table = totalStanding?.table || [];

    const standings = table.map((row) => ({
      position: row.position,
      team: row.team?.name || '',
      played: row.playedGames,
      wins: row.won,
      draws: row.draw,
      losses: row.lost,
      goals_for: row.goalsFor,
      goals_against: row.goalsAgainst,
      goal_diff: row.goalDifference,
      points: row.points,
      is_celta: /celta/i.test(row.team?.name || ''),
      logo: row.team?.crest || row.team?.crestUrl || null,
    }));

    const payload = {
      season: season || '2025-2026',
      competition,
      updatedAt: new Date().toISOString(),
      standings,
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(payload),
    };
  } catch (err) {
    console.error('Error al consultar Football-Data:', err.response?.data || err.message);

    return {
      statusCode: err.response?.status || 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Error al obtener la clasificación',
        details: err.response?.data || err.message,
      }),
    };
  }
};
