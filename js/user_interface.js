import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://ztfdmvegomhnujwvjmft.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0ZmRtdmVnb21obnVqd3ZqbWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyOTM1ODYsImV4cCI6MjA3Nzg2OTU4Nn0.btKAOSkwFZAR3y8I6fuK4MtwExeTollGeQYs8Jcek8U'
const supabase = createClient(supabaseUrl, supabaseKey)

// const { data: attendees, error: attendees_error } = await supabase
//   .from('attendees')
//   .select('*')
//   .order('name', { ascending: true });

// const select = document.getElementById("players");

// select.innerHTML = '<option value=""></option>' +
//   attendees
//     .map(p => `<option value="${p.id}">${p.name}</option>`)
//     .join('');

const { data: attendees, error: attendees_error } = await supabase
  .from('attendees')
  .select('*')
  .order('name', { ascending: true });

// PLAYER
const input = document.getElementById("player-search");
const results = document.getElementById("player-results");

// Hide dropdown initially
results.classList.add("hidden");

input.addEventListener("input", () => {
  const query = input.value.toLowerCase();

  if (query.trim() === "") {
    results.innerHTML = "";
    results.classList.add("hidden");
    return;
  }

  results.style.width = `${input.offsetWidth}px`;

  const filtered = attendees.filter(p =>
    p.name.toLowerCase().includes(query)
  );

  results.innerHTML = filtered
    .map(p => `<li data-id="${p.id}">${p.name}</li>`)
    .join("");

  results.classList.remove("hidden");
});

// Click-to-select
results.addEventListener("click", (e) => {
  if (e.target.matches("li")) {
    input.value = e.target.textContent;
    input.dataset.playerId = e.target.dataset.id;
    results.classList.add("hidden");
  }
});

// SINGER
const singerSearch = document.getElementById("singer-search");
const singerResults = document.getElementById("singer-results");

// Hide dropdown initially
singerResults.classList.add("hidden");

singerSearch.addEventListener("input", () => {
  const query = singerSearch.value.toLowerCase();

  if (query.trim() === "") {
    singerResults.innerHTML = "";
    singerResults.classList.add("hidden");
    return;
  }

  singerResults.style.width = `${singerSearch.offsetWidth}px`;

  const filtered = attendees
    .filter(p => p.id != player.id)
    .filter(p => p.name.toLowerCase().includes(query));

  singerResults.innerHTML = filtered
    .map(p => `<li data-id="${p.id}">${p.name}</li>`)
    .join("");

    singerResults.classList.remove("hidden");
});

// Click-to-select
singerResults.addEventListener("click", (e) => {
  if (e.target.matches("li")) {
    singerSearch.value = e.target.textContent;
    singerSearch.dataset.playerId = e.target.dataset.id;
    singerResults.classList.add("hidden");
  }
});

let player;
let current_singer;
let winner;
let player_id;
let current_game_status;
let game_status;

let mainInterval;
let heartbeatInterval;
let fetchWinnerInterval;

let {data: singers, error} = await supabase
  .from('secret_singers')
  .select('*')
  .eq('is_done', 'N')
  .order('singer_num', { ascending: true })
  .limit(1);

  current_singer = singers[0];


const cutoff = new Date(Date.now() - 30000).toISOString();
await supabase
  .from('attendees')
  .update({ is_playing: 'N' })
  .lt('last_seen', cutoff);

document.querySelector(".start-button").addEventListener("click", async function() {
  
  let selected = input.dataset.playerId;
  if (!selected){
    document.querySelector(".error-message").innerHTML = "Please select a player.";
    return;
  }
  const { data: existing } = await supabase
      .from('attendees')
      .select('*')
      .eq('id', selected)
      .eq('is_playing', 'Y');

    if (existing?.length > 0){
        document.querySelector(".error-message").innerHTML = "This player is already logged in on another device.";
    }
    else {
      player_id = selected;
      const { data: players } = await supabase
      .from('attendees')
      .select('*')
      .eq('id', selected);

      player = players[0];
      
      await supabase
      .from('attendees')
      .update({ is_playing: 'Y' })
      .eq('id', player_id);

      startHeartbeat();

      
      // const sc = document.getElementById('singer-choice');
      // sc.innerHTML = '<option value=""></option>' +
      // attendees
      //   .filter(p => p.id != player.id)
      //   .map(p => `<option value="${p.id}">${p.name}</option>`)
      //   .join('');
      
      document.querySelector(".player-selection").style.display = 'none';
      document.querySelector(".game-screen").style.display = 'flex';
      document.querySelector('.back-btn').style.display = 'block';

      mainInterval = setInterval(main, 500);
      main();
    }
});

async function startHeartbeat() {
  stopHeartbeat(); // prevent duplicates
  heartbeatInterval = setInterval(async () => {
    if (!player_id) return;
    await supabase
      .from('attendees')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', player_id);
  }, 15000); // every 15 seconds
}

function stopHeartbeat() {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
}

document.querySelector(".submit-button").addEventListener("click", async function() {
  // let guess_id = document.getElementById('singer-choice').value;
  let guess_id = document.getElementById('singer-search').dataset.playerId;
  if (guess_id){
    const { data: insert, error: insert_error } = await supabase
    .from('user_guesses')
    .insert([{ game_status_id : game_status.id, user_id : player_id, guess_id : guess_id}]);

    document.querySelector('.submit-button').style.display = 'none';
    // document.getElementById('singer-choice').style.display = 'none';
    document.getElementById('singer-search').style.display = 'none';
    document.querySelector(".singing .game .label").style.display = 'none';

    const { data: pick } = await supabase
    .from('attendees')
    .select('*')
    .eq('id', guess_id)
    .limit(1);

    document.querySelector(".pick").innerHTML = `You picked ${pick[0].name}.<br>Wait for the singer to finish.`
  }
});

// document.getElementById("players").addEventListener("change", function() {
//   if (select.value){
//     document.querySelector(".error-message").innerHTML = "";
//   }
// });

document.querySelector(".back-btn").addEventListener("click", async function() {
  if (!player_id) return;
  stopHeartbeat();
  const url = `${supabaseUrl}/rest/v1/attendees?id=eq.${player_id}`;
  const body = JSON.stringify({ is_playing: 'N' });

  try {
    navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
  } catch (e) {
    // ignore
  }

  fetch(url, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body,
    keepalive: true
  }).catch((err) => {
    console.warn('unload update failed', err);
  });

  await new Promise(r => setTimeout(r, 1000));

  location.reload(true);
});

// in case of reloading or closing the app
window.addEventListener("beforeunload", function() {
    if (!player_id) return;
    stopHeartbeat();
    const url = `${supabaseUrl}/rest/v1/attendees?id=eq.${player_id}`;
    const body = JSON.stringify({ is_playing: 'N' });
  
    try {
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
    } catch (e) {
      // ignore
    }
  
    fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body,
      keepalive: true
    }).catch((err) => {
      console.warn('unload update failed', err);
    });
});

async function fetchWinner(){
  const { data: winners, error: winners_error } = await supabase
  .from('winners')
  .select('*')
  .eq('singer_num', current_singer.singer_num)
  .eq('singer_id', current_singer.id)
  .limit(1);

  winner = winners[0];

  if (winner.player_id){
    if (player.id == winner.player_id){
      document.querySelector('.winner .game').textContent = `✔ Your guess is correct!`;
    }

    else{
      // if (document.getElementById('singer-choice').value == winner.singer_id){
        if (Number(document.getElementById('singer-search').dataset.playerId) == winner.singer_id){
        document.querySelector('.winner .game').textContent = `✘ You guess is correct but someone got it first. `;
      }
      else{
        document.querySelector('.winner .game').textContent = `✘ Your guess is incorrect. `;
      }
    }
    clearInterval(fetchWinnerInterval);
  }
}

async function main(){
  const { data: status, error: status_error } = await supabase
  .from('game_status')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(1);

  game_status = status[0];

  if (current_game_status != game_status.status_id){
    current_game_status = game_status.status_id;

    document.querySelectorAll('.game-screen').forEach(el => {
      el.style.display = 'none';
    });

    if(current_game_status == 'GAME_START'){
      document.querySelector('.game-start').style.display = 'flex';

      document.querySelector('.game-start .header').innerHTML = `MCC HIDDEN SINGER`;
      document.querySelector('.game-start .game').innerHTML = `Welcome<br>${player.name}!<br><br>Please wait for the game to start.`;
    }
    else if(current_game_status == 'IDLE'){
      document.querySelector('.idle').style.display = 'flex';

      let {data: singers, error} = await supabase
      .from('secret_singers')
      .select('*')
      .eq('is_done', 'N')
      .order('singer_num', { ascending: true })
      .limit(1);

      current_singer = singers[0];

      document.querySelector('.idle .header').innerHTML = `Playing as<br>${player.name}`;
      document.querySelector('.idle .game').textContent = `Waiting for hidden singer # ${current_singer.singer_num} to sing.`;
    }
    else if(current_game_status == 'SINGING'){
      singerSearch.value = '';
      singerSearch.dataset.playerId = '';

      document.querySelector('.singing').style.display = 'flex';
      document.querySelector('.submit-button').style.display = 'none';
      // document.getElementById('singer-choice').style.display = 'none';
      document.getElementById('singer-search').style.display = 'none';
      document.querySelector(".singing .game .label").style.display = 'none';

      let {data: guess, error} = await supabase
      .from('user_guesses')
      .select('*')
      .eq('game_status_id', game_status.id)
      .eq('user_id', player.id)
      .limit(1);

      if (guess.length > 0){
        const { data: pick } = await supabase
        .from('attendees')
        .select('*')
        .eq('id', guess[0].guess_id)
        .limit(1);
        // document.getElementById('singer-choice').value = guess[0].guess_id;
        document.getElementById('singer-search').dataset.playerId = `${guess[0].guess_id}`;
        document.querySelector(".pick").innerHTML = `You picked ${pick[0].name}.<br>Wait for the singer to finish.`;
        return;
      }

      document.querySelector('.singing .header').textContent = `Playing as ${player.name}`;
      document.querySelector('.singing .game .label').innerHTML = `Singing...<br>Guess the hidden singer:`;
      document.querySelector('.pick').textContent = ``;

      document.querySelector('.submit-button').style.display = 'block';
      // document.getElementById('singer-choice').style.display = 'block';
      document.getElementById('singer-search').style.display = 'block';
      document.querySelector(".singing .game .label").style.display = 'block';
      
    }
    else if(current_game_status == 'WINNER'){
      document.querySelector('.winner').style.display = 'flex';

      let {data: guess, error} = await supabase
      .from('user_guesses')
      .select('*')
      .eq('game_status_id', game_status.id)
      .eq('user_id', player.id)
      .limit(1);

      let guess_name;
      if (guess.length > 0){
        guess_id_input = guess[0].guess_id;
        const { data: pick } = await supabase
        .from('attendees')
        .select('*')
        .eq('id', guess[0].guess_id)
        .limit(1);
        // document.getElementById('singer-choice').value = guess[0].guess_id;
        document.getElementById('singer-search').dataset.playerId = guess[0].guess_id;
        guess_name = pick[0].name;
      }
      else {
        const { data: pick } = await supabase
        .from('attendees')
        .select('*')
        // .eq('id', document.getElementById('singer-choice').value)
        .eq('id', document.getElementById('singer-search').dataset.playerId)
        .limit(1);
        guess_name = pick[0].name;
      }

      document.querySelector('.winner .header').textContent = `Playing as ${player.name}`;
      document.querySelector('.winner .game').innerHTML = `You picked ${guess_name}.<br>Evaluating the winner...`;

      fetchWinnerInterval = setInterval(fetchWinner, 500);
      fetchWinner();
    }
    else if(current_game_status == 'GAME_OVER'){
      document.querySelector('.game-over').style.display = 'flex';

      document.querySelector('.game-over .game').textContent = `Game Over`;
    }
  }
}
