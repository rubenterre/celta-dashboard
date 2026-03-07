    // URL donde sirves tu JSON desde Node/Express
    const API_URL = '/.netlify/functions/laliga-standings';

    async function loadStandings () {
      const errorEl = document.getElementById('error-message');
      const tbody = document.getElementById('table-body');
      const seasonPill = document.getElementById('season-pill');
      const updatedLabel = document.getElementById('updated-label');
      const celtaPosEl = document.getElementById('celta-pos');
      const footerCompetition = document.getElementById('footer-competition');

      errorEl.style.display = 'none';
      errorEl.textContent = '';

      try {
        const res = await fetch(API_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error('Error HTTP ' + res.status);
        const data = await res.json();

        const standings = data.standings || [];
        console.log(standings)
        const season = data.season || '';
        const competition = data.competition || 'LALIGA EA SPORTS';
        const updatedAt = data.updatedAt ? new Date(data.updatedAt) : null;

        seasonPill.textContent = season ? `${season} · ${competition}` : competition;
        footerCompetition.textContent = competition + ' · Football-data.org';

        if (updatedAt) {
          updatedLabel.textContent = 'Actualizado ' + updatedAt.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });
        } else {
          updatedLabel.textContent = 'Fecha de actualización no disponible';
        }

        tbody.innerHTML = '';

        let celtaPositionText = '–';

        standings.forEach(team => {
          const tr = document.createElement('tr');

          const posTd = document.createElement('td');
          posTd.className = 'pos';
          if (team.position && team.position <= 4) {
            posTd.classList.add('pos-top4');
          }
          posTd.textContent = team.position ?? '';
          tr.appendChild(posTd);

          const teamTd = document.createElement('td');
          teamTd.className = 'team-col';
          const teamWrapper = document.createElement('div');
          teamWrapper.className = 'team-name' + (team.is_celta ? ' celta' : '');
const dot = document.createElement('div')
dot.className = 'team-dot'

if (team.logo) {
  const img = document.createElement('img')
  img.src = team.logo
  img.alt = team.team || ''
  img.loading = 'lazy'
  img.style.width = '18px'
  img.style.height = '18px'
  img.style.borderRadius = '999px'
  img.style.objectFit = 'cover'
  dot.innerHTML = ''
  dot.appendChild(img)
}

const nameSpan = document.createElement('span');
nameSpan.className = 'team-name-text';   
nameSpan.textContent = team.team || '';
teamWrapper.appendChild(dot);
teamWrapper.appendChild(nameSpan);



          if (team.is_celta) {
            const badge = document.createElement('span');
            badge.className = 'badge badge-celta';
            badge.textContent = 'Celta';
            teamWrapper.appendChild(badge);
            celtaPositionText = team.position != null ? String(team.position) : '–';
          }

          teamTd.appendChild(teamWrapper);
          tr.appendChild(teamTd);

          const numericCols = [
            'played',
            'wins',
            'draws',
            'losses',
            'goals_for',
            'goals_against',
            'goal_diff',
            'points'
          ];

          numericCols.forEach(key => {
            const td = document.createElement('td');
            td.textContent = team[key] != null ? team[key] : '';
            tr.appendChild(td);
          });

          tbody.appendChild(tr);
        });

        celtaPosEl.textContent = celtaPositionText;

        if (!standings.length) {
          errorEl.style.display = 'block';
          errorEl.textContent = 'No se recibieron datos de clasificación. Comprueba el servicio de scraping.';
        }
      } catch (err) {
        console.error(err);
        errorEl.style.display = 'block';
        errorEl.textContent = 'Error al cargar la clasificación: ' + err.message;
        updatedLabel.textContent = 'Error de conexión';
      }
    }

    loadStandings();
    setInterval(loadStandings, 5 * 60 * 1000);
  